import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-medium">Welcome</h1>
      <p className="text-sm text-muted-foreground">
        This is the home page of the Pszx AI Policy application.
      </p>
    </div>
  )
}