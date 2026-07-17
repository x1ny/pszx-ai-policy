# 政策匹配 AI 前端接入接口文档

> 文档版本：1.0
> 更新日期：2026-07-16
> 对接对象：前端开发、联调测试、代码生成 AI
> Biz 服务地址：`http://10.2.1.16:31119`
> API Base URL：`http://10.2.1.16:31119/api/v1`

## 1. 前端只需理解的调用链

```text
业务前端
  → Vela Biz（JWT 鉴权、Session、AG-UI 流）
  → Vela Engine（内部，前端不调用）
  → Policy Skill + policy-copilot MCP（内部，前端不调用）
  → information-brief Java API（AI 内部读取权威业务数据）
```

前端必须遵守：

- AI 对话只调用 Vela Biz，不直连 Engine 或 MCP。
- `session_id`、`turn_id`、`runId` 只用于请求和状态关联，不作为业务文案展示。
- 前端不计算政策匹配分、匹配等级和条件状态。
- 不展示 MCP 工具名、调用参数、原始工具结果、内部 ID 和异常栈。
- 页面上的企业、政策、项目及匹配结果定位信息，通过 AG-UI `context` 传入。

## 2. 已部署接口的验证结果

2026-07-16 实际验证：

| 检查项 | 地址 | 结果 |
|---|---|---|
| Biz 健康检查 | `GET http://10.2.1.16:31119/health` | HTTP 200 |
| OpenAPI | `GET http://10.2.1.16:31119/openapi.json` | HTTP 200 |
| Policy Copilot Session | `POST /api/v1/copilots/policy-matching/sessions` | 路由存在，未登录返回 HTTP 401 |
| AG-UI Runtime | `POST /api/v1/agui/run` | OpenAPI 已发布 |

对接前提：测试用户能正常登录，Nacos 中已启用 `policy-matching` Profile，Engine 能发现 `policy-copilot` MCP。

## 3. 鉴权约定

### 3.1 登录

```http
POST http://10.2.1.16:31119/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

成功响应：

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<refresh-jwt>",
  "token_type": "bearer",
  "expires_in": 1800
}
```

后续请求统一携带：

```http
Authorization: Bearer <access_token>
```

### 3.2 刷新 Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<refresh-jwt>"
}
```

前端在 HTTP 401 时只自动刷新一次。刷新失败后清除本地 Token 并跳转登录页，不要无限重试。

## 4. 最小接入闭环

```text
1. 用户登录，获得 access_token
2. 创建 policy-matching Copilot Session
3. 前端本地显示助手欢迎语，不发送伪用户消息
4. 用户输入真实问题
5. 通过 AG-UI Runtime 发起对话并消费 SSE
6. 流结束后获取历史消息，保证持久化结果一致
```

## 5. 创建政策匹配 Copilot Session

```http
POST /api/v1/copilots/policy-matching/sessions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "政策匹配助手"
}
```

成功：HTTP 201。

```json
{
  "session_id": "sess_xxx",
  "profile": "policy-matching",
  "profile_version": "1.x",
  "runtime_url": "/api/v1/agui/run"
}
```

前端处理：

- 保存 `session_id`，后续对话始终复用该 Session。
- 不允许通过普通 Session 更新接口修改 Profile。
- Profile 版本已在创建时固定。验收新 Profile 版本时必须创建新 Session。
- 创建完成后直接进入聊天页，不自动发送“你好，我想进行政策匹配”。

空会话欢迎语由前端作为展示态消息渲染：

```text
🤖 您好，我是政策匹配助手。请告诉我您想查询的企业名称，或者您感兴趣的政策方向（比如节能改造、设备更新、研发补贴等），我来帮您匹配。
```

该欢迎语不写入数据库、不调用模型、不产生 Turn。当历史消息为空时显示，用户发送第一条真实消息后隐藏。

## 6. 推荐对话方式：AG-UI Runtime

AG-UI 方式支持在同一请求中传入当前页面上下文，适合企业详情、政策详情和匹配结果页嵌入 AI 助手。

### 6.1 请求

```http
POST /api/v1/agui/run
Authorization: Bearer <access_token>
Accept: text/event-stream
Content-Type: application/json
```

```json
{
  "threadId": "sess_xxx",
  "runId": "0ed82fc4-f8dd-48bf-82ba-123456789abc",
  "state": {},
  "messages": [
    {
      "id": "msg_0ed82fc4",
      "role": "user",
      "content": "这家企业可以优先申报哪些政策？"
    }
  ],
  "tools": [],
  "context": [
    {
      "description": "policy-copilot-context",
      "value": "{\"scene\":\"enterprise_detail\",\"enterpriseId\":\"opaque-enterprise-key\"}"
    }
  ],
  "forwardedProps": {}
}
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---:|---|
| `threadId` | 是 | 创建 Copilot Session 返回的 `session_id` |
| `runId` | 是 | 前端每次请求生成新 UUID |
| `state` | 是 | 当前传 `{}` |
| `messages` | 是 | AG-UI 消息列表，至少包含本轮用户问题 |
| `tools` | 是 | Policy Profile 不允许 Client Tools，固定传 `[]` |
| `context` | 是 | 无页面上下文时传 `[]` |
| `forwardedProps` | 是 | 当前传 `{}` |

