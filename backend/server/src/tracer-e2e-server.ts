import { startTracerHttpServer } from "./tracer-http-server";

const port = Number(process.env.E2E_TRACER_PORT ?? 2102);
console.info("Starting tracer E2E Postgres harness");
const server = await startTracerHttpServer(port);
console.info(`Tracer E2E server listening on http://127.0.0.1:${port}`);

const shutdown = async () => {
  await server.stop();
};

process.once("SIGTERM", () => {
  void shutdown().then(() => process.exit(0));
});
process.once("SIGINT", () => {
  void shutdown().then(() => process.exit(0));
});
