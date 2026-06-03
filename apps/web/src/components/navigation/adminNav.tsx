import { adminNavItems } from "@/components/navigation/nav-shared";
import { SideBarItem } from "@/components/navigation/sidebar-item";
import { canAccessInternalNavigation } from "@/components/navigation/internal-navigation";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";

export function AdminNav() {
  const { currentOrgOpt: activeChurch } = useCurrentOrgOpt();

  if (!canAccessInternalNavigation(activeChurch?.role)) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="gap-2">Admin</SidebarGroupLabel>
      <SidebarMenu>
        {adminNavItems.map((item) => (
          <SideBarItem key={item.to} {...item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
