import { describe, expect, test } from "bun:test";

import { SignInState, signInStateAtom } from "./sign-in-state";

describe("sign-in state", () => {
  test("starts from the email prompt", () => {
    expect(signInStateAtom.init).toEqual(SignInState.email());
  });
});
