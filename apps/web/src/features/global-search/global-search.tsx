import { createHotkeyHandler } from "@tanstack/hotkeys";
import { useNavigate } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { Building2Icon, ListTodoIcon, SettingsIcon, UserIcon, UsersIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";
import { useTasksCollection } from "@/data/tasks/tasksData.app";
import { useTeamsCollection } from "@/data/teams/teamsData.app";
import { useChurchUsersCollection } from "@/data/users/usersData.app";
import { globalSearchIsOpenAtom } from "@/features/global-search/global-search-state";
import type { GlobalSearchResult } from "@/features/global-search/global-search-types";
import {
  filterGlobalSearchResults,
  GLOBAL_SEARCH_SHORTCUT,
  isEditableKeyboardTarget,
} from "@/features/global-search/global-search-utils";
import { disableQuickActionsAtom } from "@/features/quick-actions/quick-actions-state";

export function GlobalSearch() {
  const [globalSearchIsOpen, setGlobalSearchIsOpen] = useAtom(globalSearchIsOpenAtom);
  const setDisableQuickActions = useSetAtom(disableQuickActionsAtom);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();
  const { currentOrgOpt: activeChurch } = useCurrentOrgOpt();
  const teams = useTeamsCollection({ churchId: activeChurch?.id ?? null });
  const users = useChurchUsersCollection({ churchId: activeChurch?.id ?? null });
  const tasks = useTasksCollection({
    churchId: activeChurch?.id ?? null,
    currentUserId: activeChurch?.currentUserId ?? null,
  });

  useEffect(() => {
    const handler = createHotkeyHandler(
      GLOBAL_SEARCH_SHORTCUT,
      (event) => {
        if (event.repeat || isEditableKeyboardTarget(event.target)) return;
        setGlobalSearchIsOpen((isOpen) => !isOpen);
      },
      { preventDefault: true },
    );

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setGlobalSearchIsOpen]);

  useEffect(() => {
    setDisableQuickActions(globalSearchIsOpen);
  }, [globalSearchIsOpen, setDisableQuickActions]);

  useEffect(() => {
    if (!globalSearchIsOpen) setSearchValue("");
  }, [globalSearchIsOpen]);

  const selectAndClose = (action: () => void) => () => {
    setGlobalSearchIsOpen(false);
    action();
  };

  const results = useMemo<readonly GlobalSearchResult[]>(() => {
    const routeResults: GlobalSearchResult[] = [
      {
        id: "route:my-work",
        type: "route",
        title: "My Work",
        description: "Tasks assigned to you.",
        keywords: ["tasks", "assigned", "todo"],
        icon: ListTodoIcon,
        onSelect: selectAndClose(() => void navigate({ to: "/my-work" })),
      },
      {
        id: "route:our-work",
        type: "route",
        title: "Our Work",
        description: "Church-wide tasks and shared work.",
        keywords: ["tasks", "church", "shared"],
        icon: UsersIcon,
        onSelect: selectAndClose(() => void navigate({ to: "/our-work" })),
      },
      {
        id: "route:settings",
        type: "route",
        title: "Settings",
        description: "Profile, Church, Team, and invitation settings.",
        keywords: ["profile", "church", "team", "members", "invitations"],
        icon: SettingsIcon,
        onSelect: selectAndClose(() => void navigate({ to: "/settings" })),
      },
    ];

    const churchResult: GlobalSearchResult[] = activeChurch
      ? [
          {
            id: `church:${activeChurch.id}`,
            type: "church",
            title: activeChurch.name,
            description: "Active Church profile and settings.",
            keywords: ["church", "org", activeChurch.slug ?? ""],
            icon: Building2Icon,
            onSelect: selectAndClose(() => void navigate({ to: "/settings/org" })),
          },
        ]
      : [];

    const teamResults = teams.teamsCollection.map((team) => ({
      id: `team:${team.id}`,
      type: "team" as const,
      title: team.name,
      description: "Team work queue.",
      keywords: ["team", "work"],
      icon: UsersIcon,
      onSelect: selectAndClose(
        () => void navigate({ params: { teamId: team.id }, to: "/team/$teamId" }),
      ),
    }));

    const memberResults = users.usersCollection.map((user) => ({
      id: `member:${user.id}`,
      type: "member" as const,
      title: user.name || user.email || "Church member",
      description: user.email ? `${user.email} - ${user.role}` : `Church member - ${user.role}`,
      keywords: ["member", "user", "person", user.email ?? "", user.role],
      icon: UserIcon,
      onSelect: selectAndClose(
        () => void navigate({ params: { teamTab: "members" }, to: "/settings/team/$teamTab" }),
      ),
    }));

    const taskResults = tasks.tasksCollection.map((task) => ({
      id: `task:${task.id}`,
      type: "task" as const,
      title: task.title,
      description: `Church task - ${task.taskState}`,
      keywords: ["task", "work", task.taskState, task.teamId ?? ""],
      icon: ListTodoIcon,
      onSelect: selectAndClose(() => void navigate({ to: "/our-work" })),
    }));

    return [...routeResults, ...churchResult, ...teamResults, ...memberResults, ...taskResults];
  }, [
    activeChurch,
    navigate,
    setGlobalSearchIsOpen,
    tasks.tasksCollection,
    teams.teamsCollection,
    users.usersCollection,
  ]);

  const filteredResults = filterGlobalSearchResults(results, searchValue);

  return (
    <CommandDialog
      description="A menu that lets you search Church Task entities and routes."
      onOpenChange={setGlobalSearchIsOpen}
      open={globalSearchIsOpen}
      title="Global Search"
    >
      <CommandInput
        onValueChange={setSearchValue}
        placeholder="Search Tasks, Teams, members, and pages..."
        value={searchValue}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Global Search">
          {filteredResults.map((result) => (
            <GlobalSearchCommandItem key={result.id} result={result} />
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function GlobalSearchCommandItem({ result }: { readonly result: GlobalSearchResult }) {
  const Icon = result.icon;

  return (
    <CommandItem
      className="items-start gap-3"
      keywords={[...result.keywords]}
      onSelect={result.onSelect}
      value={`${result.type} ${result.title} ${result.description}`}
    >
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <span className="grid gap-0.5">
        <span>{result.title}</span>
        <span className="text-xs text-muted-foreground">{result.description}</span>
      </span>
      <CommandShortcut className="capitalize">{result.type}</CommandShortcut>
    </CommandItem>
  );
}
