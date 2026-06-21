import { describe, expect, test } from "bun:test";

import { canModerateTaskComment, isChurchModerator } from "./taskCommentModeration-utils";

const author = "user-author";
const other = "user-other";

describe("canModerateTaskComment", () => {
  test("lets the author moderate their own comment", () => {
    expect(
      canModerateTaskComment({
        viewer: { currentUserId: author, churchRole: "member", isAppAdmin: false },
        authoredByUserId: author,
      }),
    ).toBe(true);
  });

  test("denies a plain member moderating someone else's comment", () => {
    expect(
      canModerateTaskComment({
        viewer: { currentUserId: other, churchRole: "member", isAppAdmin: false },
        authoredByUserId: author,
      }),
    ).toBe(false);
  });

  test("lets Church owners and admins moderate others' comments", () => {
    expect(
      canModerateTaskComment({
        viewer: { currentUserId: other, churchRole: "owner", isAppAdmin: false },
        authoredByUserId: author,
      }),
    ).toBe(true);
    expect(
      canModerateTaskComment({
        viewer: { currentUserId: other, churchRole: "admin", isAppAdmin: false },
        authoredByUserId: author,
      }),
    ).toBe(true);
  });

  test("lets app admins moderate others' comments", () => {
    expect(
      canModerateTaskComment({
        viewer: { currentUserId: other, churchRole: "member", isAppAdmin: true },
        authoredByUserId: author,
      }),
    ).toBe(true);
  });

  test("denies a signed-out viewer", () => {
    expect(
      canModerateTaskComment({
        viewer: { currentUserId: null, churchRole: null, isAppAdmin: false },
        authoredByUserId: author,
      }),
    ).toBe(false);
  });
});

describe("isChurchModerator", () => {
  test("is true for owners, admins, and app admins only", () => {
    expect(
      isChurchModerator({ currentUserId: other, churchRole: "owner", isAppAdmin: false }),
    ).toBe(true);
    expect(
      isChurchModerator({ currentUserId: other, churchRole: "admin", isAppAdmin: false }),
    ).toBe(true);
    expect(
      isChurchModerator({ currentUserId: other, churchRole: "member", isAppAdmin: true }),
    ).toBe(true);
    expect(
      isChurchModerator({ currentUserId: other, churchRole: "member", isAppAdmin: false }),
    ).toBe(false);
  });
});
