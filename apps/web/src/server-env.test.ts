import { describe, expect, test } from "bun:test";

const packageJson = (await Bun.file(new URL("../package.json", import.meta.url)).json()) as {
  readonly scripts?: Record<string, string>;
};
const apiRouteSource = await Bun.file(new URL("./routes/api/$.tsx", import.meta.url)).text();
const authRouteSource = await Bun.file(new URL("./routes/api/auth/$.tsx", import.meta.url)).text();
const rootRouteSource = await Bun.file(new URL("./routes/__root.tsx", import.meta.url)).text();
const serverSource = await Bun.file(new URL("./server.ts", import.meta.url)).text();
const zeroRuntimeProviderSource = await Bun.file(
  new URL("./lib/zero-runtime-provider.tsx", import.meta.url),
).text();
const routerSource = await Bun.file(new URL("./router.tsx", import.meta.url)).text();
const viteConfigSource = await Bun.file(new URL("../vite.config.ts", import.meta.url)).text();

describe("web dev server environment", () => {
  test("loads the repo root local env file before starting Vite", () => {
    expect(packageJson.scripts?.dev).toBe("bun --env-file=../../.env.local vite dev");
  });

  test("mounts Better Auth as a TanStack Start API route", () => {
    expect(viteConfigSource).toContain("tanstackStart");
    expect(routerSource).toContain("export function getRouter()");
    expect(authRouteSource).toContain('createFileRoute("/api/auth/$")');
    expect(authRouteSource).toContain("server:");
    expect(authRouteSource).toContain("authRuntime.auth.handler(request)");
    expect(authRouteSource).toContain("DATABASE_URL is required to handle auth requests.");
  });

  test("mounts the backend API gateway as a TanStack Start API route", () => {
    expect(apiRouteSource).toContain('createFileRoute("/api/$")');
    expect(apiRouteSource).toContain("createTracerApi");
    expect(apiRouteSource).toContain("tracerApi.fetch(request)");
    expect(apiRouteSource).toContain("DATABASE_URL is required to handle API requests.");
  });

  test("keeps the web server entry delegated to TanStack Start", () => {
    expect(serverSource).toContain("createServerEntry");
    expect(serverSource).toContain("handler.fetch(request)");
    expect(serverSource).not.toContain("@church-task/server");
    expect(serverSource).not.toContain("createTracerApi");
  });

  test("renders a TanStack Start document shell", () => {
    expect(rootRouteSource).toContain("<html");
    expect(rootRouteSource).toContain("<head>");
    expect(rootRouteSource).toContain("<body>");
    expect(rootRouteSource).toContain("<Scripts />");
  });

  test("does not fetch active organization before mounting Zero", () => {
    expect(zeroRuntimeProviderSource).toContain("authClient.useSession()");
    expect(zeroRuntimeProviderSource).not.toContain("useActiveOrganization");
  });
});
