// Pure helpers for the Week tooltip — the Linear-style hover on a Task's Week
// chip. The tooltip pairs a completion ring with a one-line summary
// ("25% of 48 · Current · 18 weekdays left"), so these helpers turn raw dates
// and counts into the pieces that line needs without touching the view layer.

const MS_PER_DAY = 86_400_000;

const parseIsoUtc = (value: string): number | null => {
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(time) ? null : time;
};

/**
 * Count the weekdays (Mon–Fri) remaining in a Week, counting from `today`
 * through the Week's `endDate` inclusive. Weekend days are skipped — matching
 * Linear, which measures cycle runway in working days. A Week that has already
 * ended (or whose dates don't parse) returns 0.
 *
 * Both dates are ISO `YYYY-MM-DD` strings interpreted in UTC so the count is
 * timezone-stable; the result is a plain day count, not a wall-clock duration.
 */
export function weekdaysRemaining(today: string, endDate: string): number {
  const start = parseIsoUtc(today);
  const end = parseIsoUtc(endDate);
  if (start === null || end === null || end < start) return 0;

  let count = 0;
  for (let time = start; time <= end; time += MS_PER_DAY) {
    const day = new Date(time).getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

/** "18 weekdays left", "1 weekday left", or null when the Week has ended. */
export function weekdaysLeftLabel(today: string, endDate: string): string | null {
  const days = weekdaysRemaining(today, endDate);
  if (days <= 0) return null;
  return `${days} weekday${days === 1 ? "" : "s"} left`;
}

/**
 * The Week tooltip's summary line: completion ("25% of 48"), the relative cue
 * ("Current"), and the weekdays-left runway, joined with " · ". Empty segments
 * (no Tasks scoped, no cue, a finished Week) are dropped so the line never
 * trails a stray separator.
 */
export function weekTooltipSummary(args: {
  readonly scope: number;
  readonly completedPercentage: number;
  readonly relativeLabel: string | null;
  readonly weekdaysLeft: string | null;
}): string {
  const segments: string[] = [];
  if (args.scope > 0) {
    segments.push(`${Math.round(args.completedPercentage)}% of ${args.scope}`);
  }
  if (args.relativeLabel) segments.push(args.relativeLabel);
  if (args.weekdaysLeft) segments.push(args.weekdaysLeft);
  return segments.join(" · ");
}
