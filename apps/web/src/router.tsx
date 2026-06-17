import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export interface RouterAppContext {}

export function getRouter() {
  // No defaultPendingComponent and no route loaders: Render Gates are forbidden
  // (see docs/adr/0010-no-render-gates.md). Zero owns synced product reads.
  return createRouter({
    routeTree,
    scrollRestoration: true,
    context: {},
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
