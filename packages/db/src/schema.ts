import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const utcTimestamp = (name: string) => timestamp(name, { mode: "date", withTimezone: true });

const baseEntityFields = {
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

export const schema = {
  account,
  demo_items,
  session,
  user,
  verification,
};

export type DemoItem = typeof demo_items.$inferSelect;
export type NewDemoItem = typeof demo_items.$inferInsert;
