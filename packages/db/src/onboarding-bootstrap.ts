import {
  DEFAULT_WORKFLOW_STATUSES,
  addLocalDateDays,
  generateTeamIdentifier,
  getLabelColorForName,
  getTeamColorForName,
  STARTER_LABELS,
  STARTER_TEAM_NAMES,
} from "@church-task/domain";
import {
  getLabelId,
  getCycleId,
  getTeamId,
  getTeamMembershipId,
  getWorkflowId,
  getWorkflowStatusId,
} from "@church-task/shared/get-ids";
import { and, eq, isNull, sql } from "drizzle-orm";

import type { ChurchTaskDb } from "./client";
import {
  cycles,
  labels,
  organization,
  team_memberships,
  teams,
  workflow_statuses,
  workflows,
} from "./schema";

const parseLocalDate = (localDate: string) => {
  const [year, month, day] = localDate.split("-").map(Number) as [number, number, number];
  const asUtcDate = new Date(Date.UTC(year, month - 1, day));
  if (asUtcDate.toISOString().slice(0, 10) !== localDate) throw new Error("Invalid local date.");
  return { day, month, year };
};

const localDateForInstant = (instant: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(instant);
  const byType = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  return `${byType.year}-${byType.month}-${byType.day}`;
};

const localMidnightToUtcInstant = (localDate: string, timeZone: string) => {
  const { day, month, year } = parseLocalDate(localDate);
  let candidateUtc = Date.UTC(year, month - 1, day);
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const byType = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidateUtc))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const localAsUtc = Date.UTC(
      Number(byType.year),
      Number(byType.month) - 1,
      Number(byType.day),
      Number(byType.hour),
      Number(byType.minute),
      Number(byType.second),
    );
    const delta = localAsUtc - Date.UTC(year, month - 1, day);
    if (delta === 0) return new Date(candidateUtc);
    candidateUtc -= delta;
  }
  return new Date(candidateUtc);
};

const cycleStartDateForLocalDate = (localDate: string) => {
  const { day, month, year } = parseLocalDate(localDate);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addLocalDateDays(localDate, -((dayOfWeek + 6) % 7));
};

export type BootstrapChurchOnboardingArgs = {
  readonly church_id: string;
  readonly user_id: string;
};

export const bootstrapChurchOnboarding = async (
  db: ChurchTaskDb,
  args: BootstrapChurchOnboardingArgs,
) => {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${args.church_id}))`);

    const [church] = await tx
      .select({ churchTimeZone: organization.churchTimeZone })
      .from(organization)
      .where(eq(organization.id, args.church_id))
      .limit(1);
    const churchTimeZone = church?.churchTimeZone ?? "America/New_York";
    const currentCycleStartDate = cycleStartDateForLocalDate(
      localDateForInstant(new Date(), churchTimeZone),
    );

    for (const startDate of [currentCycleStartDate, addLocalDateDays(currentCycleStartDate, 7)]) {
      const existingCycle = await tx
        .select({ id: cycles.id })
        .from(cycles)
        .where(
          and(
            eq(cycles.church_id, args.church_id),
            eq(cycles.start_date, startDate),
            isNull(cycles.deleted_at),
          ),
        )
        .limit(1);
      if (existingCycle.length > 0) continue;

      await tx.insert(cycles).values({
        _tag: "cycle",
        church_id: args.church_id,
        church_time_zone: churchTimeZone,
        created_by: args.user_id,
        end_date: addLocalDateDays(startDate, 6),
        ends_at: localMidnightToUtcInstant(addLocalDateDays(startDate, 7), churchTimeZone),
        id: getCycleId(),
        start_date: startDate,
        starts_at: localMidnightToUtcInstant(startDate, churchTimeZone),
        updated_by: args.user_id,
      });
    }

    const existingTeams = await tx
      .select({ identifier: teams.identifier })
      .from(teams)
      .where(and(eq(teams.church_id, args.church_id), isNull(teams.deleted_at)));
    const takenIdentifiers = existingTeams.map((team) => team.identifier);

    if (existingTeams.length === 0) {
      for (const [index, name] of STARTER_TEAM_NAMES.entries()) {
        const identifier = generateTeamIdentifier(name, takenIdentifiers);
        takenIdentifiers.push(identifier);

        const now = new Date();
        const teamId = getTeamId();
        const workflowId = getWorkflowId();

        await tx.insert(teams).values({
          _tag: "team",
          church_id: args.church_id,
          color: getTeamColorForName(name),
          created_at: now,
          created_by: args.user_id,
          id: teamId,
          identifier,
          name,
          previous_identifiers: "[]",
          sort_order: index,
          updated_at: now,
          updated_by: args.user_id,
        });

        await tx.insert(team_memberships).values({
          _tag: "teammembership",
          church_id: args.church_id,
          created_at: now,
          created_by: args.user_id,
          id: getTeamMembershipId(),
          team_id: teamId,
          updated_at: now,
          updated_by: args.user_id,
          user_id: args.user_id,
        });

        await tx.insert(workflows).values({
          _tag: "workflow",
          church_id: args.church_id,
          created_at: now,
          created_by: args.user_id,
          id: workflowId,
          name: `${name} Workflow`,
          team_id: teamId,
          updated_at: now,
          updated_by: args.user_id,
        });

        await tx.insert(workflow_statuses).values(
          DEFAULT_WORKFLOW_STATUSES.map((status) => ({
            _tag: "workflowstatus",
            church_id: args.church_id,
            created_at: now,
            created_by: args.user_id,
            id: getWorkflowStatusId(),
            key: status.key,
            name: status.name,
            sort_order: status.sort_order,
            task_state: status.task_state,
            updated_at: now,
            updated_by: args.user_id,
            workflow_id: workflowId,
          })),
        );
      }
    }

    const existingLabels = await tx
      .select({ id: labels.id })
      .from(labels)
      .where(and(eq(labels.church_id, args.church_id), isNull(labels.deleted_at)));

    if (existingLabels.length > 0) return;

    for (const name of STARTER_LABELS) {
      const now = new Date();

      await tx.insert(labels).values({
        _tag: "label",
        church_id: args.church_id,
        color: getLabelColorForName(name),
        created_at: now,
        created_by: args.user_id,
        id: getLabelId(),
        name,
        team_id: null,
        updated_at: now,
        updated_by: args.user_id,
      });
    }
  });
};
