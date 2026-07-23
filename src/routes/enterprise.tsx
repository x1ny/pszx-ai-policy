import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Check } from "lucide-react"
import { $api } from "@/api/client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

export const Route = createFileRoute("/enterprise")({
  validateSearch: (search: Record<string, unknown>) => ({
    enterpriseId: String(search.enterpriseId ?? "54D74B0EF5F211E39186ED1292A4829C"),
  }),
  component: EnterprisePage,
})

/* ===========================================================================
 * 企业卡片页
 * 设计来源：prototype/企业卡片.html
 * 不实现：右侧 AI 对话框
 * =========================================================================== */

// ---- Mock Data ----

const company = {
  name: "泉州南安智能装备有限公司",
  creditCode: "91350583MA8L7Q2B5N",
  industry: "专用设备制造业",
  founded: "2019-03-18",
  capital: "3,800万元",
  scale: "中型企业",
  status: "培育中" as const,
}

const matchOverview = [
  { label: "高匹配政策", count: 1, color: "text-success", bg: "bg-success" },
  { label: "中匹配政策", count: 2, color: "text-warning", bg: "bg-warning" },
  { label: "低匹配政策", count: 1, color: "text-primary", bg: "bg-primary" },
]

const policyRows = [
  {
    name: "泉州市高质量发展支持企业技术改造专项",
    type: "资金补贴",
    tags: ["补贴", "技改", "设备更新"],
    tagStyles: [
      "bg-success/10 text-success border border-success/20",
      "bg-accent text-primary border border-primary/20",
      "bg-success/10 text-success border border-success/20",
    ],
    deadline: "2026-07-31",
    deadlineUrgent: true,
    match: 86,
    matchLevel: "high" as const,
    matched: [
      "企业规模：中型企业",
      "行业匹配：专用设备制造业",
      "设备投资金额：≥300万",
      "项目属性：已具备",
    ],
    gaps: ["设备采购发票不齐全", "部分权证已逾期", "投资项目备案材料待补充"],
  },
  {
    name: "泉州市专精特新中小企业梯度培育计划",
    type: "企业培育",
    tags: ["培育", "创新", "专精特新"],
    tagStyles: [
      "bg-warning/10 text-warning border border-warning/20",
      "bg-accent text-primary border border-primary/20",
      "bg-success/10 text-success border border-success/20",
    ],
    deadline: "2026-09-15",
    deadlineUrgent: false,
    match: 72,
    matchLevel: "mid" as const,
    matched: [
      "企业规模：中型企业",
      "主营业务收入：达标",
      "研发费用占比：达标",
    ],
    gaps: ["研发人员占比不足 (当前8%)", "专利数量偏少 (当前5项)"],
  },
  {
    name: "南安市高新技术企业培育奖励政策",
    type: "企业认定",
    tags: ["认定", "科技创新"],
    tagStyles: [
      "bg-success/10 text-success border border-success/20",
      "bg-accent text-primary border border-primary/20",
    ],
    deadline: "2026-10-15",
    deadlineUrgent: false,
    match: 58,
    matchLevel: "mid" as const,
    matched: [
      "成立时间：达标",
      "主营业务：符合要求",
      "自主知识产权：达标",
    ],
    gaps: ["研发费用占比未达标 (当前2.5%)", "科技人员占比不足 (当前10%)"],
  },
  {
    name: "福建省智能制造优秀场景培育政策",
    type: "企业认定",
    tags: ["示范", "智能制造", "数字化转型"],
    tagStyles: [
      "bg-accent text-primary border border-primary/20",
      "bg-cyan-50 text-cyan-600 border border-cyan-100",
      "bg-success/10 text-success border border-success/20",
    ],
    deadline: "2026-11-30",
    deadlineUrgent: false,
    match: 35,
    matchLevel: "low" as const,
    matched: ["企业规模：中型企业"],
    gaps: ["智能制造系统未建设", "数字化程度较低", "数据集成能力不足"],
  },
]

void company
void matchOverview
void policyRows

