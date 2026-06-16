import { createFileRoute } from "@tanstack/react-router";

import { SettingsMembersPanel } from "@/features/settings/member-settings";
import { SettingsPage } from "@/features/settings/settings-page";

export const Route = createFileRoute("/_settings/settings/workspace/members")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SettingsPage contentClassName="mx-0 max-w-none">
      <SettingsMembersPanel />
    </SettingsPage>
  );
}
