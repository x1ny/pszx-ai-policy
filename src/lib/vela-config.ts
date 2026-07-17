/**
 * Vela 联调配置。
 *
 * 当前按方案使用固定账号自动登录；生产环境不应把账号密码打包到浏览器，
 * 应改为由后端代理登录或接入现有业务登录体系。
 */
export const velaConfig = {
  apiBaseUrl: "/vela-api",
  email: "admin@vela.local",
  password: "admin@vela",
  copilotProfile: "policy-matching",
} as const
