# 政策匹配 AI 最小化接入方案

> 状态：方案草案
>
> 整理日期：2026-07-17
>
> 本文只描述当前项目的最小化接入路径，不包含代码实现。

## 1. 目标

在当前项目已有的全局右侧 AI 面板中接入 Vela 的 `policy-matching` Copilot，实现：

1. 网站打开后自动使用配置的账号密码登录 Vela，获取 `access_token`。
2. 用户第一次发送消息时创建一个 Copilot Session。
3. 使用 AG-UI Runtime 以 SSE 流式显示回答。
4. 切换页面时保留同一个面板、同一个 Session 和当前对话状态。
5. 发送请求时按接口文档传递当前页面上下文。
6. 流式结束后重新拉取服务端历史消息，保证最终显示结果一致。

## 2. 已确认的产品决策

| 项目 | 决策 |
| --- | --- |
| UI 位置 | 保留当前根布局中的全局右侧栏 |
| 页面切换 | 右侧面板不销毁，对话不重置 |
| 登录页 | 不新增 |
| 登录方式 | 网站打开时自动调用登录接口 |
| 账号配置 | 代码中配置账号密码 |
| Token 存储 | 只保存在内存，刷新页面后重新登录 |
| Session 创建 | 首次发送消息时创建，不在网站打开时创建 |
| Session 数量 | 当前网站生命周期内保持一个 |
| Session 标题 | 固定为“政策匹配助手” |
| 历史记录 | 不做历史会话列表；本次请求结束后拉取当前 Session 消息用于显示一致性 |
| 对话协议 | AG-UI：`POST /api/v1/agui/run` |
| SSE 读取 | `fetch` + `ReadableStream` |
| 停止生成 | 第一阶段不实现 |
| Token 刷新 | 第一阶段不实现，401 直接提示失败 |
| SSE 事件 | 只处理文本流和运行状态事件，其他事件安全忽略 |
| 欢迎语 | 保持当前静态欢迎语，不创建 Session、不调用 AI |
| 快捷问题 | 点击后直接作为真实消息发送 |
| 失败消息 | 只显示错误提示，不在消息列表中保留错误状态 |
| AI 回复 | Markdown 渲染 |
| Markdown 依赖 | `react-markdown` + `remark-gfm` |
| 网络访问 | 浏览器请求 `/vela-api`，由 Vite 代理到 Vela |
| 代理目标 | `http://10.2.1.16:31119/api/v1` |

## 3. 当前项目与参考代码的结论

### 3.1 当前项目

- 根布局位于 `src/routes/__root.tsx`，其中挂载 `DashboardSidebar`，适合承载持久化的全局 AI 状态。
- 当前 AI 面板位于 `src/components/layout/dashboard-sidebar.tsx`，目前只有静态欢迎语、快捷问题和输入框。
- 当前 API 使用 `src/api/client.ts` 的 `openapi-fetch` + React Query，主要服务于政策匹配业务接口。
- 当前项目没有登录页、JWT 管理和 Vela 会话管理。
- 企业详情、政策详情已经从路由搜索参数中取得业务定位信息。
- 首页暂时没有可用的 `parkId`、`regionId`，因此第一阶段首页传 `context: []`。
- 当前项目没有独立的匹配结果详情页；以后出现时再加入 `match_result` 上下文。

### 3.2 Vela 参考代码

参考目录实际为：

```text
reference-projects/vela/frontend/apps/web
```

而不是字面上的 `frontend/web`。

Vela Web 的关键可复用思路：

- `chat/[sessionId]/page.tsx` 负责会话页面、乐观消息、提交和流式状态编排。
- `@vela/shared` 提供会话、消息、Turn、SSE 等 hooks；当前项目不直接复用，因为技术栈和依赖边界不同。
- Vela 使用 `fetch` 读取带鉴权的流式响应，而不是原生 `EventSource`。
- `MessageList` 将流式文本、完成消息和各种运行状态投影到 UI。
- `agentUiRegistry` 用于工具和声明式 UI 渲染；本次最小接入不引入这部分能力。

结论：当前项目只借鉴 Vela 的请求、流式读取、状态编排思路，新增轻量的本地客户端，不复制 Vela 聊天页面和完整会话系统。

## 4. 推荐的最小架构

### 4.1 建议新增或调整的文件

