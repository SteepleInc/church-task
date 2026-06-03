import { useNavigate } from "@tanstack/react-router";
import { atom, useAtom } from "jotai";
import { ClipboardPlusIcon, ListTodoIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  getExecutionWorkflowId,
  getTaskCreationDefaults,
  selectCurrentExecutionCycle,
} from "@/components/tasks/task-execution-surface";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCyclesCollection } from "@/data/cycles/cyclesData.app";
import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";
import { useCreateTaskMutation } from "@/data/tasks/tasksData.app";
import {
  useWorkflowStatusesCollection,
  useWorkflowsCollection,
} from "@/data/workflows/workflowsData.app";

export type CreateTaskBigActionState = { readonly type: "my" } | { readonly type: "church" } | null;

export const createTaskBigActionStateAtom = atom<CreateTaskBigActionState>(null);

export function BigActions() {
  return <CreateTaskBigAction />;
}

function CreateTaskBigAction() {
  const [state, setState] = useAtom(createTaskBigActionStateAtom);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { currentOrgOpt: activeChurch } = useCurrentOrgOpt();
  const createTask = useCreateTaskMutation();

  const churchId = activeChurch?.id ?? null;
  const currentUserId = activeChurch?.currentUserId ?? null;
  const cyclesCollection = useCyclesCollection({ churchId, currentUserId });
  const workflows = useWorkflowsCollection({ churchId });
  const workflowStatusesCollection = useWorkflowStatusesCollection({ churchId });
  const today = new Date().toISOString().slice(0, 10);
  const currentCycle = selectCurrentExecutionCycle(cyclesCollection.cyclesCollection, today);
  const churchDefaultWorkflow = workflows.workflowsCollection.find(
    (workflow) => workflow.isDefault,
  );
  const workflowId = getExecutionWorkflowId({
    surface: state?.type === "my" ? "my_work" : "our_work",
    churchDefaultWorkflowId: churchDefaultWorkflow?.id,
    teamDefaultWorkflowId: null,
  });
  const creationStatus =
    workflowStatusesCollection.workflowStatusesCollection.find(
      (status) => status.workflowId === workflowId && status.taskState === "todo",
    ) ??
    workflowStatusesCollection.workflowStatusesCollection.find(
      (status) => status.taskState === "todo",
    ) ??
    workflowStatusesCollection.workflowStatusesCollection[0];
  const isOpen = state !== null;
  const isLoading =
    cyclesCollection.loading ||
    workflows.loading ||
    workflowStatusesCollection.loading ||
    !activeChurch;
  const Icon = state?.type === "my" ? ClipboardPlusIcon : ListTodoIcon;
  const dialogTitle = state?.type === "my" ? "Create My Task" : "Create Church Task";

  const close = () => {
    setState(null);
    setTitle("");
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeChurch || !currentUserId || !churchId || !state) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Enter a Task title.");
      return;
    }

    if (!creationStatus) {
      setError("Church Task could not find a To Do Workflow Status.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const defaults = getTaskCreationDefaults({
      surface: state.type === "my" ? "my_work" : "our_work",
      currentUserId,
      teamId: null,
    });
    const result = await createTask({
      churchId,
      actorUserId: currentUserId,
      title: trimmedTitle,
      teamId: defaults.teamId,
      assignedUserId: defaults.assignedUserId,
      workflowStatusId: creationStatus.id,
      dueDate: currentCycle?.endDate ?? today,
      parentTaskId: null,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    const destination = state.type === "my" ? "/my-work" : "/our-work";
    await navigate({ to: destination });
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="p-0">
          <DialogTitle className="inline-flex items-center">
            <Icon className="mr-2 size-4" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {state?.type === "my"
              ? "Create a Task assigned directly to you for the active Cycle."
              : "Create a Church-wide Task for the active Cycle."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input
            aria-label="Task Title"
            autoFocus
            disabled={isLoading || isSubmitting}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              state?.type === "my" ? "Add a Task assigned to me" : "Add Church-wide Task"
            }
            value={title}
          />
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button disabled={isSubmitting} onClick={close} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={!title.trim() || isLoading} loading={isSubmitting} type="submit">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
