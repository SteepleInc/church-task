import "./telemetry";

import { env } from "@church-task/env/web";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import ReactDOM from "react-dom/client";

import { routeTree } from "./routeTree.gen";
const convex = new ConvexReactClient(env.VITE_CONVEX_URL);

// No defaultPendingComponent and no route loaders: Render Gates are forbidden
// (see docs/adr/0010-no-render-gates.md). The query cache keeps subscriptions
// alive after unmount so revisited surfaces render synchronously from cache.
const router = createRouter({
  routeTree,
  scrollRestoration: true,
  context: {},
  Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
    return (
      <ConvexProvider client={convex}>
        <ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
      </ConvexProvider>
    );
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
