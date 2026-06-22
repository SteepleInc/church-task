import { formatDistanceToNow } from "date-fns";
import { BellIcon, InboxIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationsCollection } from "@/data/notifications/notificationsData.app";
import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";

export function InboxPage() {
  const { currentOrgOpt } = useCurrentOrgOpt();
  const { loading, notificationsCollection, unreadCount } = useNotificationsCollection({
    churchId: currentOrgOpt?.id ?? null,
  });

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground">Notifications for your active Church.</p>
        </div>
        {unreadCount > 0 ? <Badge variant="secondary">{unreadCount} unread</Badge> : null}
      </div>

      <section className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
        {loading ? (
          <div className="space-y-0 divide-y">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="flex items-start gap-3 p-4" key={index}>
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        ) : notificationsCollection.length === 0 ? (
          <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="rounded-full border bg-muted/40 p-3 text-muted-foreground">
              <InboxIcon className="size-6" />
            </div>
            <div>
              <h2 className="font-medium">Inbox is clear</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Replies and other updates that need your attention will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y overflow-auto">
            {notificationsCollection.map((notification) => (
              <article className="flex gap-3 p-4" key={notification.id}>
                <BellIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-medium">{notification.display_title}</h2>
                    {notification.read_at == null ? (
                      <span className="size-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  {notification.display_body ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {notification.display_body}
                    </p>
                  ) : null}
                </div>
                {notification.created_at ? (
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(notification.created_at, { addSuffix: true })}
                  </time>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
