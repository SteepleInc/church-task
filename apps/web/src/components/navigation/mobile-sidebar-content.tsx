import type { FC, ReactNode } from "react";

import { OrgSwitcher } from "@/components/org-switcher";
import { SidebarGroup, SidebarGroupContent, SidebarHeader } from "@/components/ui/sidebar";
import { GlobalSearchToggle } from "@/features/global-search/global-search-toggle";
import { QuickActionsToggle } from "@/features/quick-actions/quick-actions-toggle";

type MobileSidebarContentProps = {
  readonly appContent: ReactNode;
};

export const MobileSidebarContent: FC<MobileSidebarContentProps> = (props) => {
  const { appContent } = props;

  return (
    <>
      <SidebarHeader className="mx-2 pb-0">
        <OrgSwitcher />

        <SidebarGroup className="p-0">
          <SidebarGroupContent className="relative flex flex-row gap-2">
            <QuickActionsToggle />
            <GlobalSearchToggle />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      {appContent}
    </>
  );
};