### 6.2 政策页面上下文

`context` 只接收 `description=policy-copilot-context` 的项。`value` 必须是 JSON 对象字符串，不是直接 JSON 对象，最大 4096 字符。

```ts
type PolicyCopilotContext = {
  scene?: 'enterprise_detail' | 'policy_detail' | 'park_dashboard' | 'match_result';
  enterpriseId?: string;
  policyId?: string;
  projectId?: string;
  matchId?: string;
  regionId?: string;
  parkId?: string;
};
```

页面映射：

| 页面 | `scene` | 建议传入 |
|---|---|---|
| 园区首页/工作台 | `park_dashboard` | `parkId`、`regionId` |
| 企业详情 | `enterprise_detail` | `enterpriseId` |
| 政策详情 | `policy_detail` | `policyId`，可选 `projectId` |
| 匹配详情 | `match_result` | `matchId` |

只传定位标识。不要将页面展示的分数、匹配等级、条件状态、企业指标或材料状态传给 AI 当作业务事实。AI 会通过 MCP 重新读取权威数据。

### 6.3 页面上下文示例

政策详情：

```json
[
  {
    "description": "policy-copilot-context",
    "value": "{\"scene\":\"policy_detail\",\"policyId\":\"4\"}"
  }
]
```

匹配结果：

```json
[
  {
    "description": "policy-copilot-context",
    "value": "{\"scene\":\"match_result\",\"matchId\":\"opaque-match-key\"}"
  }
]
```

### 6.4 SSE 事件

前端至少处理：

| 事件 `type` | 处理 |
|---|---|
| `RUN_STARTED` | 开始 loading，记录 `runId` |
| `TEXT_MESSAGE_START` | 创建一条临时 assistant 消息 |
| `TEXT_MESSAGE_CONTENT` | 将 `delta` 追加到当前 assistant 消息 |
| `TEXT_MESSAGE_END` | 完成当前文本消息 |
| `STATE_SNAPSHOT` | 更新页面内的运行状态快照 |
| `CUSTOM` | 只处理已支持的 `vela.*` 事件，其他安全忽略 |
| `RUN_FINISHED` | 结束 loading，然后重新拉取历史消息 |
| `RUN_ERROR` | 结束 loading，显示业务化错误文案 |

不把工具调用事件和原始工具结果渲染给普通业务用户。

### 6.5 流式请求注意事项

- `/agui/run` 是携带 Bearer Token 的 POST SSE，不要使用原生 `EventSource`。
- 使用支持 AG-UI 的客户端，或用 `fetch()` 读取 `response.body` 的 `ReadableStream`。
- SSE 以空行分隔事件，同一事件的多个 `data:` 行需要合并后再 `JSON.parse`。
- 支持 `AbortController`，离开页面或用户点击停止时中断本地连接。
- 本地网络中断不等于服务端 Turn 已取消；需要取消时调用 Turn cancel 接口。

