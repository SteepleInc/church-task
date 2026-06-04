import { ActionRow } from "@/components/ui/action-row";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

type GlobalSearchFooterProps = {
  readonly selectActionText?: string;
};

export function GlobalSearchFooter({ selectActionText = "Open Record" }: GlobalSearchFooterProps) {
  return (
    <ActionRow className="pl-4">
      <Kbd>↑</Kbd>
      <Kbd>↓</Kbd>

      <span className="mr-auto text-muted-foreground text-xs">Navigate</span>

      <Button size="sm" type="submit">
        {selectActionText}
        <Kbd className="ml-2">enter</Kbd>
      </Button>
    </ActionRow>
  );
}
