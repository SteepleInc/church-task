import { serverEnv } from "@church-task/env/server";
import { createTracerApi } from "@church-task/server";

export const tracerApi = createTracerApi(serverEnv.DATABASE_URL);

export const handleApiRequest = (request: Request) => {
  return tracerApi.fetch(request);
};
