import { Link, Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <Link to="/" className="text-sm font-medium">
            Pszx AI Policy
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  )
}