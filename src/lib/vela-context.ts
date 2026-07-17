import type { PolicyPageContext } from "./vela-client"

function optionalString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return undefined
}

export function buildPolicyPageContext(
  pathname: string,
  search: Record<string, unknown>
): PolicyPageContext | undefined {
  if (pathname === "/enterprise") {
    const enterpriseId = optionalString(search.enterpriseId)
    return enterpriseId
      ? { scene: "enterprise_detail", enterpriseId }
      : undefined
  }

  if (pathname === "/policy") {
    const policyId = optionalString(search.policyId)
    if (!policyId) return undefined
    const projectId = optionalString(search.projectId)
    return projectId
      ? { scene: "policy_detail", policyId, projectId }
      : { scene: "policy_detail", policyId }
  }

  if (pathname.startsWith("/match")) {
    const matchId = optionalString(search.matchId)
    return matchId ? { scene: "match_result", matchId } : undefined
  }

  return undefined
}
