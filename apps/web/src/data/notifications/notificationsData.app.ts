import { queries, type Notification } from "@church-task/zero";
import { useQuery } from "@rocicorp/zero/react";

export type NotificationCollectionItem = Notification;

export function useNotificationsCollection(params: { readonly churchId: string | null }) {
  const [rows, result] = useQuery(
    queries.notifications.by_recipient({ church_id: params.churchId ?? "__no_church__" }),
  );

  const collection = rows as readonly NotificationCollectionItem[];

  return {
    loading: params.churchId !== null && result.type !== "complete",
    collection,
    notificationsCollection: collection,
    unreadCount: collection.filter((notification) => notification.read_at == null).length,
  };
}
