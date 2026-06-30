import { createFileRoute } from "@tanstack/react-router";
import { FileTextIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { MainContainer, PageContainer } from "@/components/pageComponents";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useDiscardAllDraftsMutation,
  useDiscardDraftMutation,
  useMyDraftsCollection,
  useRestoreDraftsMutation,
  useTaskDraft,
} from "@/data/drafts/draftsData.app";
import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";
import { DraftCard } from "@/features/drafts/draft-card";

export const Route = createFileRoute("/_org/drafts")({ component: DraftsPage });

function DraftsPage() {
  const { currentOrgOpt } = useCurrentOrgOpt();
  const churchId = currentOrgOpt?.id ?? null;

  const { collection, loading } = useMyDraftsCollection();
  const discardDraft = useDiscardDraftMutation();
  const discardAll = useDiscardAllDraftsMutation();
  const restoreDrafts = useRestoreDraftsMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const count = collection.length;

  async function onDiscardOne(draftId: string) {
    await discardDraft(draftId);
    toast.success("Draft discarded.", {
      action: { label: "Undo", onClick: () => void restoreDrafts([draftId]) },
    });
  }

  async function onDiscardAll() {
    const ids = collection.map((draft) => draft.id);
    await discardAll();
    setConfirmOpen(false);
    toast.success(ids.length === 1 ? "Draft discarded." : `${ids.length} drafts discarded.`, {
      action: { label: "Undo", onClick: () => void restoreDrafts(ids) },
    });
  }

  return (
    <MainContainer>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-0 pb-3 md:pt-1">
        <div className="flex items-center gap-2.5">
          <h1 className="font-semibold text-2xl tracking-tight">Drafts</h1>
          {!loading && count > 0 ? (
            <Badge className="tabular-nums" variant="secondary">
              {count}
            </Badge>
          ) : null}
        </div>
        {!loading && count > 0 ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Discard all drafts"
                  onClick={() => setConfirmOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2Icon />
                  Discard all
                </Button>
              }
            />
            <TooltipContent>Discard every draft</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <PageContainer className="flex-1" wrapperClassName="pt-0">
        {loading ? (
          <DraftsSkeleton />
        ) : count === 0 ? (
          <Empty className="min-h-72 rounded-xl border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>No active drafts</EmptyTitle>
              <EmptyDescription>
                Save a Task from the composer to keep it as a draft. Your saved drafts will land
                here, ready to finish whenever you are.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="mx-auto grid w-full max-w-3xl gap-3">
            {collection.map((draft) => (
              <DraftCardLoader
                churchId={churchId}
                draftId={draft.id}
                key={draft.id}
                onDiscard={onDiscardOne}
              />
            ))}
          </div>
        )}
      </PageContainer>

      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {count === 1 ? "Discard this draft?" : `Discard all ${count} drafts?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {count === 1
                ? "This draft will be removed from your Drafts. You can undo right after."
                : "Every draft will be removed from your Drafts. You can undo right after."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDiscardAll} variant="destructive">
              {count === 1 ? "Discard draft" : "Discard all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainContainer>
  );
}

/**
 * Resolves the Task Draft subtype for a Drafts row and renders its card. Lives
 * one component down so each draft owns its own `task_drafts.by_draft_id`
 * subscription (Zero dedupes), keeping the page shell free of per-row queries.
 */
function DraftCardLoader({
  draftId,
  churchId,
  onDiscard,
}: {
  readonly draftId: string;
  readonly churchId: string | null;
  readonly onDiscard: (draftId: string) => void;
}) {
  const taskDraft = useTaskDraft(draftId);
  if (!taskDraft) return null;
  return <DraftCard churchId={churchId} onDiscard={onDiscard} taskDraft={taskDraft} />;
}

function DraftsSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-3" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div className="rounded-xl border bg-card p-4 shadow-xs" key={row}>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2.5 h-3 w-4/5" />
          <div className="mt-4 flex gap-1.5">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
