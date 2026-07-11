## 0. 决策落地对照

| 决策 | 落地方式 |
|---|---|
| 蓝色系用原型色 | 用首页.html 里已经写好的一套 CSS 变量作为 token 源（见下） |
| 图表库 | Recharts（理由见第 3 节） |
| 图标统一 | lucide-react，替换 emoji/Unicode符号/FontAwesome 三套 |
| Mock 数据 | 独立 `src/mock/` 目录，按域分文件 + TS 类型 |
| 只做桌面 | 全局锁 `min-width`，不写响应式断点 |

## 1. 色彩 Token 方案

好消息：首页.html 文件末尾的"本轮优化"里其实已经沉淀了一套完整的品牌色变量（这是原型作者自己在最后一轮迭代里收敛出的结果，应该以它为准，而不是文件早期的 `#1890ff`）：

```
--primary: #1677ff;      --primary-2: #22c7ff;   --primary-soft: #eef6ff;
--green: #15b881;        --purple: #7c3aed;      --orange: #f59e0b;
--text-main: #172033;    --text-sub: #6b7280;    --line: #e7edf6;
```

落地到 `src/index.css` 的 `@theme`：

- `--primary` / `--primary-foreground`：替换成 `#1677ff` 系（渐变辅助色 `--primary-2: #22c7ff` 单独留一个 token，因为原型大量用 `linear-gradient(135deg, #1677ff, #22a7ff)` 做按钮/高亮，不是纯色）。
- **匹配度语义色单独建组，不复用 shadcn 的 destructive/muted**：`--match-high`（绿 `#16a34a`）、`--match-mid`（橙 `#f97316`）、`--match-low`（蓝/灰，原型两处不一致，建议统一为 `#64748b` 灰，因为"低匹配"是中性提示不是负面色）。这组独立命名是因为"高中低匹配"是核心业务语义，不该和 shadcn 默认的 success/warning/danger 混用，后面代码里读 `bg-match-high` 比读 `bg-success` 更明确表达业务含义。
- **状态色**：danger（红 `#f5222d`，用于紧急截止日）、warning（橙 `#faad14`）、neutral（灰 `#909399`）。
- 圆角：收敛为 4 档（`sm=6px / md=10px / lg=14px / pill=999px`），替掉原型里 10 个随手写的数值。
- 阴影：卡片阴影固定用原型给出的 `--card-shadow: 0 12px 30px rgba(31,89,171,.08)`，弹窗单独一档更重的阴影。
- 暗色模式：先在 `.dark` 里给这些新 token 一版合理取值（占位即可，因为原型本身没设计暗色），不需要现在做到像素级打磨。

## 2. 图标：lucide-react 映射表

依赖：`bun add lucide-react`。原型里用到的符号 → lucide 组件名（按功能分组）：

| 原型符号/类 | lucide 图标 |
|---|---|
| 🤖 AI 助手 | `Bot` |
| 🔄 清空 | `RotateCcw` |
| ➤ 发送 | `Send` |
| 📅 / fa-calendar | `Calendar` |
| 🔔 / fa-bell | `Bell` |
| 📑 / 📄 / fa-clipboard | `FileText` / `Clipboard` |
| 🏢 / fa-building | `Building2` |
| 🔍 | `Search` |
| 📈 | `TrendingUp` |
| 📰 今日快讯 | `Newspaper` |
| 💡 | `Lightbulb` |
| 📌 | `Pin` |
| ✓ / ✅ / fa-circle-check | `CheckCircle2` |
| 🎉 成功提示 | `PartyPopper` |
| ★（政策图标） | `Star` |
| ♢（政策图标） | `Gem` |
| ▦（企业图标） | `LayoutGrid` |
| ▰（政策图标） | `Blocks` |
| ⌁ / fa-wrench（技改） | `Wrench` |
| fa-arrow-left | `ArrowLeft` |
| fa-angle-left/right/down | `ChevronLeft` / `ChevronRight` / `ChevronDown` |
| fa-list-check | `ListChecks` |
| fa-link | `Link` |
| fa-hand-holding-dollar | `HandCoins` |
| fa-brain | `Brain` |
| fa-paper-plane | `Send`（与 ➤ 复用同一个图标） |
| fa-download | `Download` |
| fa-wand-magic-sparkles | `Sparkles` |
| fa-briefcase | `Briefcase` |
| fa-circle-info | `Info` |
| fa-robot | `Bot`（与 🤖 复用） |
| fa-user | `User` |

