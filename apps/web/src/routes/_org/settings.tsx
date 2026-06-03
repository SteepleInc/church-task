import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_org/settings")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/settings") {
      throw redirect({ replace: true, to: "/settings/profile" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
