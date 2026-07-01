import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

const ZERO_PROXY_PREFIX = "/zero";

type WorkerEnv = {
  readonly ZERO_CACHE_UPSTREAM?: string;
};

const applyWorkerEnv = (env: unknown) => {
  if (!env || typeof env !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      process.env[key] = value;
    }
  }
};

const getWorkerEnv = (env: unknown): WorkerEnv =>
  env && typeof env === "object" ? (env as WorkerEnv) : {};

const proxyZeroRequest = (request: Request, upstream: string) => {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(upstream);
  const zeroPath = incomingUrl.pathname.slice(ZERO_PROXY_PREFIX.length) || "/";

  upstreamUrl.pathname = `${upstreamUrl.pathname.replace(/\/$/, "")}${zeroPath}`;
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.set("host", upstreamUrl.host);

  return fetch(
    new Request(upstreamUrl, {
      body: request.body,
      duplex: "half",
      headers,
      method: request.method,
      redirect: "manual",
    } as RequestInit & { duplex: "half" }),
  );
};

export default createServerEntry({
  fetch(request: Request, env?: unknown) {
    const workerEnv = getWorkerEnv(env);
    applyWorkerEnv(env);

    const url = new URL(request.url);
    if (
      workerEnv.ZERO_CACHE_UPSTREAM &&
      (url.pathname === ZERO_PROXY_PREFIX || url.pathname.startsWith(`${ZERO_PROXY_PREFIX}/`))
    ) {
      return proxyZeroRequest(request, workerEnv.ZERO_CACHE_UPSTREAM);
    }

    return handler.fetch(request);
  },
});
