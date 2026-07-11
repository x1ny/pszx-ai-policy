import { Link } from "@tanstack/react-router"

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-extrabold tracking-wide text-foreground">
          泉州市南安市政策匹配平台
        </Link>
        <span className="hidden text-xs font-medium text-muted-foreground xl:inline">
          智能匹配政策与企业，精准发现可申报企业，提升政策转化效果
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="cursor-pointer">2026-07-01</span>
        <span className="relative cursor-pointer">
          <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-red-500" />
        </span>
        <div className="flex items-center gap-2">
          <div
            className="size-8 rounded-full bg-cover bg-center shadow-sm"
            style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')" }}
          />
          <div className="text-sm leading-tight">
            <div className="font-bold text-foreground">林晓明</div>
            <div className="text-xs text-muted-foreground">园区管理员</div>
          </div>
        </div>
      </div>
    </header>
  )
}