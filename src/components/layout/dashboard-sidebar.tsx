import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { useLocation } from "@tanstack/react-router"

import { VelaMarkdownMessage } from "@/components/vela-markdown-message"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import {
  createAgentSession,
  fetchCaptcha,
  getSessionMessages,
  hasAgentToken,
  loginWithCaptcha,
  openAgentStream,
  sendAgentMessage,
  type AgentMessage,
  type AguiEvent,
} from "@/lib/agent-client"
import { buildPolicyPageContext } from "@/lib/vela-context"
import { createUuid } from "@/lib/uuid"

const suggestions = [
  "当前政策匹配整体情况如何？",
  "哪些政策建议优先查看？",
  "高匹配、中匹配、低匹配分别代表什么？",
]

function getBusinessErrorMessage(event: AguiEvent) {
  const error = event.error
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    if (record.code === "COPILOT_PROFILE_UNAVAILABLE") {
      return "政策匹配助手暂时不可用，请稍后重试"
    }
    if (record.code === "CAPABILITY_UNAVAILABLE") {
      return "匹配数据服务暂时不可用，请稍后重试"
    }
  }
  return "服务请求失败，请稍后重试"
}

type AuthPhase = "idle" | "need_login" | "logging_in" | "ready"

export function DashboardSidebar() {
  const location = useLocation()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [autoScrollResetKey, setAutoScrollResetKey] = useState(0)

  const [authPhase, setAuthPhase] = useState<AuthPhase>("idle")
  const [captcha, setCaptcha] = useState<{ img: string; uuid: string } | null>(null)
  const [captchaCode, setCaptchaCode] = useState("")
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const pendingContentRef = useRef<string | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<string | null>(null)
  const sessionPromiseRef = useRef<Promise<string> | null>(null)
  const assistantMessageIdRef = useRef<string | null>(null)
  const streamFailedRef = useRef(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const messagesScrollKey = useMemo(
    () =>
      messages
        .map((message) => `${message.id}:${message.content.length}`)
        .join("|"),
    [messages]
  )
  useAutoScroll({
    containerRef: messagesContainerRef,
    messagesScrollKey,
    isRunning: isStreaming,
    resetKey: autoScrollResetKey,
  })

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true)
    setCaptchaCode("")
    try {
      const res = await fetchCaptcha()
      setCaptcha({ img: res.img, uuid: res.uuid })
    } catch {
      setLoginError("验证码加载失败，请重试")
    } finally {
      setCaptchaLoading(false)
    }
  }, [])

  const getOrCreateSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current
    if (!sessionPromiseRef.current) {
      sessionPromiseRef.current = createAgentSession()
        .then((session) => {
          sessionRef.current = session.id
          setSessionId(session.id)
          return session.id
        })
        .finally(() => {
          sessionPromiseRef.current = null
        })
    }
    return sessionPromiseRef.current
  }, [])

  const appendAssistantDelta = useCallback(
    (delta: string, messageId?: string) => {
      if (!delta) return
      setMessages((current) => {
        const currentAssistantId = assistantMessageIdRef.current
        if (currentAssistantId) {
          return current.map((message) =>
            message.id === currentAssistantId
              ? { ...message, content: `${message.content}${delta}` }
              : message
          )
        }

        const nextId = messageId || `assistant_${createUuid()}`
        assistantMessageIdRef.current = nextId
        return [...current, { id: nextId, role: "assistant", content: delta }]
      })
    },
    []
  )

  const runChat = useCallback(
    async (content: string) => {
      const pageContext = buildPolicyPageContext(
        location.pathname,
        location.search as Record<string, unknown>
      )
      const userMessage: AgentMessage = {
        id: `user_${createUuid()}`,
        role: "user",
        content,
      }

      setNotice(null)
      setAutoScrollResetKey((current) => current + 1)
      setMessages((current) => [...current, userMessage])
      setIsStreaming(true)
      assistantMessageIdRef.current = null
      streamFailedRef.current = false
      void pageContext // 页面上下文预留：后端接口目前不接受该字段，先构造好待接口支持后传入

      try {
        const currentSessionId = await getOrCreateSession()
        const turn = await sendAgentMessage(currentSessionId, content)

        await new Promise<void>((resolve) => {
          let settled = false
          const finish = () => {
            if (settled) return
            settled = true
            eventSourceRef.current?.close()
            eventSourceRef.current = null
            resolve()
          }

          openAgentStream(currentSessionId, turn.id, (event) => {
            switch (event.type) {
              case "TEXT_MESSAGE_START": {
                const assistantMessageId =
                  event.messageId ||
                  event.message_id ||
                  `assistant_${createUuid()}`
                assistantMessageIdRef.current = assistantMessageId
                setMessages((current) => {
                  if (current.some((message) => message.id === assistantMessageId)) {
                    return current
                  }
                  return [
                    ...current,
                    { id: assistantMessageId, role: "assistant", content: "" },
                  ]
                })
                break
              }
              case "TEXT_MESSAGE_CONTENT":
                appendAssistantDelta(
                  typeof event.delta === "string"
                    ? event.delta
                    : typeof event.content === "string"
                      ? event.content
                      : typeof event.text === "string"
                        ? event.text
                        : typeof event.message === "string"
                          ? event.message
                          : "",
                  typeof event.messageId === "string" ? event.messageId : undefined
                )
                break
              case "RUN_FINISHED":
                finish()
                break
              case "RUN_ERROR":
                streamFailedRef.current = true
                setNotice(getBusinessErrorMessage(event))
                finish()
                break
              default:
                break
            }
          })
            .then((source) => {
              eventSourceRef.current = source
              source.onerror = () => {
                streamFailedRef.current = true
                setNotice("AI 连接已断开，请重试")
                finish()
              }
            })
            .catch(() => {
              streamFailedRef.current = true
              setNotice("服务请求失败，请稍后重试")
              finish()
            })
        })

        if (!streamFailedRef.current) {
          const history = await getSessionMessages(currentSessionId)
          if (history.length > 0) {
            setMessages(
              history.filter(
                (message) => message.role === "user" || message.role === "assistant"
              )
            )
          }
        }
      } catch {
        setNotice("服务请求失败，请稍后重试")
      } finally {
        setIsStreaming(false)
        assistantMessageIdRef.current = null
      }
    },
    [appendAssistantDelta, getOrCreateSession, location.pathname, location.search]
  )

  const handleSubmit = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || isStreaming) return

      if (!hasAgentToken()) {
        pendingContentRef.current = trimmed
        setLoginError(null)
        setAuthPhase("need_login")
        void loadCaptcha()
        return
      }

      setInput("")
      await runChat(trimmed)
    },
    [isStreaming, loadCaptcha, runChat]
  )

  const handleLoginSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!captcha || !captchaCode.trim() || authPhase === "logging_in") return

      setAuthPhase("logging_in")
      setLoginError(null)
      try {
        await loginWithCaptcha(captchaCode.trim(), captcha.uuid)
        setAuthPhase("ready")
        setInput("")
        const pending = pendingContentRef.current
        pendingContentRef.current = null
        if (pending) void runChat(pending)
      } catch (error) {
        setAuthPhase("need_login")
        setLoginError(error instanceof Error ? error.message : "登录失败，请重试")
        void loadCaptcha()
      }
    },
    [authPhase, captcha, captchaCode, loadCaptcha, runChat]
  )

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSubmit(input)
  }

  const showLogin = authPhase === "need_login" || authPhase === "logging_in"

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-3 border-l border-border bg-gradient-to-b from-blue-50/80 to-blue-100/40 p-3.5">
      {/* 今日快讯 — 原型首页最终统一轮，装饰性标签使用 Tailwind 内置色 */}
      <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <span className="block h-4 w-1 rounded-full bg-amber-500" />
            今日快讯
          </div>
          <span className="cursor-pointer text-xs font-bold text-primary hover:underline">
            查看详情
          </span>
        </div>

        <div className="mb-2 flex flex-col gap-1.5 rounded-lg border border-border bg-muted/50 p-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-500 ring-1 ring-red-200">
              政策时效提醒
            </span>
            <span className="truncate font-medium text-foreground">
              2项申报临近截止
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[11px] font-bold text-green-600 ring-1 ring-green-200">
              当日新增政策
            </span>
            <span className="truncate font-medium text-foreground">
              新增2项惠企政策
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-600 ring-1 ring-blue-200">
              TOP 咨询问题
            </span>
            <span className="truncate font-medium text-foreground">
              高频咨询技改、高企
            </span>
          </div>
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-1.5 text-xs font-extrabold text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90">
          AI 生成工作建议
        </button>
      </section>

      {/* AI 聊天面板 — 全局持久化，路由切换时不重置 */}
      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 text-sm font-bold">
          <div className="flex items-center justify-between">
            <span className="text-primary">园区智能工作台</span>
            <span className="text-xs font-normal text-muted-foreground">
              {showLogin ? "待验证" : sessionId ? "已连接" : "未开始对话"}
            </span>
          </div>
        </div>

        {showLogin ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto bg-muted/30 p-4">
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              请输入验证码以启用 AI 助手
            </p>
            <form
              onSubmit={handleLoginSubmit}
              className="flex w-full flex-col gap-2.5 rounded-lg border border-border bg-card p-3 shadow-sm"
            >
              <button
                type="button"
                onClick={() => void loadCaptcha()}
                disabled={captchaLoading}
                className="flex h-10 items-center justify-center overflow-hidden rounded-md border border-input bg-background disabled:opacity-60"
                title="点击刷新验证码"
              >
                {captcha ? (
                  <img
                    src={`data:image/jpeg;base64,${captcha.img}`}
                    alt="验证码，点击刷新"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {captchaLoading ? "加载中..." : "加载失败，点击重试"}
                  </span>
                )}
              </button>
              <input
                type="text"
                value={captchaCode}
                onChange={(event) => setCaptchaCode(event.target.value)}
                placeholder="请输入验证码"
                disabled={authPhase === "logging_in"}
                className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              />
              {loginError && (
                <p className="text-xs leading-relaxed text-destructive">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={!captcha || !captchaCode.trim() || authPhase === "logging_in"}
                className="w-full rounded-md bg-primary py-2 text-xs font-extrabold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authPhase === "logging_in" ? "登录中..." : "登录并继续对话"}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div
              ref={messagesContainerRef}
              className="flex flex-1 flex-col gap-4 overflow-y-auto bg-muted/30 p-4"
            >
              {notice && (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
                  {notice}
                </p>
              )}

              {messages.length === 0 ? (
                <div className="max-w-[90%] self-start rounded-lg border border-border bg-card p-3 text-xs leading-relaxed shadow-sm">
                  <p>您好！我是您的政策匹配助手，可以基于当前页面数据快速分析：</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void handleSubmit(suggestion)}
                        disabled={isStreaming}
                        className="w-full rounded-xl border border-transparent bg-muted px-3 py-2 text-left text-xs text-primary transition-colors hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[90%] rounded-lg border p-3 text-xs leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "self-end border-primary/20 bg-primary text-primary-foreground"
                        : "self-start border-border bg-card"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <VelaMarkdownMessage content={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                ))
              )}

              {isStreaming && (
                <div className="max-w-[90%] self-start rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                  正在分析...
                </div>
              )}
            </div>

            <div className="border-t border-border bg-card p-4">
              <form onSubmit={handleFormSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="请输入您的问题（支持回车）..."
                  disabled={isStreaming}
                  className="w-full rounded-md border border-input bg-background py-2 pr-9 pl-2.5 text-xs transition-colors outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  aria-label="发送消息"
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer border-0 bg-transparent text-sm text-primary transition-colors disabled:cursor-not-allowed disabled:text-muted-foreground/40"
                >
                  ➤
                </button>
              </form>
              <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
                内容由AI生成，仅供参考
              </p>
            </div>
          </>
        )}
      </section>
    </aside>
  )
}
