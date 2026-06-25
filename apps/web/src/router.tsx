import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export interface RouterAppContext {
  readonly refetchSession: () => Promise<unknown>;
  readonly session: unknown;
  readonly sessionPending: boolean;
}

export function getRouter() {
  // No defaultPendingComponent and no route loaders: Render Gates are forbidden
  // (see docs/adr/0010-no-render-gates.md). Zero owns synced product reads.
  return createRouter({
    routeTree,
    scrollRestoration: true,
    // The marketing pages share one persistent inner scroll container
    // (MARKETING_SCROLL_ID in routes/_marketing/-marketing-shell.tsx). Reset it
    // to the top on forward navigation so a fresh page starts at the top, while
    // back/forward still restore the previous scroll position.
    scrollToTopSelectors: ['[data-scroll-restoration-id="marketing-scroll"]'],
    context: {
      refetchSession: (() => Promise.resolve({})) as () => Promise<unknown>,
      session: null,
      sessionPending: true,
    } satisfies RouterAppContext,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