const matchColorMap = {
  high: { text: "text-success", bar: "bg-success", label: "高匹配", indicator: "[&_[data-slot=progress-indicator]]:bg-success" },
  mid: { text: "text-warning", bar: "bg-warning", label: "中匹配", indicator: "[&_[data-slot=progress-indicator]]:bg-warning" },
  low: { text: "text-primary", bar: "bg-primary", label: "低匹配", indicator: "[&_[data-slot=progress-indicator]]:bg-primary" },
}

const phases = [
  {
    num: 1,
    title: "申报冲刺",
    period: "0-1月",
    color: "#16a34a",
    desc: "补齐技改备案、设备合同与发票，先申报确定性补贴。",
    policy: "泉州市高质量发展支持企业技术改造专项",
    title_expected: "泉州市重点技改项目入库企业",
    benefit: "约80万元",
    tags: ["项目备案", "设备清单", "合同发票"],
  },
  {
    num: 2,
    title: "基础培育",
    period: "1-3月",
    color: "#f97316",
    desc: "归集研发费用，完善研发人员和知识产权台账。",
    policy: "福建省创新型中小企业评价",
    title_expected: "创新型中小企业",
    benefit: "约10万元",
    tags: ["研发归集", "人员证明", "专利台账"],
  },
  {
    num: 3,
    title: "称号突破",
    period: "3-6月",
    color: "#7c3aed",
    desc: "补强主导产品、细分市场证明和专利成果材料。",
    policy: "泉州市专精特新中小企业梯度培育计划",
    title_expected: "省级专精特新中小企业",
    benefit: "约30万元",
    tags: ["市场证明", "主导产品", "专利成果"],
  },
  {
    num: 4,
    title: "高阶跃升",
    period: "6-12月",
    color: "#0891b2",
    desc: "完善高企指标和数字化能力，冲刺高阶认定。",
    policy: "高企认定 / 智能制造培育",
    title_expected: "高新技术企业",
    benefit: "约40万元+",
    tags: ["高新收入", "科技人员", "数字化能力"],
  },
]

// ---- Component ----

