# AGENTS.md

## 交流语言
- 与 AI 代理交流时使用**中文**

## 包管理器
- 使用 **Bun** 作为包管理器，不要用 npm/pnpm/yarn
- 安装依赖：`bun add <package>`，开发依赖：`bun add -d <package>`

## 构建顺序（重要）
- 构建命令：`bun run build` → `tsr generate && tsc -b && vite build`
- **必须先 `tsr generate` 生成路由树，再 `tsc -b` 进行类型检查**，否则 `src/routeTree.gen.ts` 不存在会导致类型错误

## 开发命令
| 命令 | 用途 |
|------|------|
| `bun run dev` | 启动 Vite 开发服务器 |
| `bun run build` | 生成路由树 → 类型检查 → 构建生产包 |
| `bun run lint` | ESLint 检查 |
| `bun run format` | Prettier 格式化 |
| `bun run typecheck` | 仅类型检查（`tsc --noEmit`） |

## TanStack Router 文件式路由
- 路由文件放在 `src/routes/` 目录下
- `src/routeTree.gen.ts` 是**自动生成**的文件，**禁止手动编辑**，已从 prettier 和 eslint 中排除
- 根布局：`src/routes/__root.tsx`（使用 `createRootRoute` + `<Outlet />`）
- 页面路由：`src/routes/index.tsx`（使用 `createFileRoute("/")`）
- 新建路由：在 `src/routes/` 下创建新文件，例如 `about.tsx` → 路由 `/about`
- 路由实例在 `src/router.tsx` 中创建，并通过 `declare module '@tanstack/react-router'` 注册类型


## Tailwind CSS v4（CSS-first 配置）
- **没有** `tailwind.config.js`，所有配置在 `src/index.css` 中
- 使用 `@import "tailwindcss"` 和 `@theme inline { ... }` 语法
- CSS 变量定义主题色（`--background`、`--foreground` 等），支持亮/暗模式
- 暗色模式通过 `.dark` 类切换，由 `ThemeProvider` 管理

## shadcn/ui 组件
- 添加组件：`npx shadcn@latest add <组件名>`
- 组件放置在 `src/components/ui/` 下
- `@/` 路径别名指向 `src/`
- 使用 `cn()` 工具函数（来自 `@/lib/utils`）合并 className

## 原型参考
- `prototype/` 目录包含 HTML 原型页面（企业卡片、首页、政策卡片），可作为 UI 参考
