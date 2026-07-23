/**
 * 政策匹配 AI Agent 联调配置。
 *
 * 当前后端登录接口开启了图形验证码，无法做到完全免交互的自动登录，
 * 因此使用固定的联调账号 + 一次性验证码输入的极简登录。
 * 生产环境应改为由后端提供专用凭证或关闭该账号的验证码校验。
 */
export const agentConfig = {
  username: "admin",
  password: "Pszx@#2025",
  agentAppSlug: "policy-matching",
  // Vela 的 SSE 接口对当前前端源没有开放 CORS，直连会被浏览器拦截，
  // 所以走 vite 的 /vela 代理转发到 http://10.2.1.16:31119，
  // 部署环境需要网关做等价转发（或 Vela 一侧对目标源开启 CORS）。
  velaBaseUrl: "/vela",
} as const
