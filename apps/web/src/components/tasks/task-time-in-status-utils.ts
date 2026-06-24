// Computes a Task's time-in-status breakdown from its Activity log. Status
// changes are recorded as `task.status_changed` Activities carrying a
// { from, to } status reference and an `occurred_at` timestamp (epoch ms). We
// replay those transitions over the timeline — anchored at the Task's creation
// — to total how long the Task has spent in each Workflow Status, mirroring
// Linear's "Time in status" hover.

/**
 * A status-change Activity as this computation consumes it: the `occurred_at`
 * epoch-ms timestamp plus the from/to Workflow Status ids parsed from the
 * Activity metadata. Either id may be null (status set or cleared).
 */
export type StatusChange = {
  readonly occurredAt: number;
  readonly fromStatusId: string | null;
  readonly toStatusId: string | null;
};

/** A single row of the breakdown: a Workflow Status id and its total ms. */
export type StatusDuration = {
  readonly statusId: string;
  readonly durationMs: number;
};

const STATUS_CHANGED_EVENT = "task.status_changed";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;

const refId = (value: unknown): string | null => {
  const record = asRecord(value);
  if (!record) return null;
  const id = record.id;
  return typeof id === "string" && id !== "" ? id : null;
};

/**
 * Parses the `task.status_changed` Activities for a Task into ordered
 * StatusChanges. Activities arrive newest-first from the query and may carry a
 * stringified or already-parsed metadata object; both are handled. Non-status
 * Activities are ignored. The result is sorted oldest-first so it can be
 * replayed forward over the timeline.
 */
export function parseStatusChanges(
  activities: readonly {
    readonly event_type: string;
    readonly occurred_at: number;
    readonly metadata?: string | null;
  }[],
): readonly StatusChange[] {
  return activities
    .filter((activity) => activity.event_type === STATUS_CHANGED_EVENT)
    .map((activity): StatusChange => {
      let metadata: unknown = activity.metadata ?? null;
      if (typeof metadata === "string") {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          metadata = null;
        }
      }
      const record = asRecord(metadata);
      return {
        occurredAt: activity.occurred_at,
        fromStatusId: refId(record?.from),
        toStatusId: refId(record?.to),
      };
    })
    .slice()
    .sort((left, right) => left.occurredAt - right.occurredAt);
}

/**
 * Totals the time a Task has spent in each Workflow Status. The timeline starts
 * at `createdAt` in the initial status (the first transition's `from`, falling
 * back to the current status when there is no history) and ends at `now` in the
 * current status. Each transition closes the running segment and opens the next.
 * Rows are returned in descending duration order; statuses with no measurable
 * time are dropped. Negative gaps (clock skew / out-of-order data) are clamped
 * to zero so a stray timestamp can't produce a negative total.
 */
export function computeTimeInStatus(params: {
  readonly createdAt: number;
  readonly currentStatusId: string;
  readonly changes: readonly StatusChange[];
  readonly now: number;
}): readonly StatusDuration[] {
  const { createdAt, currentStatusId, changes, now } = params;
  const totals = new Map<string, number>();

  const add = (statusId: string | null, fromMs: number, toMs: number) => {
    if (!statusId) return;
    const duration = Math.max(0, toMs - fromMs);
    if (duration <= 0) return;
    totals.set(statusId, (totals.get(statusId) ?? 0) + duration);
  };

  // The status the Task occupied at `createdAt`: the first transition's `from`,
  // or — with no history — the current status for its whole lifetime.
  let segmentStatus: string | null = changes[0]?.fromStatusId ?? currentStatusId;
  let segmentStart = createdAt;

  for (const change of changes) {
    // Segment boundaries must advance monotonically; a transition timestamped
    // before the running segment's start (clock skew / pre-creation data) opens
    // a zero-length segment rather than rewinding the timeline.
    const boundary = Math.max(segmentStart, change.occurredAt);
    add(segmentStatus, segmentStart, boundary);
    segmentStatus = change.toStatusId;
    segmentStart = boundary;
  }

  // The final open segment runs to now in whatever status the replay landed on
  // (falls back to the current status if the last transition cleared it).
  add(segmentStatus ?? currentStatusId, segmentStart, now);

  return [...totals.entries()]
    .map(([statusId, durationMs]) => ({ statusId, durationMs }))
    .sort((left, right) => right.durationMs - left.durationMs);
}

/**
 * Compact, Linear-style duration label for a span of milliseconds: "11s",
 * "5m", "3h", "2d", "6w", "4mo", "2y". Weeks read better than months up to
 * ~3 months (matching the Activity feed's relative timestamps). Sub-second
 * spans render as "0s".
 */
export function formatStatusDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.round(days / 7);
  if (days < 84) return `${weeks}w`;

  const months = Math.round(days / 30);
  if (days < 365) return `${months}mo`;

  const years = Math.round(days / 365);
  return `${years}y`;
}
