import createFetchClient from "openapi-fetch"
import createClient from "openapi-react-query"

import type { paths } from "./schema"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

/**
 * OpenAPI 类型安全的 fetch client。
 *
 * 未配置 VITE_API_BASE_URL 时使用相对路径，方便通过 Vite 代理或同源部署访问后端。
 */
export const fetchClient = createFetchClient<paths>({
  ...(apiBaseUrl ? { baseUrl: apiBaseUrl } : {}),
})

/** 基于 fetchClient 的 React Query API client。 */
export const $api = createClient(fetchClient)
