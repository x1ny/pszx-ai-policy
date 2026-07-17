import { velaConfig } from "./vela-config"

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

export type VelaMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  created_at?: string | null
}

export type AguiEvent = {
  type?: string
  delta?: string
  messageId?: string
  message_id?: string
  error?: unknown
  [key: string]: unknown
}

type LoginResponse = {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
}

type CopilotSession = {
  session_id: string
  profile: string
  profile_version: string
  runtime_url: string
}

type MessagesResponse = {
  data?: VelaMessage[]
}

export class VelaApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "VelaApiError"
    this.status = status
    this.code = code
  }
}

let accessToken: string | null = null

function getErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback

  const record = body as Record<string, unknown>
  const nestedError = record.error
  if (nestedError && typeof nestedError === "object") {
    const errorRecord = nestedError as Record<string, unknown>
    if (typeof errorRecord.message === "string") return errorRecord.message
  }
  if (typeof record.detail === "string") return record.detail
  if (typeof record.message === "string") return record.message
  return fallback
}

async function parseResponseBody(response: Response) {
  return response.json().catch(() => null)
}

async function velaRequest<T>(path: string, init: RequestInit = {}) {
  const token = accessToken
  const response = await fetch(`${velaConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    const body = await parseResponseBody(response)
    throw new VelaApiError(
      getErrorMessage(body, `Vela 请求失败（HTTP ${response.status}）`),
      response.status,
      body &&
        typeof body === "object" &&
        typeof (body as Record<string, unknown>).code === "string"
        ? ((body as Record<string, unknown>).code as string)
        : undefined
    )
  }

  return response.json() as Promise<T>
}

export async function loginToVela() {
  const response = await fetch(`${velaConfig.apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: velaConfig.email,
      password: velaConfig.password,
    }),
  })

  const body = await parseResponseBody(response)
  if (
    !response.ok ||
    !body ||
    typeof body !== "object" ||
    typeof (body as LoginResponse).access_token !== "string"
  ) {
    throw new VelaApiError(
      getErrorMessage(body, `Vela 登录失败（HTTP ${response.status}）`),
      response.status
    )
  }

  accessToken = (body as LoginResponse).access_token
  return accessToken
}

export function hasVelaToken() {
  return accessToken !== null
}

export function clearVelaToken() {
  accessToken = null
}

export function createPolicyCopilotSession() {
  return velaRequest<CopilotSession>(
    `/copilots/${velaConfig.copilotProfile}/sessions`,
    {
      method: "POST",
      body: JSON.stringify({ title: "政策匹配助手" }),
    }
  )
}

export async function getSessionMessages(sessionId: string) {
  const response = await velaRequest<MessagesResponse>(
    `/sessions/${sessionId}/messages`
  )
  return response.data ?? []
}

export function buildPolicyAguiInput(
  sessionId: string,
  content: string,
  pageContext?: PolicyPageContext
) {
  const runId = crypto.randomUUID()
  return {
    threadId: sessionId,
    runId,
    state: {},
    messages: [{ id: `msg_${runId}`, role: "user", content }],
    tools: [],
    context: pageContext
      ? [
          {
            description: "policy-copilot-context",
            value: JSON.stringify(pageContext),
          },
        ]
      : [],
    forwardedProps: {},
  }
}

async function* readSseEvents(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })

      const chunks = buffer.split(/\r?\n\r?\n/)
      buffer = chunks.pop() ?? ""
      for (const chunk of chunks) {
        const event = parseSseChunk(chunk)
        if (event) yield event
      }

      if (done) break
    }

    const trailingEvent = parseSseChunk(buffer)
    if (trailingEvent) yield trailingEvent
  } finally {
    reader.releaseLock()
  }
}

function parseSseChunk(chunk: string): AguiEvent | null {
  let eventName = ""
  const dataLines: string[] = []

  for (const line of chunk.split(/\r?\n/)) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim()
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart())
  }

  if (dataLines.length === 0) return null
  const data = dataLines.join("\n")
  if (data === "[DONE]") return { type: eventName || "DONE" }

  try {
    const parsed: unknown = JSON.parse(data)
    if (parsed && typeof parsed === "object") {
      const event = parsed as AguiEvent
      return event.type ? event : { ...event, type: eventName || undefined }
    }
    return { type: eventName, delta: String(parsed) }
  } catch {
    return { type: eventName || "TEXT_MESSAGE_CONTENT", delta: data }
  }
}

export async function streamPolicyCopilot(
  sessionId: string,
  content: string,
  pageContext: PolicyPageContext | undefined,
  onEvent: (event: AguiEvent) => void
) {
  const response = await fetch(`${velaConfig.apiBaseUrl}/agui/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(buildPolicyAguiInput(sessionId, content, pageContext)),
  })

  if (!response.ok) {
    const body = await parseResponseBody(response)
    throw new VelaApiError(
      getErrorMessage(body, `Vela 对话失败（HTTP ${response.status}）`),
      response.status,
      body &&
        typeof body === "object" &&
        typeof (body as Record<string, unknown>).code === "string"
        ? ((body as Record<string, unknown>).code as string)
        : undefined
    )
  }
  if (!response.body)
    throw new VelaApiError("Vela 未返回流式响应", response.status)

  for await (const event of readSseEvents(response.body)) onEvent(event)
}
