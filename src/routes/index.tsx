import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Building2, FileText, Search } from "lucide-react"
import {
  PolicyListDialog,
  EnterpriseListDialog,
  MatchAnalysisDialog,
} from "@/components/home-dialogs"

export const Route = createFileRoute("/")({
  component: HomeComponent,
})

/* ===========================================================================
 * 首页 — 园区政策服务总览 + 服务工作台
 *
 * 设计来源：prototype/首页.html 最终统一轮（行 1092-1470 风格统一）
 * Token 使用：优先使用 shadcn 语义 token + 新增业务语义 token
 *           仅装饰性/组件内颜色使用 Tailwind 内置色
 * =========================================================================== */

// ---- Mock Data ----

const kpiData = [
  { icon: FileText, label: "覆盖政策数", value: "84", unit: "条", badge: "查看清单", iconBg: "bg-blue-50", iconColor: "text-primary", dialog: "policy" as const },
  { icon: Building2, label: "已服务企业数", value: "326", unit: "家", badge: "查看名单", iconBg: "bg-green-50", iconColor: "text-match-high", dialog: "enterprise" as const },
  { icon: Search, label: "累计匹配分析", value: "186", unit: "次", badge: "查看分布", iconBg: "bg-purple-50", iconColor: "text-purple-500", dialog: "match" as const },
]

const coverageData = [
  {
    name: "上游",
    sub: "研发/原材料",
    pct: 45,
    color: "bg-match-high",
    textColor: "text-match-high",
    tags: ["研发费用加计扣除", "技术创新"],
    tagBg: "bg-green-50",
  },
  {
    name: "中游",
    sub: "生产制造",
    pct: 82,
    color: "bg-primary",
    textColor: "text-primary",
    tags: ["技术改造", "设备更新", "专精特新"],
    tagBg: "bg-blue-50",
  },
  {
    name: "下游",
    sub: "应用/销售",
    pct: 51,
    color: "bg-warning",
    textColor: "text-warning",
    tags: ["市场拓展", "应用推广"],
    tagBg: "bg-orange-50",
  },
] as const

const policyList = [
  { name: "泉州市高质量发展支持企业技术改造专项", type: "技改类", count: 14, status: "ending" as const },
  { name: "泉州市专精特新中小企业梯度培育计划", type: "培育类", count: 9, status: "active" as const },
  { name: "南安市高新技术企业培育奖励政策", type: "高企培育", count: 16, status: "closed" as const },
]

const enterpriseList = [
  { name: "泉州南安智能装备有限公司", node: "轴承", policyCount: 3, status: "培育中" as const },
  { name: "福建蓝田新材料科技有限公司", node: "数控机床", policyCount: 2, status: "培育中" as const },
  { name: "泉州科能精密制造有限公司", node: "纺织机械", policyCount: 5, status: "未培育" as const },
]

const statusBadge = {
  ending: "bg-warning/10 text-warning border border-warning/20",
  active: "bg-success/10 text-success border border-success/20",
  closed: "bg-muted text-muted-foreground border border-border",
}

const statusLabel = {
  ending: "7天内截止",
  active: "申报中",
  closed: "已结束",
}

const enterpriseStatusBadge = (status: string) =>
  status === "未培育"
    ? "bg-muted text-muted-foreground border border-border"
    : "bg-accent text-primary border border-primary/20"

// ---- Component ----