function EnterprisePage() {
  const { enterpriseId } = Route.useSearch()
  const [filter, setFilter] = useState<"all" | "high" | "mid" | "low">("all")
  const [policyType, setPolicyType] = useState("全部")

  const contextQuery = $api.useQuery(
    "get",
    "/api/policy-copilot/v1/enterprises/{entUid}/context",
    { params: { path: { entUid: enterpriseId } } },
  )
  const matchQuery = $api.useQuery(
    "post",
    "/api/policy-copilot/v1/matches/policies-by-enterprise",
    { body: { enterpriseId } },
  )
  const context = contextQuery.data?.data
  const matchItems = matchQuery.data?.data?.items ?? []
  const display = (value: unknown): string =>
    value === null || value === undefined || value === "" ? "-" : String(value)
  const profileValue = (name: string) => {
    const item = context?.profileItems?.find((profile) => profile.name === name)
    return item?.value || "-"
  }
  const company = {
    name: context?.entName,
    creditCode: context?.creditCode,
    province: context?.province,
    city: context?.city,
    industry: context?.industryCategory,
    founded: profileValue("成立年限"),
    capital: context?.registeredCapital,
    scale: context?.enterpriseScale ?? profileValue("企业规模"),
    status: "培育中",
  }
  const matchOverview = [
    { label: "高匹配政策", count: matchItems.filter((item) => item.matchLevel === "high").length, color: "text-success" },
    { label: "中匹配政策", count: matchItems.filter((item) => item.matchLevel === "medium").length, color: "text-warning" },
    { label: "低匹配政策", count: matchItems.filter((item) => item.matchLevel === "low").length, color: "text-primary" },
  ]
  const policyRows = matchItems.map((item) => {
    const matchLevel = item.matchLevel === "medium" ? "mid" : item.matchLevel === "high" ? "high" : "low"
    return {
      matchId: item.matchId,
      name: item.policyTitle,
      type: "-",
      tags: [item.projectName],
      tagStyles: ["bg-accent text-primary border border-primary/20"],
      deadline: "-",
      deadlineUrgent: false,
      match: item.score ?? 0,
      matchLevel: matchLevel as "high" | "mid" | "low",
      matched: [
        `已满足条件：${item.satisfiedCount ?? "-"}项`,
      ],
      gaps: [
        `待确认条件：${item.unknownCount ?? "-"}项`,
      ],
    }
  })

  const filteredRows =
    filter === "all"
      ? policyRows
      : policyRows.filter((r) => r.matchLevel === filter)

  const visibleCount = filteredRows.length

  if (contextQuery.isPending || matchQuery.isPending) {
    return <div className="flex flex-col gap-4 text-sm text-muted-foreground">加载中...</div>
  }

  if (contextQuery.isError || matchQuery.isError || !context || contextQuery.data?.code !== 200 || matchQuery.data?.code !== 200) {
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
        <span>企业找政策</span>
        <span>›</span>
        <strong className="font-bold text-foreground">{company.name}</strong>
      </nav>

      {/* ================================================================
       * 顶部：企业信息 + 政策匹配概览
       * ================================================================ */}
      <div className="flex gap-4">
        {/* ---- 企业信息卡片 ---- */}
        <div className="flex flex-1 gap-6 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex size-[72px] shrink-0 items-center justify-center rounded-xl bg-accent text-3xl font-bold text-primary">
            ▦
          </div>
          <div className="flex-1 space-y-3.5">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-black tracking-wide text-foreground">
        {display(company.name)}
              </h2>
              <Badge variant="secondary" className="bg-accent text-primary border border-primary/20 rounded px-2.5 py-1 text-xs font-bold">
                {display(company.status)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-[13px]">
              <div className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">统一社会信用代码：</span>
                <span className="font-medium text-foreground">{display(company.creditCode)}</span>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">所属行业：</span>
                <span className="font-medium text-foreground">{display(company.industry)}</span>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">成立时间：</span>
                <span className="font-medium text-foreground">{display(company.founded)}</span>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">注册资本：</span>
                <span className="font-medium text-foreground">{display(company.capital)}</span>
              </div>
              <div className="col-span-2 flex gap-2">
                <span className="shrink-0 text-muted-foreground">企业规模：</span>
                <span className="font-medium text-foreground">{display(company.scale)}</span>
              </div>
            </div>
            <div className="pt-1">
              <button className="rounded-md border border-primary/30 px-5 py-1.5 text-[13px] font-bold text-primary transition-colors hover:bg-accent">
                查看企业画像
              </button>
            </div>
          </div>
        </div>

        {/* ---- 政策匹配概览 ---- */}
        <div className="flex w-[420px] shrink-0 flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="border-l-4 border-l-primary pl-2 text-[15px] font-bold leading-tight text-primary">
            政策匹配概览
          </div>
          <div className="grid grid-cols-3 pt-3 pb-1 text-center">
            {matchOverview.map((item, i) => (
              <div key={item.label} className={i > 0 ? "border-l border-border" : ""}>
                <div className="mb-1 text-[13px] font-medium text-muted-foreground">
                  {item.label}
                </div>
                <div className={`text-[28px] font-bold ${item.color}`}>
                  {item.count}
                  <span className="text-sm font-medium text-muted-foreground"> 项</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-[12px] font-medium text-muted-foreground">
            <span>结果仅供参考</span>
            <span>更新：2026-07-01</span>
          </div>
        </div>
      </div>

      {/* ================================================================
       * 底部：Tabs（政策匹配情况 / 培育计划）
       * ================================================================ */}
      <div className="flex min-h-[500px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Tabs defaultValue="match" className="flex flex-1 flex-col">
          <TabsList variant="line" className="w-full h-auto! justify-start gap-6 rounded-none border-b border-border bg-transparent px-6">
            <TabsTrigger
              value="match"
              className="flex-none px-3 py-4 text-[15px] font-bold after:!bg-primary data-active:text-primary"
            >
              政策匹配情况
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              className="flex-none px-3 py-4 text-[15px] font-bold after:!bg-primary data-active:text-primary"
            >
              培育计划
            </TabsTrigger>
          </TabsList>

          {/* ---- Tab 1: 政策匹配情况 ---- */}
          <TabsContent value="match" className="flex flex-1 flex-col">
            {/* 筛选栏 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-3">
              <div className="flex items-center gap-2.5">
                <span className="mr-1 text-[13px] font-medium text-muted-foreground">匹配度筛选：</span>
                {(["all", "high", "mid", "low"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`rounded px-3.5 py-1.5 text-[13px] font-bold transition-colors outline-0 focus-visible:outline-0 ${
                      filter === f
                        ? "bg-accent text-primary border border-primary/20"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "全部" : f === "high" ? "高匹配(≥80%)" : f === "mid" ? "中匹配(50%~80%)" : "低匹配(20%~50%)"}
                  </button>
                ))}
              </div>
              <div hidden className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-muted-foreground">政策类型：</span>
                <select
                  className="w-32 cursor-pointer rounded border border-border bg-card px-2.5 py-1.5 text-[13px] font-medium text-foreground outline-none transition-colors focus:border-primary"
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                >
                  <option>全部</option>
                  <option>资金补贴</option>
                  <option>企业培育</option>
                  <option>企业认定</option>
                </select>
              </div>
            </div>

            {/* 表格 */}
            <div className="flex-1 px-6 pt-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-border text-[13px] font-bold text-muted-foreground hover:bg-transparent">
                    <TableHead className="w-[30%] py-3">政策名称</TableHead>
                    <TableHead className="w-[13%] text-center">政策类型</TableHead>
                    <TableHead className="w-[13%] text-center">匹配度</TableHead>
                    <TableHead className="w-[24%]">匹配情况</TableHead>
                    <TableHead className="w-[20%]">主要差距</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        {matchQuery.data?.data?.message || "暂无匹配政策"}
                      </TableCell>
                    </TableRow>
                  ) : filteredRows.map((row) => (
                    <TableRow key={row.matchId} className="hover:bg-accent/50">
                      <TableCell className="py-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex size-[36px] shrink-0 items-center justify-center rounded text-lg font-bold text-white shadow-sm ${matchColorMap[row.matchLevel].bar}`}>
                            {row.matchLevel === "high" ? "⌁" : row.matchLevel === "mid" ? "▰" : "♢"}
                          </div>
                          <div className="space-y-1.5">
                            <div className="cursor-pointer text-[15px] font-bold text-foreground hover:text-primary">
                              {row.name}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {row.tags.map((tag, i) => (
                                <span key={tag} className={`rounded-sm px-2 py-0.5 text-[11px] font-bold ${row.tagStyles[i]}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="mt-1 text-[12px] font-medium text-muted-foreground">
                              申报截止：
                              <b className={`font-bold ${row.deadlineUrgent ? "text-deadline-urgent" : "text-muted-foreground"}`}>
                                {row.deadline}
                              </b>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-foreground">
                        {row.type}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center space-y-1.5">
                          <span className={`text-[18px] font-black leading-none ${matchColorMap[row.matchLevel].text}`}>
                            {row.match}%
                          </span>
                          <Progress value={row.match} className={`h-[6px] w-16 ${matchColorMap[row.matchLevel].indicator}`} />
                          <span className={`text-[12px] font-bold ${matchColorMap[row.matchLevel].text}`}>
                            {matchColorMap[row.matchLevel].label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ul className="space-y-1.5 text-[13px] text-foreground">
                          {row.matched.map((m) => (
                            <li key={m} className="flex items-start gap-1.5">
                              <Check className="mt-[2px] size-[14px] shrink-0 text-success" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        <ul className="space-y-1.5 text-[13px] text-muted-foreground">
                          {row.gaps.map((g) => (
                            <li key={g} className="flex items-start gap-2">
                              <span className="mt-1.5 size-[5px] shrink-0 rounded-full bg-muted-foreground/50" />
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 底部：计数 + 分页 */}
            <div className="mt-auto flex items-center justify-between border-t border-border px-6 py-3 text-[13px] font-medium text-muted-foreground">
              <span>共 {visibleCount} 条政策匹配结果</span>
              <div className="flex items-center gap-1.5">
                <button className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted">
                  ‹
                </button>
                <button className="flex size-7 items-center justify-center rounded border border-primary bg-primary text-sm font-bold text-primary-foreground">
                  1
                </button>
                <button className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted">
                  ›
                </button>
              </div>
            </div>
          </TabsContent>

          {/* ---- Tab 2: 培育计划 ---- */}
          <TabsContent value="plan" className="flex flex-1 flex-col p-6">
            {/* 标题行 */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[20px] font-black tracking-wide text-foreground">
                企业培育目标总览
              </h3>
              <div className="flex gap-3">
                <button className="rounded-lg border border-primary/20 bg-card px-4 py-2 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-accent">
                  调整培育目标
                </button>
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[0_4px_10px_rgba(37,99,235,0.2)] transition-colors hover:bg-primary/80">
                  生成培育任务
                </button>
              </div>
            </div>

            {/* KPI 卡片 */}
            <div className="mb-8 flex flex-col rounded-xl border border-border p-5 pb-3 shadow-sm">
              <div className="grid grid-cols-4 divide-x divide-border text-center">
                {[
                  { label: "培育周期", value: "12", unit: "个月", color: "text-primary" },
                  { label: "可申报政策", value: "4", unit: "项", color: "text-success" },
                  { label: "预计获得称号", value: "3", unit: "类", color: "text-purple-500" },
                  { label: "预计综合收益", value: "160", unit: "万+", color: "text-warning" },
                ].map((kpi) => (
                  <div key={kpi.label}>
                    <div className="mb-1 text-[13px] font-bold text-foreground">{kpi.label}</div>
                    <div className={`text-[32px] font-black leading-none ${kpi.color}`}>
                      {kpi.value}
                      <span className="ml-1 text-[15px] font-bold text-foreground">{kpi.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-right text-[12px] font-medium text-muted-foreground">
                说明：基于企业数据与政策申报条件智能生成培育路径，收益为模拟测算，结果仅供参考｜计划生成：2026-07-01
              </div>
            </div>

            {/* 时间线 */}
            <div className="relative mb-6 flex h-[70px] items-center rounded-2xl border border-border bg-accent/30 shadow-sm">
              <div className="absolute left-[12%] right-[12%] h-[2px] bg-muted" />
              {phases.map((p) => (
                <div key={p.num} className="z-10 flex flex-1 items-center justify-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-full text-[15px] font-black text-white shadow-md" style={{ backgroundColor: p.color }}>
                    {p.num}
                  </div>
                  <div className="leading-tight">
                    <div className="text-[15px] font-black text-foreground">{p.title}</div>
                    <div className="text-[12px] font-bold text-muted-foreground">{p.period}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 阶段卡片 */}
            <div className="grid flex-1 grid-cols-4 gap-4">
              {phases.map((p) => (
                <div
                  key={p.num}
                  className="flex flex-col rounded-xl border border-t-4 border-border bg-card p-4 shadow-sm"
                  style={{ borderTopColor: p.color }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base font-black text-foreground">
                      <span className="flex size-7 items-center justify-center rounded-full text-sm text-white shadow-sm" style={{ backgroundColor: p.color }}>
                        {p.num}
                      </span>
                      {p.title}
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-[12px] font-bold text-muted-foreground">
                      {p.period}
                    </span>
                  </div>
                  <div className="mb-4 h-[44px] text-sm font-bold leading-relaxed text-foreground/80">
                    {p.desc}
                  </div>
                  <div className="space-y-3 text-[13px] font-medium">
                    <div className="flex gap-2">
                      <span className="w-[60px] shrink-0 text-muted-foreground">可申报</span>
                      <span className="cursor-pointer font-bold leading-snug text-primary hover:underline">
                        {p.policy}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-[60px] shrink-0 text-muted-foreground">预计称号</span>
                      <span className="font-bold leading-snug text-purple-500">{p.title_expected}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="w-[60px] shrink-0 text-muted-foreground">预计收益</span>
                      <span className="text-[18px] font-black text-warning">{p.benefit}</span>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
                    {p.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[12px] font-bold text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
