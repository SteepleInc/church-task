import { FileTextIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { SideBarItem } from "@/components/navigation/sidebar-item";
import { useMyDraftsCollection } from "@/data/drafts/draftsData.app";

export function DraftsSidebarItem() {
  const { collection } = useMyDraftsCollection();
  const draftCount = collection.length;
  const [isMounted, setIsMounted] = useState(draftCount > 0);
  const [isVisible, setIsVisible] = useState(draftCount > 0);
  const [displayCount, setDisplayCount] = useState(draftCount);

  useEffect(() => {
    if (draftCount > 0) {
      setDisplayCount(draftCount);
      setIsMounted(true);
      const frameId = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => setIsMounted(false), 180);
    return () => window.clearTimeout(timeoutId);
  }, [draftCount]);

  if (!isMounted) return null;

  return (
    <SideBarItem
      badge={displayCount}
      className="motion-safe:transition-[opacity,transform,max-height] motion-safe:duration-180 motion-safe:ease-out data-[state=closed]:max-h-0 data-[state=closed]:-translate-y-1 data-[state=closed]:opacity-0 data-[state=open]:max-h-7 data-[state=open]:translate-y-0 data-[state=open]:opacity-100"
      icon={<FileTextIcon className="size-4" />}
      state={isVisible ? "open" : "closed"}
      title="Drafts"
      to="/drafts"
    />
  );
}
