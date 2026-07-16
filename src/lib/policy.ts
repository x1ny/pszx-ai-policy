export type PolicyDeadlineStatus = "ending" | "active" | "closed" | "unknown"

export interface PolicyDeadlineStatusInfo {
  status: PolicyDeadlineStatus
  label: string
  className: string
}

export function getPolicyDeadlineStatus(
  deadline?: number | string | null,
  now = new Date()
): PolicyDeadlineStatusInfo {
  if (deadline === undefined || deadline === null) {
    return {
      status: "unknown",
      label: "--",
      className: "bg-muted text-muted-foreground border border-border",
    }
  }

  const deadlineDate = new Date(deadline)
  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      status: "unknown",
      label: "--",
      className: "bg-muted text-muted-foreground border border-border",
    }
  }

  const remainingMilliseconds = deadlineDate.getTime() - now.getTime()
  if (remainingMilliseconds < 0) {
    return {
      status: "closed",
      label: "已结束",
      className: "bg-muted text-muted-foreground border border-border",
    }
  }

  if (remainingMilliseconds <= 7 * 24 * 60 * 60 * 1000) {
    return {
      status: "ending",
      label: "7天内截止",
      className: "bg-warning/10 text-warning border border-warning/20",
    }
  }

  return {
    status: "active",
    label: "申报中",
    className: "bg-success/10 text-success border border-success/20",
  }
}
