import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatWeekDateRange, useUpdateWeekDetailsMutation } from "@/data/cycles/cyclesData.app";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

export type WeekActionsMenuCycle = {
  readonly id: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly name: string | null;
  readonly description: string | null;
};

export function WeekActionsMenu({
  churchId,
  cycle,
}: {
  readonly churchId: string;
  readonly cycle: WeekActionsMenuCycle;
}) {
  const updateWeekDetails = useUpdateWeekDetailsMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(cycle.name ?? "");
  const [description, setDescription] = useState(cycle.description ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const result = await updateWeekDetails({
      churchId,
      cycleId: cycle.id,
      description: description.trim() || null,
      name: name.trim() || null,
    });
    setSaving(false);
    if (result.ok) setOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Week actions"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpen(true)}>Edit Week details</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Week details</DialogTitle>
            <DialogDescription>
              Name and description are Church-wide. Dates stay fixed at {formatWeekDateRange(cycle)}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="week-name">Name</Label>
              <Input
                id="week-name"
                onChange={(event) => setName(event.target.value)}
                placeholder={formatWeekDateRange(cycle)}
                value={name}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="week-description">Description</Label>
              <Textarea
                id="week-description"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add planning context for this Week…"
                value={description}
              />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={saving} onClick={() => setOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={saving} onClick={save} type="button">
              Save Week
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