```text
vite.config.ts                         增加 /vela-api 代理
src/lib/vela-config.ts                 Vela 地址、账号、密码和 Profile 配置
src/lib/vela-client.ts                 登录、创建 Session、拉取消息、AG-UI 请求
src/lib/vela-agui.ts                   请求体构造和 SSE 事件解析
src/lib/vela-context.ts                根据当前路由构造页面上下文
src/components/layout/dashboard-sidebar.tsx
                                      接入聊天状态和发送逻辑
src/components/vela-markdown-message.tsx
                                      Markdown 消息渲染
```

不建议第一阶段修改现有政策业务 API schema，也不建议把 Vela 接口混入当前 `openapi-fetch` client。Vela 是另一套服务和鉴权协议，单独封装更容易控制边界。

### 4.2 请求链路

```text
网站打开
  ↓
POST /vela-api/auth/login
  ↓
内存保存 access_token
  ↓
用户点击快捷问题或提交输入
  ↓
若没有 session：POST /vela-api/copilots/policy-matching/sessions
  ↓
构造当前页面 context
  ↓
POST /vela-api/agui/run
  ↓
ReadableStream 解析 SSE
  ↓
增量更新 assistant Markdown 消息
  ↓
RUN_FINISHED
  ↓
GET /vela-api/sessions/{sessionId}/messages
  ↓
使用服务端消息替换当前临时消息
```

### 4.3 AG-UI 请求体

```ts
{
  threadId: sessionId,
  runId: crypto.randomUUID(),
  state: {},
  messages: [
    {
      id: `msg_${runId}`,
      role: "user",
      content,
    },
  ],
  tools: [],
  context: pageContext
    ? [{
        description: "policy-copilot-context",
        value: JSON.stringify(pageContext),
      }]
    : [],
  forwardedProps: {},
}
```

`threadId` 使用创建 Session 返回的 `session_id`；`runId` 每次发送重新生成；`tools` 固定为空数组。

### 4.4 页面上下文

按接口文档构造，不传页面展示分数、匹配等级、条件状态或内部工具数据。

| 当前页面 | `scene` | 传递字段 |
| --- | --- | --- |
| 园区首页 | `park_dashboard` | 第一阶段暂不传，使用 `context: []` |
| 企业详情 | `enterprise_detail` | `enterpriseId` |
| 政策详情 | `policy_detail` | `policyId`，有值时附带 `projectId` |
| 匹配结果详情 | `match_result` | 后续页面出现时传 `matchId` |

上下文在用户点击发送的瞬间读取。用户发送后即使切换页面，正在进行的请求仍使用原页面上下文，不被新路由改变。

### 4.5 SSE 事件处理

第一阶段处理以下事件：

| 事件 | 前端行为 |
| --- | --- |
| `RUN_STARTED` | 进入运行中状态 |
| `TEXT_MESSAGE_START` | 创建临时 assistant 消息 |
| `TEXT_MESSAGE_CONTENT` | 将 `delta` 追加到当前 assistant 消息 |
| `TEXT_MESSAGE_END` | 标记当前文本消息完成 |
| `RUN_FINISHED` | 结束 loading，拉取服务端历史消息 |
| `RUN_ERROR` | 结束 loading，显示业务化错误提示 |

其他事件安全忽略，不展示工具名称、工具参数、原始工具结果、内部 ID 或异常堆栈。

SSE 解析器需要处理空行分隔事件，并合并同一事件中的多行 `data:` 后再执行 `JSON.parse`。请求使用 `AbortController` 只是为页面卸载等本地清理预留，本阶段不提供用户主动停止按钮。

## 5. 前端状态设计

建议在 `DashboardSidebar` 所属的根布局生命周期内维护以下状态：

```text
auth: logging_in | ready | failed
session: null | creating | ready
run: idle | running | completed | failed
messages: 当前页面生命周期内的用户消息和 assistant 消息
```

关键规则：

- 登录失败不阻塞网站；右侧栏保持现有欢迎界面，发送时再提示错误。
- Session 创建期间禁止重复创建。
- Session 只在第一次真实发送时创建。
- 发送失败只弹出提示，不把错误作为消息写入列表。
- 切换路由不清空消息和 Session。
- 刷新页面后内存状态清空，重新登录且不恢复旧 Session。

## 6. 实施顺序

### 阶段一：网络与认证

1. 在 Vite 配置 `/vela-api` 代理。
2. 新增登录请求和内存 Token 状态。
3. 网站加载时自动登录。
4. 处理登录失败但不阻塞页面。

### 阶段二：Session 与 AG-UI

1. 添加创建 `policy-matching` Session 的方法。
2. 添加 AG-UI 请求体构造方法。
3. 添加 SSE 解析器和文本事件处理。
4. 添加 `RUN_FINISHED` 后的历史消息拉取。