## 7. 备选方式：REST Turn + SSE

如果是独立聊天页，不需要传入业务页面上下文，可以使用两步式接口。

### 7.1 提交消息

```http
POST /api/v1/sessions/{sessionId}/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "泉州某某科技有限公司可以申报哪些政策？",
  "idempotency_key": "0ed82fc4-f8dd-48bf-82ba-123456789abc",
  "file_ids": [],
  "web_search_enabled": false,
  "mode": "chat"
}
```

成功：HTTP 201。返回值中的 `id` 是 `turnId`。

```json
{
  "id": "turn_xxx",
  "session_id": "sess_xxx",
  "status": "queued",
  "model_id": null,
  "input_tokens": 0,
  "output_tokens": 0,
  "iteration_count": 0,
  "error_message": null,
  "started_at": null,
  "completed_at": null,
  "created_at": "2026-07-16T10:00:00+08:00"
}
```

`idempotency_key` 每次用户提交时生成一个 UUID，同一次请求因网络问题重试时复用原 UUID。

### 7.2 连接 Turn SSE

```http
GET /api/v1/sessions/{sessionId}/turns/{turnId}/stream
Authorization: Bearer <access_token>
Accept: text/event-stream
```

该接口同样必须使用 `fetch()` 而不是原生 `EventSource`，因为需要携带 Authorization Header。

重连时携带：

```http
Last-Event-ID: <最后已处理的 SSE id>
```

重要：AG-UI Runtime 和 REST Turn 是两种提交方式。同一条用户消息只能选一种，不要先调 `/agui/run` 又调 `/sessions/{id}/messages`，否则会生成两个 Turn。

## 8. 会话和历史消息接口

### 8.1 会话列表

```http
GET /api/v1/sessions?limit=50
Authorization: Bearer <access_token>
```

仅展示政策 Copilot 会话时，前端根据响应项的以下字段过滤：

```json
{
  "copilot_profile_slug": "policy-matching",
  "copilot_profile_version": "1.x"
}
```

### 8.2 会话详情

```http
GET /api/v1/sessions/{sessionId}
Authorization: Bearer <access_token>
```

### 8.3 历史消息

```http
GET /api/v1/sessions/{sessionId}/messages
Authorization: Bearer <access_token>
```

响应：

```json
{
  "data": [
    {
      "id": "evt_xxx",
      "turn_id": "turn_xxx",
      "role": "user",
      "content": "这家企业可以申报什么政策？",
      "tool_calls": [],
      "artifacts": [],
      "model_id": null,
      "created_at": "2026-07-16T10:00:00+08:00"
    },
    {
      "id": "evt_yyy",
      "turn_id": "turn_xxx",
      "role": "assistant",
      "content": "根据当前企业信息，建议优先关注……",
      "tool_calls": [],
      "artifacts": [],
      "model_id": "model_xxx",
      "created_at": "2026-07-16T10:00:10+08:00"
    }
  ]
}
```

Policy Profile 对普通业务用户应返回经业务化处理的助手回答。即使响应中存在 `tool_calls`，业务前端也不得展示工具参数和原始结果。

### 8.4 重命名会话

```http
PATCH /api/v1/sessions/{sessionId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "泉州某公司政策匹配"
}
```

### 8.5 删除会话

```http
DELETE /api/v1/sessions/{sessionId}
Authorization: Bearer <access_token>
```

成功返回 HTTP 204。

## 9. Turn 控制接口

### 9.1 取消生成

```http
POST /api/v1/sessions/{sessionId}/turns/{turnId}/cancel
Authorization: Bearer <access_token>
```

### 9.2 重新生成

```http
POST /api/v1/sessions/{sessionId}/turns/{turnId}/regenerate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "idempotency_key": "<new-uuid>"
}
```

### 9.3 待补充信息

查询当前待处理交互：

