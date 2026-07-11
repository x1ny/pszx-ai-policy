import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Check, ExternalLink } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { BizDialog } from "@/components/biz-dialog"

export const Route = createFileRoute("/policy")({
  component: PolicyPage,
})

/* ===========================================================================
 * 政策卡片页
 * 设计来源：prototype/政策卡片.html
 * 不实现：右侧 AI 对话框
 * =========================================================================== */

// ---- Mock Data ----

const policy = {
  title: "泉州市高质量发展支持企业技术改造专项",
  icon: "🔧",
  iconBg: "bg-success",
  tags: ["市级", "技改类", "资金补贴"],
  daysLeft: 30,
  deadline: "2026-07-31",
  deadlineUrgent: true,
  total: 42,
  high: 14,
  mid: 23,
  low: 5,
  docNumber: "泉工信投资〔2025〕115号",
  issuer: "泉州市工业和信息化局、泉州市财政局",
  publishDate: "2025年7月4日",
  applyDeadline: "2026年7月31日",
  supportMethod:
    "对实施技术改造的工业企业，按项目建设期内实际购置设备投资额（含技术、软件等）的不高于10%给予补助，单个项目最高不超过500万元；符合工业龙头或\u2018亩均论英雄\u2019A类条件的项目，最高可按政策口径提高至1000万元。",
  conditions: [
    { name: "所在地区", value: "泉州市范围内注册登记且项目落地南安市的工业企业", required: true },
    { name: "主体类型", value: "依法登记注册的制造业企业", required: true },
    { name: "经营资格", value: "依法生产经营，无重大违法违规记录", required: true },
    { name: "项目状态", value: "项目已完成备案或核准，并纳入技改投资统计", required: true },
    { name: "设备投资", value: "设备（含技术、软件）投资额不低于300万元", required: true },
    { name: "材料要求", value: "设备清单、合同、发票、支付凭证等材料完整", required: true },
    { name: "行业方向", value: "重点支持食品加工、智能装备、新材料、电子信息等主导产业", required: false },
  ],
}

const enterpriseData = {
  high: [
    {
      name: "泉州南安智通装备有限公司",
      match: 92,
      matched: ["企业规模：中型企业", "行业匹配：专用设备制造", "设备投资：≥300万元", "项目属性：已具备"],
      gaps: ["设备采购发票归档建议补充"],
      status: "park-doing" as const,
    },
    {
      name: "福建蓝田新材料科技有限公司",
      match: 90,
      matched: ["企业规模：中型企业", "行业匹配：新材料", "设备投资：≥300万元", "项目已备案"],
      gaps: ["设备清单需更新"],
      status: "park-doing" as const,
    },
    {
      name: "泉州创威精密制造有限公司",
      match: 88,
      matched: ["企业规模：中型企业", "行业匹配：精密制造", "设备投资：≥300万元"],
      gaps: ["发票凭证待补充", "投资项目备案材料待核验"],
      status: "pending-task" as const,
    },
    {
      name: "南安捷锐智能装备有限公司",
      match: 86,
      matched: ["企业规模：中型企业", "行业匹配：智能装备", "设备投资：达标"],
      gaps: ["合同付款凭证归档不足", "项目备案更新"],
      status: "pending-task" as const,
    },
    {
      name: "泉州蓝田未来科技有限公司",
      match: 85,
      matched: ["企业规模：中型企业", "行业匹配：科技推广", "设备投资：达标"],
      gaps: ["备案材料需补充"],
      status: "pending-task" as const,
    },
  ],
  mid: [
    {
      name: "泉州科能精密制造有限公司",
      match: 68,
      matched: ["企业规模：中型企业", "行业匹配：精密制造"],
      gaps: ["设备投资额不足300万元", "项目备案未完成", "部分设备发票缺失"],
      status: "company-wait" as const,
    },
    {
      name: "南安鑫源机械制造有限公司",
      match: 62,
      matched: ["企业规模：中型企业", "行业匹配：机械制造"],
      gaps: ["设备投资额偏低", "项目备案状态待确认", "合同材料不完整"],
      status: "company-wait" as const,
    },
    {
      name: "福建盛达传动科技有限公司",
      match: 58,
      matched: ["企业规模：中型企业", "行业匹配"],
      gaps: ["设备投资额不足", "备案材料缺失", "发票凭证不完整"],
      status: "company-wait" as const,
    },
  ],
  low: [
    {
      name: "南安永盛机械有限公司",
      match: 42,
      matched: ["企业规模：小型企业"],
      gaps: ["行业方向不匹配", "设备投资额严重不足", "无技改项目备案", "材料不齐全"],
      status: "company-wait" as const,
    },
    {
      name: "泉州恒达精密部件有限公司",
      match: 35,
      matched: ["企业规模：小型企业"],
      gaps: ["行业不匹配", "设备投资额不足", "无备案项目", "缺乏申报基础"],
      status: "company-wait" as const,
    },
  ],
}

