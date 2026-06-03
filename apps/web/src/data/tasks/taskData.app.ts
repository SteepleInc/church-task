import { recordFromCollection } from "@/data/convex-query-adapter";
import { useTasksCollection, type TaskCollectionFilters } from "@/data/tasks/tasksData.app";

export function useTaskData(params: {
  readonly churchId: string | null;
  readonly currentUserId: string | null;
  readonly taskId: string;
  readonly filters?: TaskCollectionFilters;
}) {
  const tasks = useTasksCollection({
    churchId: params.churchId,
    currentUserId: params.currentUserId,
    filters: { ...params.filters, taskId: params.taskId },
  });
  const state = recordFromCollection(tasks, (task) => task.id === params.taskId);

  return {
    loading: state.loading,
    taskOpt: state.record,
  };
}