```http
GET /api/v1/sessions/{sessionId}/interrupts?status=pending
Authorization: Bearer <access_token>
```

当 AI 需要用户选择企业、政策或项目时，前端应渲染服务端返回的交互 Schema，不要让用户手工输入 `enterpriseId/policyId/projectId/matchId`。

## 10. TypeScript 基础封装

```ts
const VELA_ORIGIN = 'http://10.2.1.16:31119';
const VELA_API = `${VELA_ORIGIN}/api/v1`;

type CopilotSession = {
  session_id: string;
  profile: string;
  profile_version: string;
  runtime_url: string;
};

async function velaRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${VELA_API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message ?? body?.detail ?? `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function createPolicyCopilotSession(accessToken: string) {
  return velaRequest<CopilotSession>(
    '/copilots/policy-matching/sessions',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ title: '政策匹配助手' }),
    },
  );
}
```

AG-UI 请求构建：

```ts
type PolicyPageContext = {
  scene?: 'enterprise_detail' | 'policy_detail' | 'park_dashboard' | 'match_result';
  enterpriseId?: string;
  policyId?: string;
  projectId?: string;
  matchId?: string;
  regionId?: string;
  parkId?: string;
};

function buildPolicyAguiInput(
  sessionId: string,
  content: string,
  pageContext?: PolicyPageContext,
) {
  const uuid = crypto.randomUUID();
  return {
    threadId: sessionId,
    runId: uuid,
    state: {},
    messages: [{ id: `msg_${uuid}`, role: 'user', content }],
    tools: [],
    context: pageContext
      ? [{
          description: 'policy-copilot-context',
          value: JSON.stringify(pageContext),
        }]
      : [],
    forwardedProps: {},
  };
}
```

## 11. 前端状态机

```text
idle
  → creating_session
  → ready
  → submitting/running
  → streaming
  → completed

running/streaming
  → waiting_input（需要用户选择或补充）
  → failed（业务化提示）
  → cancelled
```

交互要求：

- `creating_session` 时防止重复点击创建多个 Session。
- `running/streaming` 时允许点击停止，但禁止重复提交同一问题。
- 用户消息可乐观渲染，服务端返回失败时必须标记发送失败。
- 流式 assistant 消息在 `TEXT_MESSAGE_CONTENT` 中增量更新。
- `RUN_FINISHED` 后调用历史消息接口，用持久化消息替换本地临时消息。

## 12. 错误处理和用户文案

### 12.1 HTTP 错误

| HTTP | 前端处理 |
|---:|---|
| 400/422 | 请求或页面上下文格式错误，记录到前端日志，不将技术细节交给用户处理 |
| 401 | 刷新 Token；失败后跳转登录 |
| 403 | 提示当前账号无权访问该会话 |
| 404 | 会话或 Profile 不存在 |
| 409 | Profile 已禁用或当前操作状态冲突 |
| 429 | 提示操作过于频繁，稍后重试 |
| 503 | Copilot/MCP/模型能力暂不可用 |

### 12.2 Copilot 错误码

| code | 建议用户文案 |
|---|---|
| `COPILOT_PROFILE_NOT_FOUND` | 政策匹配助手尚未完成配置，请联系管理员 |
| `COPILOT_PROFILE_DISABLED` | 政策匹配助手当前已停用 |
| `COPILOT_PROFILE_UNAVAILABLE` | 政策匹配助手暂时不可用，请稍后重试 |
| `CAPABILITY_UNAVAILABLE` | 匹配数据服务暂时不可用，请稍后重试 |
| `COPILOT_CONTEXT_INVALID` | 当前页面信息无法识别，请刷新页面后重试 |
| `MODEL_CAPABILITY_MISMATCH` | AI 服务暂时无法完成政策匹配，请稍后重试 |

禁止展示给业务用户的内容：

```text
mcp__policy-copilot__get_match_evidence
unhandled errors in a TaskGroup
Pydantic validation error
match_query Field required
policyId/projectId/matchId/entUid/fieldName
完整请求参数、异常栈和内部服务地址
```

## 13. 前端展示规范

1. AI 角色展示为“政策匹配助手”或“政策申报顾问”，不展示为数据库查询助手。
2. 用户使用企业名称、政策名称和项目名称交互，不要求输入内部 ID。
3. 政策存在多个项目时，按项目名称分别展示。
4. `unknown` 展示为“待补充或待确认”，不得归入“不满足”。
5. 区分企业数据缺失、申报材料缺失、数据异常和明确不满足。
6. 失败时给出可操作的业务建议，不显示“换一个工具再试”等 Agent 内部话术。

## 14. 前端联调验收清单

- [ ] 可以通过 Biz 地址登录并获得 JWT。
- [ ] 可以创建 `policy-matching` Session。
- [ ] 点击政策匹配助手卡片后，由助手显示欢迎语，不伪造用户消息。
- [ ] 第一条真实用户消息仅生成一个 Turn。
- [ ] 企业详情页能将 `enterpriseId` 通过受信上下文传入。
- [ ] 政策详情页能将 `policyId/projectId` 通过受信上下文传入。
- [ ] 匹配页能将 `matchId` 通过受信上下文传入。
- [ ] 支持增量文本流式展示。
- [ ] 支持停止生成、断线结束 loading 和历史消息恢复。
- [ ] 不展示工具调用轨迹、原始工具结果和内部 ID。
- [ ] `unknown` 一律显示为待补充/待确认。
- [ ] HTTP 401 只刷新 Token 一次。
- [ ] `RUN_ERROR` 会结束 loading 并展示业务化提示。
- [ ] 刷新页面后能从历史消息接口恢复对话。

## 15. 可直接交给代码 AI 的实施指令

```text
请实现政策匹配 AI 前端接入。

