import { createServer } from "node:http";

import { startPostgresHarness, startZeroCacheHarness } from "@church-task/test-harness";

import { createTracerApi } from "./tracer-api";

export const startTracerHttpServer = async (
  port: number,
  options: { readonly startZeroCache?: boolean } = {},
) => {
  const harness = await startPostgresHarness();
  const api = createTracerApi(harness.connectionString);
  let zeroCache: Awaited<ReturnType<typeof startZeroCacheHarness>> | null = null;

  const server = createServer(async (incoming, outgoing) => {
    const chunks: Array<Buffer> = [];
    for await (const chunk of incoming) {
      chunks.push(Buffer.from(chunk));
    }

    const request = new Request(`http://127.0.0.1:${port}${incoming.url ?? "/"}`, {
      body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
      headers: incoming.headers as ConstructorParameters<typeof Headers>[0],
      method: incoming.method,
    });
    const response = await api.fetch(request);

    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  });

  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", () => resolve()));

  if (options.startZeroCache) {
    try {
      zeroCache = await startZeroCacheHarness({
        apiBaseUrl: `http://127.0.0.1:${port}`,
        databaseUrl: harness.connectionString,
      });
    } catch (error) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await api.close();
      await harness.stop();
      throw error;
    }
  }

  return {
    zeroCacheUrl: zeroCache?.url ?? null,
    async stop() {
      await zeroCache?.stop();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await api.close();
      await harness.stop();
    },
  };
};
