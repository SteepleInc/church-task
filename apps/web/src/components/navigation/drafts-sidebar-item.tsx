import { FileTextIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { SideBarItem } from "@/components/navigation/sidebar-item";
import { useMyDraftsCollection } from "@/data/drafts/draftsData.app";

// Keep the JS unmount timeout in lockstep with the CSS exit transition so the
// row is removed from the tree the instant it finishes fading/collapsing.
const APPEAR_TRANSITION_MS = 200;

export function DraftsSidebarItem() {
  const { collection } = useMyDraftsCollection();
  const draftCount = collection.length;
  const [isMounted, setIsMounted] = useState(draftCount > 0);
  const [isVisible, setIsVisible] = useState(draftCount > 0);
  // Hold the last nonzero count so the number does not blank out mid-collapse
  // as the Drafts row fades away.
  const [displayCount, setDisplayCount] = useState(draftCount);

  useEffect(() => {
    if (draftCount > 0) {
      setDisplayCount(draftCount);
      setIsMounted(true);
      const frameId = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => setIsMounted(false), APPEAR_TRANSITION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [draftCount]);

  if (!isMounted) return null;

  return (
    <SideBarItem
      badge={displayCount}
      // The row collapses its own height (and the menu's gap) on the way out so
      // sibling items glide up to fill the space instead of jumping; overflow
      // is clipped only during the transition so the focus ring never clips
      // while the row is at rest.
      className="motion-safe:transition-[opacity,transform,max-height,margin] motion-safe:duration-200 motion-safe:ease-out data-[state=closed]:pointer-events-none data-[state=closed]:-mt-px data-[state=closed]:max-h-0 data-[state=closed]:-translate-y-0.5 data-[state=closed]:overflow-hidden data-[state=closed]:opacity-0 data-[state=open]:mt-0 data-[state=open]:max-h-8 data-[state=open]:translate-y-0 data-[state=open]:opacity-100"
      icon={<FileTextIcon className="size-4" />}
      state={isVisible ? "open" : "closed"}
      title="Drafts"
      to="/drafts"
    />
  );
}