规范：统一 `size={16}`（正文内联）/`size={20}`（标题级），`strokeWidth={2}`，不额外传自定义颜色，靠外层 `text-*` 类继承颜色。

## 3. 图表库：Recharts + shadcn chart

项目已经是 shadcn/ui 体系，shadcn 官方就有基于 **Recharts** 封装的 `chart` 组件（`npx shadcn add chart`），声明式 API 和 React 组件树天然契合，比 ECharts 需要额外套一层 `echarts-for-react` 命令式实例更顺手，故选 Recharts。

三个原型图表的替换方式：
- **环形图**（`.donut-chart`，原型用 conic-gradient 手画）→ Recharts `PieChart`（`innerRadius` 做成环形），配 shadcn chart 的 `ChartContainer`/`ChartTooltip`。
- **热力图**（`.heatmap-grid`）→ 不用图表库，本质是"网格 + 色阶映射函数"，用普通 CSS Grid + 一个 `getHeatColor(value)` 工具函数即可，比硬套图表库的坐标轴系统更简单可控。
- **漏斗图**（`.funnel-layer` clip-path）→ Recharts `FunnelChart`。

依赖：`bun add recharts` + `npx shadcn add chart`。

## 4. Mock 数据组织

```
src/mock/
  policies.ts       # 政策列表、政策详情、申报条件
  enterprises.ts     # 企业列表、企业详情、匹配结果
  dashboard.ts        # 首页 KPI、今日快讯、漏斗、环形图数据
  chat-presets.ts      # 各页面 AI 预设问答（对应原型里 enterprisePresetResponses 等）
  cultivation.ts        # 企业培育计划四阶段数据

src/types/
  policy.ts / enterprise.ts / dashboard.ts   # 对应的 TS interface，字段命名向未来真实接口看齐
```

原则：mock 文件只导出数据 + 类型，不导出任何 UI 相关逻辑；组件永远从 props/hook 拿数据，不直接 import mock，这样以后接后端只需把"数据来源"从 mock 换成 fetch，组件不用动。

## 5. 桌面专属策略

- 在 `__root.tsx` 的最外层容器加 `min-w-[1200px]`（对应原型 `body{min-width:1200px}`），整站不写 `sm:`/`md:`/`lg:` 响应式前缀，布局网格直接写死列数（如 `grid-cols-3`）。
- `<meta name="viewport">` 保持默认即可，不需要针对移动端做特殊处理。
- 这一条同时简化了第 4 类图表和表格组件的实现，不用考虑窄屏降级。

## 6. 依赖清单汇总

```bash
bun add lucide-react recharts
npx shadcn@latest add dialog tabs chart
```
（`dialog`/`tabs` 对应第一轮方案里提到的弹窗壳、分段选择器，也一并在这轮列出。）

## 7. 后续实施顺序

1. 改 `index.css`：写入品牌色/匹配度色/圆角/阴影 token。
2. 装依赖：lucide-react、recharts、shadcn dialog/tabs/chart。
3. 建 `src/mock/` + `src/types/`，把三个原型页面里的静态数据结构化搬进去。
4. 抽 P0 原子组件（Tag、SectionCard、KpiCard、ProgressBar、MatchLevelBadge），全部用 lucide 图标 + 新 token。
5. 抽 P1 复合组件（AI 聊天整套、Modal 壳、Breadcrumb、DataTable）。
6. 抽 P2 业务分子组件、图表组件。
7. 拼装三个页面路由。
