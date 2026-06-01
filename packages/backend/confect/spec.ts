import { Spec } from "@confect/core";

import { agent, auth, healthCheck, privateData, workDefaults } from "./app.spec";

export default Spec.make().add(agent).add(auth).add(healthCheck).add(privateData).add(workDefaults);
