import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Check } from "lucide-react"
import { $api } from "@/api/client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

export const Route = createFileRoute("/policy")({
  validateSearch: (search: Record<string, unknown>) => ({
    policyId: Number(search.policyId ?? 12),
  }),
  component: PolicyPage,
})

/* ===========================================================================
 * 政策卡片页
 * 设计来源：prototype/政策卡片.html
 * 不实现：右侧 AI 对话框
 * =========================================================================== */

const tabConfig = [
  { key: "high" as const, label: "高匹配企业", extra: "≥80% | -家" },
  { key: "mid" as const, label: "中匹配企业", extra: "50%~80% | -家" },
  { key: "low" as const, label: "低匹配企业", extra: "20%~50% | -家" },
]

const matchColorMap = {
  high: { text: "text-success", indicator: "[&_[data-slot=progress-indicator]]:bg-success" },
  mid: { text: "text-warning", indicator: "[&_[data-slot=progress-indicator]]:bg-warning" },
  low: { text: "text-primary", indicator: "[&_[data-slot=progress-indicator]]:bg-primary" },
}

// ---- Component ----

function PolicyPage() {
  const { policyId } = Route.useSearch()
  const [activeTab, setActiveTab] = useState<"high" | "mid" | "low">("high")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const policyQuery = $api.useQuery(
    "get",
    "/api/policy-copilot/v1/policies/{policyId}/context",
    { params: { path: { policyId } } },
  )
  const policy = policyQuery.data?.data
  const selectedProject = policy?.projects?.[0]
  const matchQuery = $api.useQuery(
    "post",
    "/api/policy-copilot/v1/matches/enterprises-by-policy",
    {
      body: {
        policyId,
        projectId: selectedProject?.projectId ?? null,
        keyword: null,
        matchLevels: [activeTab === "mid" ? "medium" : activeTab],
        pageNum: 1,
        pageSize: 20,
      },
      enabled: Boolean(policy),
    },
  )
  const currentData = (matchQuery.data?.data?.items ?? []).map((item) => ({
    name: item.entName || "-",
    entUid: item.entUid,
    match: item.score ?? 0,
    matched: item.satisfiedCount === null || item.satisfiedCount === undefined
      ? ["-"]
      : [`已满足条件：${item.satisfiedCount}项`],
    gaps: item.unknownCount === null || item.unknownCount === undefined
      ? ["-"]
      : [`待确认条件：${item.unknownCount}项`],
  }))
  const display = (value: unknown): string =>
    value === null || value === undefined || value === "" ? "-" : String(value)
  const formatDeadline = (value: string | number | null | undefined) => {
    if (!value) return "-"
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("zh-CN")
  }
  const [today] = useState(() => Date.now())
  const daysLeft = policy?.deadline
    ? Math.ceil((new Date(policy.deadline).getTime() - today) / 86400000)
    : null
  const deadlineUrgent = daysLeft !== null && daysLeft <= 30
  const conditions = selectedProject?.conditions ?? []
  const supportText = policy?.materials || policy?.process || "-"
  const matchCounts = { high: "-", mid: "-", low: "-" }
  const matchEmptyMessage = matchQuery.data?.data?.message || "暂无匹配企业"

  const allSelected =
    currentData.length > 0 && currentData.every((e) => selected.has(e.name))
  const selectedCount = [...selected].filter((name) =>
    currentData.some((e) => e.name === name)
  ).length

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        currentData.forEach((e) => next.delete(e.name))
      } else {
        currentData.forEach((e) => next.add(e.name))
      }
      return next
    })
  }

  const toggleOne = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  if (policyQuery.isPending) {
    return <div className="flex flex-col gap-4 text-sm text-muted-foreground">加载中...</div>
  }

  if (policyQuery.isError || policyQuery.data?.code !== 200 || !policy) {
    return <div className="flex flex-col gap-4 text-sm text-muted-foreground">业务数据暂时无法获取，请稍后重试</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ================================================================
       * 面包屑
       * ================================================================ */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="size-4" />
          返回首页
        </Link>
        <span>›</span>
        <span>政策找企业</span>
        <span>›</span>
        <strong className="font-bold text-foreground">{display(policy.title)}</strong>
      </nav>

      {/* ================================================================
       * 政策头部卡片
       * ================================================================ */}
      <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-success text-2xl text-white shadow-sm">
              🔧
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{display(policy.title)}</h2>
                {[policy.level, policy.policyAttribute].map((tag) => tag && (
                  <Badge key={tag} variant="secondary" className="bg-success/10 text-success border border-success/20 rounded px-2 py-0.5 text-xs font-bold">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                剩余申报时间：
                  <span className={`text-sm font-bold ${deadlineUrgent ? "text-deadline-urgent" : "text-muted-foreground"}`}>
                  {daysLeft === null ? "-" : daysLeft <= 0 ? "已过期" : `${daysLeft}天`}
                </span>
                ({formatDeadline(policy.deadline)} 截止)
              </div>
            </div>
          </div>
          <div className="flex gap-6 rounded-lg border border-[#f3f4f6] bg-[#f9fafb80] px-4 py-2 text-center">
            {[
              { label: "匹配企业总数", value: "-", color: "text-primary" },
              { label: "高匹配", value: matchCounts.high, color: "text-success" },
              { label: "中匹配", value: matchCounts.mid, color: "text-warning" },
              { label: "低匹配", value: matchCounts.low, color: "text-foreground" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="mb-1 text-xs text-muted-foreground">{stat.label}</div>
                <div className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                  <span className="text-xs font-normal text-muted-foreground"> 家</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 rounded-lg border border-[#f3f4f6] bg-[#f9fafb80] p-4">
          {[
            { label: "发文文号", value: display(policy.documentNo) },
            { label: "发布单位", value: display(policy.issuingOrg) },
            { label: "发布时间", value: display(null) },
            { label: "申报截止时间", value: formatDeadline(policy.deadline) },
          ].map((meta) => (
            <div key={meta.label}>
              <span className="mb-1 block text-xs text-muted-foreground">{meta.label}</span>
              <span className="font-medium text-foreground">{meta.value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-primary/10 bg-accent/30 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-primary">
            支持方式
          </div>
              <p className="text-sm leading-relaxed text-foreground/80">{supportText}</p>
        </div>
      </div>

      {/* ================================================================
       * 匹配企业面板
       * ================================================================ */}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "high" | "mid" | "low")
            setSelected(new Set())
          }}
          className="flex flex-col"
        >
          <TabsList variant="line" className="w-full h-auto! justify-start gap-8 rounded-none border-b border-border bg-transparent px-6">
            {tabConfig.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex-none px-2 py-4 text-base font-bold after:!bg-primary hover:text-primary data-active:text-primary"
              >
                {tab.label}
                <span className="ml-1 text-[11px] font-bold opacity-60">{tab.extra}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="flex flex-col">
            {/* 工具栏 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-2.5">
              <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-4 cursor-pointer accent-primary rounded"
                  />
                  全选
                </label>
                <span>已选择 {selectedCount} 家企业</span>
              </div>
            </div>

            {/* 表格 */}
            <div className="scrollbar-hidden max-h-[520px] overflow-auto">
              <Table className="min-w-[900px] text-[13px]">
                <TableHeader>
                  <TableRow className="border-b border-border text-muted-foreground hover:bg-transparent">
                    <TableHead className="w-[4%] text-center"> </TableHead>
                    <TableHead className="w-[28%]">企业名称</TableHead>
                    <TableHead className="w-[10%] text-center">匹配度</TableHead>
                    <TableHead className="w-[24%]">已满足条件</TableHead>
                    <TableHead className="w-[24%]">待确认条件</TableHead>
                    <TableHead className="w-[10%] text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {matchEmptyMessage}
                      </TableCell>
                    </TableRow>
                  ) : currentData.map((row) => (
                    <TableRow key={row.name} className="hover:bg-accent/50">
                      <TableCell className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(row.name)}
                          onChange={() => toggleOne(row.name)}
                          className="size-4 cursor-pointer accent-primary rounded"
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <Link
                          to="/enterprise"
                          search={{ enterpriseId: row.entUid }}
                          className="font-extrabold text-foreground hover:text-primary hover:underline"
                        >
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col items-center space-y-1.5">
                          <span className={`text-[15px] font-black ${matchColorMap[activeTab].text}`}>
                            {row.match}%
                          </span>
                          <Progress value={row.match} className={`h-[6px] w-16 ${matchColorMap[activeTab].indicator}`} />
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <ul className="flex flex-col gap-1.5 text-[13px]">
                          {row.matched.map((m) => (
                            <li key={m} className="flex items-start gap-1.5 text-foreground">
                              <Check className="mt-[2px] size-[14px] shrink-0 text-success" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="py-3">
                        <ul className="flex flex-col gap-1.5 text-[13px]">
                          {row.gaps.map((g) => (
                            <li key={g} className="flex items-start gap-2 text-muted-foreground">
                              <span className="mt-1.5 size-[5px] shrink-0 rounded-full bg-muted-foreground/50" />
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Link
                          to="/enterprise"
                          search={{ enterpriseId: row.entUid }}
                          className="rounded-md border border-primary/20 bg-accent px-2 py-1.5 text-xs font-extrabold text-primary transition-colors hover:bg-primary/10"
                        >
                          查看详情
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ================================================================
       * 申报条件
       * ================================================================ */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5 border-l-4 border-l-primary pl-2 text-sm font-bold text-foreground">
          申报条件
        </div>
        <div className="scrollbar-hidden max-h-[420px] overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs font-medium text-muted-foreground hover:bg-transparent">
                <TableHead className="w-1/5 px-4 py-2.5">指标名称</TableHead>
                <TableHead className="px-4 py-2.5">指标值</TableHead>
                <TableHead className="w-24 px-4 py-2.5 text-center">必要指标</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {conditions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">暂无申报条件</TableCell>
                </TableRow>
              ) : conditions.map((cond, index) => (
                <TableRow
                  key={`${selectedProject?.projectId ?? "project"}-${cond.indicator}-${index}`}
                  className="text-xs text-foreground hover:bg-accent/50"
                >
                  <TableCell className="px-4 py-2.5 font-medium">{display(cond.indicator)}</TableCell>
                  <TableCell className="px-4 py-2.5 text-muted-foreground">{display([cond.compare, cond.fieldVal].filter(Boolean).join(" "))}</TableCell>
                  <TableCell className="px-4 py-2.5 text-center">
                    <Badge
                      variant="secondary"
                      className={
                        cond.conditionRole === "must"
                          ? "bg-success/10 text-success border border-success/20 rounded px-2 py-0.5 text-[10px]"
                          : "bg-muted text-muted-foreground border border-border rounded px-2 py-0.5 text-[10px]"
                      }
                    >
                      {cond.conditionRole === "must" ? "是" : "否"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  )
}