function HomeComponent() {
  const [dialog, setDialog] = useState<"policy" | "enterprise" | "match" | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {/* ================================================================
       * 管理者看板 — 园区政策服务总览
       * 原型：3 列 KPI 卡片，简洁白底 + 图标 + 大数字
       * ================================================================ */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3.5 flex items-center gap-2 text-base font-extrabold text-foreground">
          <span className="block h-[18px] w-1 rounded-sm bg-primary" />
          园区政策服务总览
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {kpiData.map((kpi) => (
            <div
              key={kpi.label}
              className="relative flex min-h-[96px] flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[13px] font-bold text-muted-foreground">
                <span className={`flex size-8 items-center justify-center rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}>
                  <kpi.icon className="size-4" />
                </span>
                {kpi.label}
              </div>
              <div className="mt-1.5">
                <div className="flex items-baseline gap-2 text-[30px] font-extrabold text-primary">
                  {kpi.value}
                  <span className="text-sm font-normal text-muted-foreground">{kpi.unit}</span>
                  <button
                    type="button"
                    className="ml-1.5 inline-flex cursor-pointer items-center rounded-full border border-primary/30 bg-accent px-2 py-0.5 text-xs font-bold text-primary outline-0 transition-colors hover:bg-primary/10 hover:border-primary/50 focus:outline-0 focus-visible:outline-0 focus-visible:ring-0 [&:focus-visible]:[outline-style:none]"
                    onClick={() => setDialog(kpi.dialog)}
                  >
                    {kpi.badge}
                  </button>
                </div>
              </div>
              {/* 装饰性背景圆 */}
              <div className="pointer-events-none absolute -bottom-[30px] -right-6 size-[76px] rounded-full bg-muted/50" />
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
       * 服务工作台
       * 左侧：匹配结果分析（覆盖度 + 柱状图 + AI 建议）
       * 右侧：政策找企业表格 + 企业找政策表格
       * ================================================================ */}
      <section className="flex-1 rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3.5 flex items-center gap-2 text-base font-extrabold text-foreground">
          <span className="block h-[18px] w-1 rounded-sm bg-primary" />
          服务工作台
        </h2>

        <div className="grid grid-cols-[370px_minmax(0,1fr)] gap-4">
          {/* ---- 左侧：匹配结果分析 ---- */}
          <div className="flex flex-col rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-foreground">
              <span className="block h-4 w-1 rounded-sm bg-primary" />
              匹配结果分析
            </h3>

            {/* 园区政策覆盖度 */}
            <div className="relative mb-2.5 flex items-center justify-between rounded-xl border border-primary/20 bg-gradient-to-br from-blue-50/80 to-white p-3.5 shadow-sm">
              <span className="text-sm font-extrabold text-foreground">
                园区政策覆盖度
                <span className="ml-1 inline-flex size-4 cursor-pointer items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground">
                  ?
                </span>
              </span>
              <span className="text-[40px] font-black leading-none -tracking-wider text-primary">
                67%
              </span>
            </div>

            {/* 上中下游覆盖度柱状图 */}
            <div className="flex flex-col gap-1">
              {coverageData.map((item) => (
                <div key={item.name}>
                  <div className="grid grid-cols-[82px_1fr_46px] items-center gap-2.5">
                    <span className="text-[13px] font-extrabold leading-tight text-foreground">
                      {item.name}
                      <br />
                      <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                    </span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className={`text-sm font-black text-right ${item.textColor}`}>{item.pct}%</span>
                  </div>
                  <div className="ml-[92px] mt-1 mb-0.5 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded px-2 py-0.5 text-[11px] font-bold ${item.tagBg} ${item.textColor}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* AI 建议 */}
            <div className="mt-2 rounded-lg border-l-[3px] border-l-primary bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <span className="font-extrabold text-primary">AI建议：</span>
              中游生产制造环节政策覆盖度最高，建议优先推动技改类、设备更新类政策触达；上游企业重点补充研发能力，下游企业重点关注市场拓展类政策。
            </div>
          </div>

          {/* ---- 右侧：政策 + 企业表格 ---- */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* 政策找企业 */}
            <div className="flex flex-1 flex-col rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-foreground">
                  <span className="block h-4 w-1 rounded-sm bg-primary" />
                  政策找企业
                </h3>
                <span className="cursor-pointer text-[13px] font-bold text-primary hover:underline">
                  查看全部政策 &gt;
                </span>
              </div>

              <div className="flex-1 overflow-hidden rounded-lg border border-border">
                <table className="w-full table-fixed text-[13px]">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      <th className="px-2.5 py-2 text-left font-extrabold" style={{ width: "43%" }}>
                        政策名称
                      </th>
                      <th className="px-2.5 py-2 text-center font-extrabold" style={{ width: "17%" }}>
                        政策类型
                      </th>
                      <th className="px-2.5 py-2 text-center font-extrabold" style={{ width: "16%" }}>
                        高匹配企业数
                      </th>
                      <th className="px-2.5 py-2 text-center font-extrabold" style={{ width: "13%" }}>
                        状态
                      </th>
                      <th className="px-2.5 py-2 text-center font-extrabold" style={{ width: "11%" }}>
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {policyList.map((p) => (
                      <tr key={p.name} className="text-foreground hover:bg-accent/50">
                        <td className="truncate px-2.5 py-2.5 font-extrabold text-foreground">{p.name}</td>
                        <td className="px-2.5 py-2.5 text-center">
                          <span className="inline-block rounded-sm bg-success/10 px-2 py-0.5 text-xs font-bold text-success border border-success/20">
                            {p.type}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <span className="cursor-pointer text-[15px] font-black text-primary hover:underline">
                            {p.count} 家
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <span
                            className={`inline-flex min-w-[60px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-extrabold ${statusBadge[p.status]}`}
                          >
                            {statusLabel[p.status]}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <button className="rounded-md border border-primary/25 bg-card px-2.5 py-1 text-[11px] font-extrabold text-primary transition-colors hover:bg-accent hover:text-primary">
                            查看
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 企业找政策 */}
            <div className="flex flex-1 flex-col rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-foreground">
                  <span className="block h-4 w-1 rounded-sm bg-primary" />
                  企业找政策
                </h3>
                <span className="cursor-pointer text-[13px] font-bold text-primary hover:underline">
                  查看全部企业 &gt;
                </span>
              </div>

              <div className="flex-1 overflow-hidden rounded-lg border border-border">
                <table className="w-full table-fixed text-[13px]">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      <th className="px-2.5 py-2 text-left font-extrabold" style={{ width: "43%" }}>
                        企业名称
                      </th>
                      <th className="px-2.5 py-2 text-center font-extrabold" style={{ width: "18%" }}>
                        所属节点
                      </th>
                      <th className="px-2.5 py-2 text-center font-extrabold" style={{ width: "17%" }}>
                        高匹配政策数
                      </th>
                      <th className="px-2.5 py-2 text-center font-extrabold" style={{ width: "12%" }}>
                        状态
                      </th>
                      <th className="px-2.5 py-2 text-center font-extrabold" style={{ width: "10%" }}>
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enterpriseList.map((e) => (
                      <tr key={e.name} className="text-foreground hover:bg-accent/50">
                        <td className="truncate px-2.5 py-2.5 font-extrabold text-foreground">{e.name}</td>
                        <td className="px-2.5 py-2.5 text-center">
                          <span className="inline-block rounded-sm bg-accent px-2 py-0.5 text-xs font-bold text-primary border border-primary/20">
                            {e.node}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <span className="cursor-pointer text-[15px] font-black text-primary hover:underline">
                            {e.policyCount}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <span
                            className={`inline-block rounded-sm px-2 py-0.5 text-xs font-bold ${enterpriseStatusBadge(e.status)}`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <Link
                            to="/enterprise"
                            className="inline-block rounded-md border border-primary/25 bg-card px-2.5 py-1 text-[11px] font-extrabold text-primary transition-colors hover:bg-accent hover:text-primary"
                          >
                            查看详情
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
       * KPI 弹窗
       * ================================================================ */}
      <PolicyListDialog
        open={dialog === "policy"}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      />
      <EnterpriseListDialog
        open={dialog === "enterprise"}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      />
      <MatchAnalysisDialog
        open={dialog === "match"}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      />
    </div>
  )
}