import { serverEnv } from "@church-work/env/server";
import { createTracerApi } from "@church-work/server";

export const tracerApi = createTracerApi(serverEnv.DATABASE_URL);

export const handleApiRequest = (request: Request) => {
  return tracerApi.fetch(request);
};
