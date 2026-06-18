import { revalidateLogic } from "@tanstack/react-form";
import { Schema } from "effect";
import { atom, useAtom } from "jotai";
import { CalendarRange, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/ts-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { formatWeekDateRange, useUpdateWeekDetailsMutation } from "@/data/cycles/cyclesData.app";
import {
  QuickActionForm,
  QuickActionsDescription,
  QuickActionsHeader,
  QuickActionsTitle,
  QuickActionsWrapper,
} from "@/features/quick-actions/quick-actions-components";

// The Week being edited is carried in full so the form opens instantly without
// a round trip — the actions menu already holds the Week's record.
export type EditWeekQuickActionState = {
  readonly churchId: string;
  readonly cycleId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly name: string | null;
  readonly description: string | null;
};

export const editWeekQuickActionStateAtom = atom<EditWeekQuickActionState | null>(null);

const NAME_MAX_LENGTH = 80;

const EditWeekSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.check(Schema.isMaxLength(NAME_MAX_LENGTH, { message: "Name is too long." })),
  ),
  description: Schema.String,
});

export function EditWeekQuickAction() {
  const [editWeekState, setEditWeekState] = useAtom(editWeekQuickActionStateAtom);
  const isOpen = editWeekState !== null;
  const dateRange = editWeekState ? formatWeekDateRange(editWeekState) : "";

  return (
    <QuickActionsWrapper open={isOpen} onOpenChange={(open) => !open && setEditWeekState(null)}>
      <QuickActionsHeader className="p-4">
        <QuickActionsTitle>
          <span className="inline-flex flex-row items-center">
            <CalendarRange className="mr-2 size-4" />
            Edit week
          </span>
        </QuickActionsTitle>
        <QuickActionsDescription>
          {dateRange
            ? `Name and describe the week of ${dateRange}.`
            : "Name and describe this week."}
        </QuickActionsDescription>
      </QuickActionsHeader>
      {editWeekState ? (
        <EditWeekForm
          key={editWeekState.cycleId}
          week={editWeekState}
          onUpdated={(name) => {
            setEditWeekState(null);
            toast.success(name ? `“${name}” saved.` : "Week updated.");
          }}
        />
      ) : null}
    </QuickActionsWrapper>
  );
}

function EditWeekForm({
  week,
  onUpdated,
}: {
  readonly week: EditWeekQuickActionState;
  readonly onUpdated: (name: string | null) => void;
}) {
  const updateWeekDetails = useUpdateWeekDetailsMutation();
  const [editError, setEditError] = useState<string | null>(null);
  const dateRange = formatWeekDateRange(week);

  const form = useAppForm({
    defaultValues: {
      name: week.name ?? "",
      description: week.description ?? "",
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "blur",
    }),
    validators: {
      onSubmit: Schema.toStandardSchemaV1(EditWeekSchema),
    },
    onSubmit: async ({ value }) => {
      setEditError(null);
      const trimmedName = value.name.trim();
      const trimmedDescription = value.description.trim();

      const result = await updateWeekDetails({
        churchId: week.churchId,
        cycleId: week.cycleId,
        description: trimmedDescription || null,
        name: trimmedName || null,
      });

      if (result.ok) {
        onUpdated(trimmedName || null);
        return;
      }

      setEditError(result.error.message);
    },
  });

  return (
    <QuickActionForm
      form={form}
      Primary={
        <>
          {/* Locked dates: a Week's identity is its Monday–Sunday span, and that
              span never moves — make that immutability obvious. */}
          <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-xs">
              <Lock className="size-3.5" />
            </span>
            <div className="grid gap-0.5">
              <span className="text-sm font-medium leading-none">{dateRange}</span>
              <span className="text-xs text-muted-foreground">
                Monday–Sunday · dates can't be changed
              </span>
            </div>
          </div>

          <form.AppField name="name">
            {(field) => (
              <field.InputField
                autoFocus
                label="Name"
                maxLength={NAME_MAX_LENGTH}
                placeholder={dateRange}
              />
            )}
          </form.AppField>
          <form.AppField name="description">
            {(field) => (
              <field.TextareaField
                className="min-h-20 resize-none"
                label="Description"
                placeholder="Add planning context for this week…"
              />
            )}
          </form.AppField>

          {editError ? (
            <Alert variant="destructive">
              <AlertDescription>{editError}</AlertDescription>
            </Alert>
          ) : null}
        </>
      }
      Actions={
        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button className="ml-auto" disabled={!canSubmit} loading={isSubmitting} type="submit">
              Save week
              <Kbd>enter</Kbd>
            </Button>
          )}
        </form.Subscribe>
      }
    />
  );
}
