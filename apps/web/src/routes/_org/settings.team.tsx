import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { MainContainer, PageContainer } from "@/components/pageComponents";
import { TeamTabs } from "@/features/users/team-tabs";

export const Route = createFileRoute("/_org/settings/team")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/settings/team") {
      throw redirect({
        params: { teamTab: "members" },
        replace: true,
        to: "/settings/team/$teamTab",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <MainContainer>
      <PageContainer>
        <div className="flex flex-col gap-1 pb-4">
          <h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage Church members, Teams, and invitations.
          </p>
        </div>
        <TeamTabs basePath="/settings/team" className="px-0" />
        <Outlet />
      </PageContainer>
    </MainContainer>
  );
}
