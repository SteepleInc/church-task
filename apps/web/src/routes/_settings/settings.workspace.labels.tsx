import { createFileRoute } from "@tanstack/react-router";

import { SettingsLabelsPanel } from "@/features/settings/label-settings";
import { SettingsPage } from "@/features/settings/settings-page";

export const Route = createFileRoute("/_settings/settings/workspace/labels")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SettingsPage contentClassName="mx-0 max-w-none">
      <SettingsLabelsPanel />
    </SettingsPage>
  );
}
