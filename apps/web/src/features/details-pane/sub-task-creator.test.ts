import { describe, expect, test } from "bun:test";

const subTaskCreatorSource = await Bun.file(
  new URL("./sub-task-creator.tsx", import.meta.url),
).text();

describe("sub-task creator form wiring", () => {
  test("keeps submitted draft fields in TanStack Form instead of local object state", () => {
    expect(subTaskCreatorSource).toContain(
      'import { useAppForm } from "@/components/form/ts-form"',
    );
    expect(subTaskCreatorSource).toContain("const form = useAppForm({");
    expect(subTaskCreatorSource).toContain('<form.Field name="title">');
    expect(subTaskCreatorSource).toContain('<form.Field name="description">');
    expect(subTaskCreatorSource).toContain('<form.Field name="priority">');
    expect(subTaskCreatorSource).toContain('<form.Field name="teamId">');
    expect(subTaskCreatorSource).toContain('<form.Field name="assignedUserId">');
    expect(subTaskCreatorSource).toContain('<form.Field name="labelIds">');
    expect(subTaskCreatorSource).not.toContain("const [state, setState]");
  });

  test("preserves special inline creator behaviors around paste, team labels, and submit reset", () => {
    expect(subTaskCreatorSource).toContain("onPaste={handleTitlePaste}");
    expect(subTaskCreatorSource).toContain(
      "form.state.values.labelIds.filter((id) => labelAppliesToTeam(id, next))",
    );
    expect(subTaskCreatorSource).toContain('form.setFieldValue("title", "")');
    expect(subTaskCreatorSource).toContain('form.setFieldValue("description", "")');
    expect(subTaskCreatorSource).toContain("titleRef.current?.focus()");
  });
});