const tabConfig = [
  { key: "high" as const, label: "高匹配企业", extra: "≥80% | 14家" },
  { key: "mid" as const, label: "中匹配企业", extra: "50%~80% | 23家" },
  { key: "low" as const, label: "低匹配企业", extra: "20%~50% | 5家" },
]

const matchColorMap = {
  high: { text: "text-success", indicator: "[&_[data-slot=progress-indicator]]:bg-success" },
  mid: { text: "text-warning", indicator: "[&_[data-slot=progress-indicator]]:bg-warning" },
  low: { text: "text-primary", indicator: "[&_[data-slot=progress-indicator]]:bg-primary" },
}

// ---- Component ----

function PolicyPage() {
  const [activeTab, setActiveTab] = useState<"high" | "mid" | "low">("high")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pushModalOpen, setPushModalOpen] = useState(false)

  const currentData = enterpriseData[activeTab]

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
        <strong className="font-bold text-foreground">{policy.title}</strong>
      </nav>

      {/* ================================================================
       * 政策头部卡片
       * ================================================================ */}
      <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-lg text-2xl text-white shadow-sm ${policy.iconBg}`}>
              {policy.icon}
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{policy.title}</h2>
                <a href="#" target="_blank" className="text-primary hover:text-primary/80" title="查看政策原文">
                  <ExternalLink className="size-4" />
                </a>
                {policy.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-success/10 text-success border border-success/20 rounded px-2 py-0.5 text-xs font-bold">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                剩余申报时间：
                <span className={`text-sm font-bold ${policy.deadlineUrgent ? "text-deadline-urgent" : "text-muted-foreground"}`}>
                  {policy.daysLeft}天
                </span>
                ({policy.deadline} 截止)
              </div>
            </div>
          </div>
          <div className="flex gap-6 rounded-lg border border-[#f3f4f6] bg-[#f9fafb80] px-4 py-2 text-center">
            {[
              { label: "匹配企业总数", value: policy.total, color: "text-primary" },
              { label: "高匹配", value: policy.high, color: "text-success" },
              { label: "中匹配", value: policy.mid, color: "text-warning" },
              { label: "低匹配", value: policy.low, color: "text-foreground" },
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
            { label: "发文文号", value: policy.docNumber },
            { label: "发布单位", value: policy.issuer },
            { label: "发布时间", value: policy.publishDate },
            { label: "申报截止时间", value: policy.applyDeadline },
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
          <p className="text-sm leading-relaxed text-foreground/80">{policy.supportMethod}</p>
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
              <div className="flex items-center gap-2">
                <button className="rounded-lg bg-gradient-to-r from-primary to-primary-gradient-end px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-colors hover:from-primary/90 hover:to-primary-gradient-end/90">
                  AI生成服务任务
                </button>
                <button
                  className="rounded-md border border-success/30 bg-success px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-success/90 disabled:opacity-45"
                  disabled={selectedCount === 0}
                  onClick={() => setPushModalOpen(true)}
                >
                  发送企业提醒
                </button>
                <button className="rounded-md border border-primary/20 bg-card px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-accent">
                  导出表格
                </button>
              </div>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto">
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
                  {currentData.map((row) => (
                    <TableRow key={row.name} className="hover:bg-accent/50">
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(row.name)}
                          onChange={() => toggleOne(row.name)}
                          className="size-4 cursor-pointer accent-primary rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <Link to="/enterprise" className="font-extrabold text-foreground hover:text-primary hover:underline">
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center space-y-1.5">
                          <span className={`text-[15px] font-black ${matchColorMap[activeTab].text}`}>
                            {row.match}%
                          </span>
                          <Progress value={row.match} className={`h-[6px] w-16 ${matchColorMap[activeTab].indicator}`} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <ul className="flex flex-col gap-1.5 text-[13px]">
                          {row.matched.map((m) => (
                            <li key={m} className="flex items-start gap-1.5 text-foreground">
                              <Check className="mt-[2px] size-[14px] shrink-0 text-success" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        <ul className="flex flex-col gap-1.5 text-[13px]">
                          {row.gaps.map((g) => (
                            <li key={g} className="flex items-start gap-2 text-muted-foreground">
                              <span className="mt-1.5 size-[5px] shrink-0 rounded-full bg-muted-foreground/50" />
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link
                          to="/enterprise"
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
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs font-medium text-muted-foreground hover:bg-transparent">
                <TableHead className="w-1/5 px-4 py-2.5">指标名称</TableHead>
                <TableHead className="px-4 py-2.5">指标值</TableHead>
                <TableHead className="w-24 px-4 py-2.5 text-center">必要指标</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {policy.conditions.map((cond) => (
                <TableRow key={cond.name} className="text-xs text-foreground hover:bg-accent/50">
                  <TableCell className="px-4 py-2.5 font-medium">{cond.name}</TableCell>
                  <TableCell className="px-4 py-2.5 text-muted-foreground">{cond.value}</TableCell>
                  <TableCell className="px-4 py-2.5 text-center">
                    <Badge
                      variant="secondary"
                      className={
                        cond.required
                          ? "bg-success/10 text-success border border-success/20 rounded px-2 py-0.5 text-[10px]"
                          : "bg-muted text-muted-foreground border border-border rounded px-2 py-0.5 text-[10px]"
                      }
                    >
                      {cond.required ? "是" : "否"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ================================================================
       * 推送提醒弹窗
       * ================================================================ */}
      <BizDialog
        open={pushModalOpen}
        onOpenChange={setPushModalOpen}
        title="推送申报提醒确认"
        width="sm:max-w-[620px]"
      >
        <div className="flex flex-col gap-3.5">
          <div className="rounded-lg border border-border bg-muted/50 p-3.5">
            <div className="mb-2 text-[13px] font-extrabold text-foreground">1. 政策基础信息</div>
            <div className="grid grid-cols-2 gap-2.5 text-[13px] text-muted-foreground">
              <div>
                政策：<strong className="text-foreground">{policy.title}</strong>
              </div>
              <div>
                申报截止：<strong className="text-deadline-urgent">{policy.deadline}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-3.5">
            <div className="mb-2 text-[13px] font-extrabold text-foreground">
              2. 待推送企业清单（本次选中 {selectedCount} 家）
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...selected].map((name) => (
                <span key={name} className="rounded-full border border-primary/20 bg-card px-2 py-1 text-[12px] font-bold text-primary">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-3.5">
            <div className="mb-2 text-[13px] font-extrabold text-foreground">3. 推送渠道（默认全选）</div>
            <div className="flex gap-4 text-[13px] text-foreground">
              {["短信通知", "平台站内消息", "微信推送"].map((ch) => (
                <label key={ch} className="inline-flex cursor-pointer items-center gap-1.5">
                  <input type="checkbox" defaultChecked className="size-4 cursor-pointer accent-primary rounded" />
                  {ch}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-3.5">
            <div className="mb-2 text-[13px] font-extrabold text-foreground">4. 通知预览</div>
            <p className="rounded-md border border-border bg-card p-2.5 text-[13px] leading-relaxed text-muted-foreground">
              您好！根据南安市政策服务系统研判，【企业名称】有机会参与《{policy.title}》的申报。申报将于 {policy.deadline} 截止，请尽快登录平台核对并准备申报材料。
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2.5">
          <button
            className="rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-extrabold text-muted-foreground transition-colors hover:bg-muted"
            onClick={() => setPushModalOpen(false)}
          >
            取消
          </button>
          <button
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-extrabold text-primary-foreground shadow-[0_6px_14px_rgba(24,144,255,0.18)] transition-colors hover:bg-primary/80"
            onClick={() => setPushModalOpen(false)}
          >
            确认批量推送
          </button>
        </div>
      </BizDialog>
    </div>
  )
}