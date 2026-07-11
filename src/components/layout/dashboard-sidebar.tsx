import { useState } from "react"

const suggestions = [
  "当前政策匹配整体情况如何？",
  "哪些政策建议优先查看？",
  "高匹配、中匹配、低匹配分别代表什么？",
]

export function DashboardSidebar() {
  const [input, setInput] = useState("")

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-3 border-l border-primary/10 bg-gradient-to-b from-blue-50/80 to-blue-100/40 p-3.5">
      {/* 今日快讯 */}
      <section className="rounded-xl border border-blue-200 bg-card p-3 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <span className="block h-4 w-1 rounded-full bg-amber-500" />
            今日快讯
          </div>
          <span className="cursor-pointer text-xs font-bold text-primary hover:underline">查看详情</span>
        </div>

        <div className="mb-2 flex flex-col gap-1.5 rounded-lg border border-border bg-muted/50 p-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-500 ring-1 ring-red-200">
              政策时效提醒
            </span>
            <span className="truncate font-medium text-foreground">2项申报临近截止</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[11px] font-bold text-green-600 ring-1 ring-green-200">
              当日新增政策
            </span>
            <span className="truncate font-medium text-foreground">新增2项惠企政策</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-600 ring-1 ring-blue-200">
              TOP 咨询问题
            </span>
            <span className="truncate font-medium text-foreground">高频咨询技改、高企</span>
          </div>
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-1.5 text-xs font-extrabold text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90">
          AI 生成工作建议
        </button>
      </section>

      {/* AI 聊天面板 */}
      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-blue-200 bg-card shadow-sm">
        <div className="border-b border-border bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 text-sm font-bold text-blue-800">
          <div className="flex items-center justify-between">
            <span>园区智能工作台</span>
            <span className="cursor-pointer text-xs font-normal text-muted-foreground hover:text-foreground">
              清空
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-muted/30 p-4">
          <div className="max-w-[90%] self-start rounded-lg border border-border bg-card p-3 text-xs leading-relaxed shadow-sm">
            <p>您好！我是您的政策匹配助手，可以基于当前页面数据快速分析：</p>
            <div className="mt-2 flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="w-full rounded-xl border border-transparent bg-muted px-3 py-2 text-left text-xs text-primary transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-card p-4">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请输入您的问题（支持回车）..."
              className="w-full rounded-md border border-input bg-background py-2 pr-9 pl-2.5 text-xs outline-none transition-colors focus:border-primary"
            />
            <span
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-sm transition-colors ${input ? "text-primary" : "text-muted-foreground/40"}`}
            >
              ➤
            </span>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
            内容由AI生成，仅供参考
          </p>
        </div>
      </section>
    </aside>
  )
}