import { Spec } from "@confect/core";

import { activities, agent, auth, healthCheck, privateData, workDefaults } from "./app.spec";

export default Spec.make()
  .add(activities)
  .add(agent)
  .add(auth)
  .add(healthCheck)
  .add(privateData)
  .add(workDefaults);