Biz Origin: http://10.2.1.16:31119
API Base URL: http://10.2.1.16:31119/api/v1
Copilot Profile: policy-matching

必须实现：
1. 登录、access token 保存与单次刷新。
2. POST /api/v1/copilots/policy-matching/sessions 创建政策 Copilot Session。
3. 点击政策匹配助手后，不发送伪用户消息；空会话本地显示指定的助手欢迎语。
4. 业务页嵌入场景使用 POST /api/v1/agui/run，通过 description=policy-copilot-context 传入页面定位信息。
5. 使用 fetch ReadableStream 或可兼容的 AG-UI Client 处理 SSE，因为请求需要 POST 且携带 Bearer Token。
6. 消费 RUN_STARTED、TEXT_MESSAGE_START/CONTENT/END、RUN_FINISHED 和 RUN_ERROR。
7. RUN_FINISHED 后 GET /api/v1/sessions/{sessionId}/messages 恢复服务端持久化结果。
8. 支持会话列表、历史消息、重命名、删除和 Turn 取消。
9. 所有用户数据按当前 JWT 访问，不缓存或跨用户复用 sessionId。

禁止：
- 浏览器直连 Engine、MCP 或使用 MCP 内部密钥。
- 重新计算政策匹配分、匹配等级和条件状态。
- 展示工具名、工具参数、原始结果、数据库字段、内部 ID 和异常栈。
- 将 unknown 展示为不满足。
- 对同一条用户消息同时调用 AG-UI Runtime 和 REST Turn 提交接口。

验收以本文档第 14 节清单为准。
```

## 16. 开发环境建议

```env
NEXT_PUBLIC_VELA_BIZ_ORIGIN=http://10.2.1.16:31119
NEXT_PUBLIC_VELA_API_BASE_URL=http://10.2.1.16:31119/api/v1
NEXT_PUBLIC_VELA_COPILOT_PROFILE=policy-matching
```

如果业务前端与 Biz 不是同源地址，Biz 的 `APP_CORS_ORIGINS` 必须包含前端的完整 Origin（协议 + 域名/IP + 端口）。若浏览器报 CORS，先检查 Biz 配置，不要通过关闭浏览器安全策略解决。
