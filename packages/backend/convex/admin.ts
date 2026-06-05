import { authComponent } from "../authCore";
import { assertAppAdministratorUser } from "../adminAccess";
import { query } from "./_generated/server";

export const assertAppAdministrator = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    assertAppAdministratorUser(authUser);

    return { ok: true };
  },
});
