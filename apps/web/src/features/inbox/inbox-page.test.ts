import { describe, expect, test } from "bun:test";

import { getBreadcrumbLabel, getPrimaryAppShellNavItems } from "@/components/app-shell-utils";

describe("Inbox navigation plumbing", () => {
  test("registers Inbox as a first-class app shell surface", async () => {
    const navSource = await Bun.file(
      new URL("../../components/navigation/app-navigation.tsx", import.meta.url),
    ).text();
    const routeTreeSource = await Bun.file(
      new URL("../../routeTree.gen.ts", import.meta.url),
    ).text();

    expect(getPrimaryAppShellNavItems()[0]).toEqual({
      label: "Inbox",
      matchPath: "/inbox",
      to: "/inbox",
    });
    expect(getBreadcrumbLabel("/inbox")).toBe("Inbox");
    expect(navSource).toContain("<InboxSidebarItem />");
    expect(routeTreeSource).toContain("/_org/inbox");
  });

  test("wires the sidebar badge to unread active-Church notifications", async () => {
    const sidebarSource = await Bun.file(
      new URL("../../components/navigation/inbox-sidebar-item.tsx", import.meta.url),
    ).text();
    const dataSource = await Bun.file(
      new URL("../../data/notifications/notificationsData.app.ts", import.meta.url),
    ).text();

    expect(sidebarSource).toContain("useCurrentOrgOpt");
    expect(sidebarSource).toContain("useNotificationsCollection");
    expect(sidebarSource).toContain("badge={unreadCount > 0 ? unreadCount : null}");
    expect(dataSource).toContain("queries.notifications.by_recipient");
    expect(dataSource).toContain("notification.read_at == null");
  });

  test("keeps G then I global and guarded from editable targets", async () => {
    const appShellSource = await Bun.file(
      new URL("../../components/app-shell.tsx", import.meta.url),
    ).text();
    const shortcutSource = await Bun.file(
      new URL("../../lib/keyboard-shortcuts.ts", import.meta.url),
    ).text();

    expect(appShellSource).toContain('createSequenceMatcher(["G", "I"]');
    expect(appShellSource).toContain('navigate({ to: "/inbox" })');
    expect(appShellSource).toContain("isEditableShortcutTarget(event.target)");
    expect(shortcutSource).toContain("target.isContentEditable");
    expect(shortcutSource).toContain('tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"');
  });
});
