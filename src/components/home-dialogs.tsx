import { PieChart, Pie, Cell } from "recharts"
import { BizDialog } from "@/components/biz-dialog"
import type { components } from "@/api/schema"
import { getPolicyDeadlineStatus } from "@/lib/policy"

/* ===========================================================================
 * 首页三个 KPI 指标弹窗
 * 设计来源：prototype/首页.html 行 2071-2159
 * =========================================================================== */

// ---- Mock Data ----

const enterpriseList = [
  {
    name: "泉州南安智能装备有限公司",
    node: "轴承",
    policyCount: 3,
    status: "培育中" as const,
  },
  {
    name: "福建蓝田新材料科技有限公司",
    node: "数控机床",
    policyCount: 2,
    status: "培育中" as const,
  },
  {
    name: "泉州科能精密制造有限公司",
    node: "纺织机械",
    policyCount: 5,
    status: "未培育" as const,
  },
  {
    name: "南安精工轴承制造有限公司",
    node: "轴承",
    policyCount: 4,
    status: "培育中" as const,
  },
  {
    name: "闽南数控装备有限公司",
    node: "数控机床",
    policyCount: 3,
    status: "未培育" as const,
  },
]

const matchData = [
  { name: "高匹配", value: 62, color: "#1890ff" },
  { name: "中匹配", value: 91, color: "#36cfc9" },
  { name: "低匹配", value: 33, color: "#faad14" },
]

const matchLegend = [
  {
    color: "bg-[#1890ff]",
    label: "高匹配",
    count: 62,
    textColor: "text-[#1890ff]",
  },
  {
    color: "bg-[#36cfc9]",
    label: "中匹配",
    count: 91,
    textColor: "text-[#36cfc9]",
  },
  {
    color: "bg-warning",
    label: "低匹配",
    count: 33,
    textColor: "text-warning",
  },
]

const enterpriseStatusBadge = (status: string) =>
  status === "未培育"
    ? "bg-muted text-muted-foreground border border-border"
    : "bg-accent text-primary border border-primary/20"

// ---- Components ----

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TopPolicy = components["schemas"]["TopPolicy"]

interface PolicyListDialogProps extends DialogProps {
  policies: TopPolicy[]
}

export function PolicyListDialog({
  open,
  onOpenChange,
  policies,
}: PolicyListDialogProps) {
  return (
    <BizDialog
      open={open}
      onOpenChange={onOpenChange}
      title="📑 政策清单"
      width="sm:max-w-[760px]"
    >
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full table-fixed text-[13px]">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th
                className="px-3 py-2.5 text-left font-extrabold"
                style={{ width: "48%" }}
              >
                政策名称
              </th>
              <th
                className="px-3 py-2.5 text-center font-extrabold"
                style={{ width: "22%" }}
              >
                政策类型
              </th>
              <th
                className="px-3 py-2.5 text-center font-extrabold"
                style={{ width: "20%" }}
              >
                高匹配企业数
              </th>
              <th
                className="px-3 py-2.5 text-center font-extrabold"
                style={{ width: "16%" }}
              >
                状态
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {policies.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  暂无重点政策
                </td>
              </tr>
            ) : (
              policies.map((p) => {
                const deadlineStatus = getPolicyDeadlineStatus(p.deadline)

                return (
                  <tr
                    key={p.policyId}
                    className="text-foreground hover:bg-accent/50"
                  >
                    <td className="truncate px-3 py-2.5 font-extrabold text-foreground">
                      {p.title}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-block rounded-sm border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                        {p.policyAttribute ?? "--"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">
                      --
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex min-w-[60px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-extrabold ${deadlineStatus.className}`}
                      >
                        {deadlineStatus.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
        当前展示首页接口返回的重点政策，不代表完整政策库。
      </p>
    </BizDialog>
  )
}

export function EnterpriseListDialog({ open, onOpenChange }: DialogProps) {
  return (
    <BizDialog
      open={open}
      onOpenChange={onOpenChange}
      title="🏢 企业名单"
      width="sm:max-w-[760px]"
    >
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full table-fixed text-[13px]">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th
                className="px-3 py-2.5 text-left font-extrabold"
                style={{ width: "46%" }}
              >
                企业名称
              </th>
              <th
                className="px-3 py-2.5 text-center font-extrabold"
                style={{ width: "20%" }}
              >
                所属节点
              </th>
              <th
                className="px-3 py-2.5 text-center font-extrabold"
                style={{ width: "18%" }}
              >
                高匹配政策数
              </th>
              <th
                className="px-3 py-2.5 text-center font-extrabold"
                style={{ width: "16%" }}
              >
                状态
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enterpriseList.map((e) => (
              <tr key={e.name} className="text-foreground hover:bg-accent/50">
                <td className="truncate px-3 py-2.5 font-extrabold text-foreground">
                  {e.name}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-block rounded-sm border border-primary/20 bg-accent px-2 py-0.5 text-xs font-bold text-primary">
                    {e.node}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="cursor-pointer text-[15px] font-black text-primary hover:underline">
                    {e.policyCount}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-block rounded-sm px-2 py-0.5 text-xs font-bold ${enterpriseStatusBadge(e.status)}`}
                  >
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
        当前仅展示重点企业示例，可点击"查看全部企业"进入完整企业库。
      </p>
    </BizDialog>
  )
}

export function MatchAnalysisDialog({ open, onOpenChange }: DialogProps) {
  return (
    <BizDialog
      open={open}
      onOpenChange={onOpenChange}
      title="📈 政策匹配结果分布"
    >
      <div className="flex items-center gap-5.5">
        {/* 环形图 */}
        <div className="relative shrink-0" style={{ width: 168, height: 168 }}>
          <PieChart width={168} height={168}>
            <Pie
              data={matchData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {matchData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            {/* 中心文字 */}
            <text
              x="50%"
              y="38%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 12 }}
            >
              总计
            </text>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
              style={{ fontSize: 28, fontWeight: 800 }}
            >
              186
            </text>
            <text
              x="50%"
              y="62%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 12 }}
            >
              组
            </text>
          </PieChart>
        </div>

        {/* 图例 */}
        <div className="flex flex-1 flex-col gap-4.5 pl-2">
          {matchLegend.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[12px_1fr_auto] items-center gap-x-2.5 text-sm text-foreground"
            >
              <span
                className={`inline-block size-2.5 rounded-full ${item.color}`}
              />
              <span className="font-semibold whitespace-nowrap">
                {item.label}
              </span>
              <span className="justify-self-end whitespace-nowrap">
                <span
                  className={`text-[22px] font-extrabold ${item.textColor}`}
                >
                  {item.count}
                </span>
                <span className="ml-0.5 text-xs text-muted-foreground">组</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3.5 rounded-lg bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        统计口径：1 家企业 × 1 项政策 = 1
        组匹配结果；本模块仅统计已完成匹配度计算的结果。
      </p>
    </BizDialog>
  )
}
