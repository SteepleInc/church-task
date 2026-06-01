import { Impl } from "@confect/server";
import { Layer } from "effect";

import api from "./_generated/api";
import { activities, agent, auth, healthCheck, privateData, workDefaults } from "./app.impl";

export default Impl.make(api).pipe(
  Layer.provide(activities),
  Layer.provide(agent),
  Layer.provide(auth),
  Layer.provide(healthCheck),
  Layer.provide(privateData),
  Layer.provide(workDefaults),
  Impl.finalize,
);
