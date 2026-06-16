import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const utcTimestamp = (name: string) => timestamp(name, { mode: "date", withTimezone: true });

export const baseEntityFields = {
  _tag: text("_tag").notNull(),
  created_at: utcTimestamp("created_at").notNull().defaultNow(),
  created_by: text("created_by"),
  updated_at: utcTimestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  updated_by: text("updated_by"),
  deleted_at: utcTimestamp("deleted_at"),
  deleted_by: text("deleted_by"),
};

export type BaseEntityFields = typeof baseEntityFields;

export const demo_items = pgTable(
  "demo_items",
  {
    id: text("id").primaryKey(),
    ...baseEntityFields,
    name: text("name").notNull(),
    owner_user_id: text("owner_user_id"),
  },
  (table) => [
    uniqueIndex("demo_items_name_live_idx")
      .on(table.name)
      .where(sql`${table.deleted_at} IS NULL`),
    index("demo_items_owner_user_id_idx").on(table.owner_user_id),
  ],
);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: utcTimestamp("ban_expires"),
  createdAt: utcTimestamp("created_at").notNull().defaultNow(),
  updatedAt: utcTimestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: utcTimestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: utcTimestamp("created_at").notNull().defaultNow(),
  updatedAt: utcTimestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull(),
  activeOrganizationId: text("active_organization_id"),
  orgCompletedOnboarding: boolean("org_completed_onboarding"),
  orgRole: text("org_role"),
  orgType: text("org_type"),
  skipOrgFallback: boolean("skip_org_fallback").notNull().default(false),
  userRole: text("user_role"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: utcTimestamp("access_token_expires_at"),
  refreshTokenExpiresAt: utcTimestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: utcTimestamp("created_at").notNull().defaultNow(),
  updatedAt: utcTimestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: utcTimestamp("expires_at").notNull(),
  createdAt: utcTimestamp("created_at").notNull().defaultNow(),
  updatedAt: utcTimestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    _tag: text("_tag").notNull().default("org"),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    logo: text("logo"),
    metadata: text("metadata"),
    churchTimeZone: text("church_time_zone").notNull().default("America/New_York"),
    completedOnboarding: boolean("completed_onboarding").notNull().default(false),
    url: text("url"),
    street: text("street"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    countryCode: text("country_code"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    size: text("size"),
    createdAt: utcTimestamp("created_at").notNull().defaultNow(),
    updatedAt: utcTimestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("organization_slug_idx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    _tag: text("_tag").notNull().default("orguser"),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    createdAt: utcTimestamp("created_at").notNull().defaultNow(),
    updatedAt: utcTimestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("member_organization_id_idx").on(table.organizationId),
    index("member_user_id_idx").on(table.userId),
    uniqueIndex("member_user_organization_idx").on(table.userId, table.organizationId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    _tag: text("_tag").notNull().default("churchinvitation"),
    organizationId: text("organization_id").notNull(),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull(),
    expiresAt: utcTimestamp("expires_at").notNull(),
    inviterId: text("inviter_id").notNull(),
    createdAt: utcTimestamp("created_at").notNull().defaultNow(),
    updatedAt: utcTimestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("invitation_organization_id_idx").on(table.organizationId),
    index("invitation_inviter_id_idx").on(table.inviterId),
  ],
);

export const schema = {
  account,
  demo_items,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
};

export type DemoItem = typeof demo_items.$inferSelect;
export type NewDemoItem = typeof demo_items.$inferInsert;
