import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-topbar";

export const Route = createFileRoute("/_app")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <>
      <AppTopbar isAuthenticated={true} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </>
  );
}
