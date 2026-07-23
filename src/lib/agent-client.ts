import { agentConfig } from "./agent-config"
import { createUuid } from "./uuid"

export type PolicyPageContext =
  | {
      scene: "enterprise_detail"
      enterpriseId: string
    }
  | {
      scene: "policy_detail"
      policyId: string
      projectId?: string
    }
  | {
      scene: "match_result"
      matchId: string
    }

export type AgentMessage = {
  id: string
  role: "user" | "assistant" | string
  content: string
  created_at?: string | null
}

export type AguiEvent = {
  type?: string
  delta?: string
  content?: string
  text?: string
  message?: string
  messageId?: string
  message_id?: string
  error?: unknown
  [key: string]: unknown
}

type CaptchaResponse = {
  captchaEnabled?: boolean
  uuid: string
  img: string
}

type LoginResponse = {
  code?: string | number
  msg?: string
  token?: string
}

type AgentSession = {
  id: string
  title?: string
  status?: string
  agent_app_slug?: string
  [key: string]: unknown
}

type AgentTurn = {
  id: string
  session_id?: string
  status?: string
  [key: string]: unknown
}

type StreamTicket = {
  ticket: string
  expires_in?: number
}

export class AgentApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "AgentApiError"
    this.status = status
    this.code = code
  }
}

let token: string | null = null

const OK_CODES = new Set(["200", "C00000"])

async function parseBody(response: Response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

function errorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback
  const record = body as Record<string, unknown>
  const nestedError = record.error
  if (nestedError && typeof nestedError === "object") {
    const message = (nestedError as Record<string, unknown>).message
    if (typeof message === "string") return message
  }
  if (typeof record.msg === "string") return record.msg
  if (typeof record.detail === "string") return record.detail
  return fallback
}

async function javaJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  const body = await parseBody(response)

  const businessCode = body && typeof body === "object" ? (body as Record<string, unknown>).code : undefined
  const businessFailed = businessCode !== undefined && !OK_CODES.has(String(businessCode))

  if (!response.ok || businessFailed) {
    throw new AgentApiError(
      errorMessage(body, `请求失败（HTTP ${response.status}）`),
      response.status,
      businessCode !== undefined ? String(businessCode) : undefined
    )
  }

  return body as T
}

export async function fetchCaptcha() {
  return javaJson<CaptchaResponse>("/captchaImage")
}

export async function loginWithCaptcha(code: string, uuid: string) {
  const body = await javaJson<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({
      username: agentConfig.username,
      password: agentConfig.password,
      code,
      uuid,
    }),
  })

  if (!body.token) {
    throw new AgentApiError(body.msg || "登录失败", 200)
  }

  token = body.token
  return token
}

export function hasAgentToken() {
  return token !== null
}

export function clearAgentToken() {
  token = null
}

export function createAgentSession(title = "政策匹配助手") {
  return javaJson<AgentSession>("/api/agent/sessions", {
    method: "POST",
    body: JSON.stringify({
      title,
      agent_app_slug: agentConfig.agentAppSlug,
    }),
  })
}

export function sendAgentMessage(
  sessionId: string,
  content: string,
  fileIds: string[] = []
) {
  return javaJson<AgentTurn>("/api/agent/messages", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      content,
      idempotency_key: createUuid(),
      file_ids: fileIds,
      web_search_enabled: false,
    }),
  })
}

function getStreamTicket(sessionId: string, turnId: string) {
  return javaJson<StreamTicket>("/api/agent/stream-ticket", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, turn_id: turnId }),
  })
}

export async function getSessionMessages(sessionId: string, limit = 50) {
  const response = await javaJson<{ items?: AgentMessage[]; data?: AgentMessage[] }>(
    `/api/agent/sessions/${sessionId}/messages?limit=${limit}`
  )
  return response.items ?? response.data ?? []
}

export async function openAgentStream(
  sessionId: string,
  turnId: string,
  onEvent: (event: AguiEvent) => void
): Promise<EventSource> {
  const ticketResp = await getStreamTicket(sessionId, turnId)
  const url =
    `${agentConfig.velaBaseUrl}/api/federation/v1/sessions/${sessionId}/turns/${turnId}/stream` +
    `?ticket=${encodeURIComponent(ticketResp.ticket)}`

  const source = new EventSource(url)

  source.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as AguiEvent
      onEvent(payload)
    } catch {
      // 非 JSON 事件，忽略
    }
  }

  return source
}