### 阶段三：右侧栏接入

1. 保留当前欢迎语和快捷问题视觉样式。
2. 接入输入框、快捷问题发送和 loading 状态。
3. 将当前静态消息替换为本地消息列表。
4. 增加 Markdown 渲染。
5. 接入企业详情和政策详情页面上下文。

### 阶段四：联调收口

1. 确认代理实际可访问登录、Session、AG-UI 和历史消息接口。
2. 确认 SSE 事件字段与文档样例一致。
3. 确认服务端返回消息结构能映射为当前面板消息。
4. 根据实际错误响应补充业务化错误文案。

## 7. 第一阶段验收标准

- 网站打开后自动调用登录接口。
- 登录失败不影响其他页面使用。
- 右侧栏保持当前欢迎语和快捷问题样式。
- 点击快捷问题会直接发送真实消息。
- 第一次发送时只创建一个 `policy-matching` Session。
- 同一网站生命周期内后续消息复用该 Session。
- 企业详情页和政策详情页请求带有文档规定的 `policy-copilot-context`。
- AI 文本能够增量显示，并以 Markdown 渲染。
- `RUN_FINISHED` 后显示服务端历史消息结果。
- 切换页面不清空右侧栏和当前对话。
- 刷新页面后重新登录，不恢复旧对话。
- 不展示 MCP 工具名、参数、原始结果、内部 ID 或异常堆栈。

## 8. 待解决问题与风险

以下问题不阻塞方案整理，但在实现或联调前需要确认：

### 8.1 账号密码写入前端源码

当前决定将账号密码配置在代码中。Vite 前端构建后，账号密码会进入浏览器可获取的资源，任何访问页面的人都可能看到它。该方案只适合受控内网联调，不适合作为生产安全方案。

后续应优先改为：由后端代理登录，或由现有业务登录系统提供短期 Token；至少也应使用环境变量而不是提交到 Git 的源码。

### 8.2 Token 不刷新

当前决定不实现 401 自动刷新。登录返回的 `expires_in` 为 1800 秒，网站运行超过 Token 有效期后，发送请求会失败，需要刷新页面重新登录。若后续需要长时间驻留，应恢复文档要求的“401 只刷新一次”机制。

### 8.3 代理的生产环境对应物

当前确认的是 Vite 开发代理。生产环境不是由 Vite 提供代理，需要确认部署网关是否将 `/vela-api/*` 转发到 Vela 的 `/api/v1/*`，并保持 SSE 的长连接、响应头和超时配置。

### 8.4 首页上下文缺少业务 ID

首页当前没有 `parkId`、`regionId`，第一阶段按决定传空上下文。后续如果首页 AI 需要园区范围信息，需要明确这两个 ID 的来源。

### 8.5 项目 ID 与匹配结果 ID

政策详情页的 `projectId` 需要确认当前页面是否始终能取得；匹配结果详情页尚未存在，未来需要定义 `matchId` 的路由或选中态来源。

### 8.6 接口实际响应与文档差异

需要联调确认：

- 登录失败响应是 `error.message`、`detail` 还是其他结构。
- AG-UI `TEXT_MESSAGE_CONTENT` 的增量字段是否始终为 `delta`。
- `RUN_ERROR` 的错误码和业务信息字段。
- 历史消息接口返回的 `data` 结构和消息时间字段。

### 8.7 Markdown 安全与样式

需要确认是否允许链接、表格、代码块等 GFM 内容，以及是否需要限制 HTML 渲染。默认应关闭原始 HTML，避免服务端内容直接注入页面。

### 8.8 未实现能力

第一阶段明确不包含：

- 用户主动停止生成
- Token 刷新
- 历史会话列表和切换
- Session 重命名、删除、分享
- 工具调用和 `CUSTOM` 事件 UI
- `STATE_SNAPSHOT` 展示
- Vela Agent UI Registry 和声明式组件

## 9. 参考资料

- [政策匹配AI前端接入接口文档.md](../政策匹配AI前端接入接口文档.md)
- [当前项目 API Client](../src/api/client.ts)
- [当前项目全局 AI 侧栏](../src/components/layout/dashboard-sidebar.tsx)
- [Vela Web 聊天页面](../reference-projects/vela/frontend/apps/web/src/app/(app)/chat/[sessionId]/page.tsx)
- [Vela Web 消息列表](../reference-projects/vela/frontend/apps/web/src/components/chat/MessageList.tsx)
- [Vela Web Agent UI 注册表](../reference-projects/vela/frontend/apps/web/src/lib/agentUiRegistry.ts)
