import { Outlet, createRootRoute, useRouter } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const router = useRouter()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/40">
      <DashboardHeader />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
        <DashboardSidebar />
      </div>
      <TanStackRouterDevtools router={router as any} />
    </div>
  )
}
