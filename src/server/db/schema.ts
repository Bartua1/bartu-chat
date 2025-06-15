// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  timestamp,
  text,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `bartu-chat_${name}`);

export const chats = createTable(
  "chats",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }).notNull(),
    userId: varchar("userId", { length: 256 }).notNull(),
    url: varchar("url", { length: 1024 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => ({ // Use 'table' instead of 'example' - more descriptive
    nameIndex: index("name_idx").on(table.name), // Prefix index names with table name
  })
);

export const messages = createTable(
  "messages",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    chatId: integer("chat_id").notNull(),
    userId: varchar("userId", { length: 256 }).notNull(),
    content: text("content").notNull(),
    model: varchar("model", { length: 256 }).notNull(),
    sender: varchar("sender", { length: 256 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => ({ // Use 'table' instead of 'example' - more descriptive
    chatIdIndex: index("messages_chat_id_idx").on(table.chatId), // Prefix index names with table name
  })
);

export const attachments = createTable(
  "attachments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    messageId: integer("message_id").notNull(),
    fileName: varchar("file_name", { length: 256 }).notNull(),
    fileType: varchar("file_type", { length: 256 }).notNull(),
    fileSize: integer("file_size").notNull(),
    url: varchar("url", { length: 1024 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => ({ // Use 'table' instead of 'example' - more descriptive
    messageIdIndex: index("attachments_message_id_idx").on(table.messageId), // Prefix index names with table name
  })
);

export const themeEnum = pgEnum("theme", ["light", "dark", "boring"]);

export const users = createTable(
  "users",
  {
    id: varchar("id", { length: 256 }).primaryKey(), // Assuming user ID is a string (e.g., UUID)
    email: varchar("email", { length: 256 }).notNull().unique(),
    firstName: varchar("first_name", { length: 256 }).notNull(),
    lastName: varchar("last_name", { length: 256 }).notNull(),
    profilePicture: varchar("profile_picture", { length: 1024 }), // Optional profile picture URL
    theme: themeEnum("theme").default("light"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => ({ // Use 'table' instead of 'example' - more descriptive
    emailIndex: index("users_email_idx").on(table.email), // Prefix index names with table name
    idIndex: index("users_id_idx").on(table.id), // Prefix index names with table name
  })
);

export const userAPIs = createTable(
  "user_apis",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    name: varchar("name", { length: 256 }).notNull(), // User-friendly name for the API
    provider: varchar("provider", { length: 256 }).notNull(), // e.g., "openai", "anthropic", "custom"
    apiKey: varchar("api_key", { length: 512 }).notNull(),
    apiUrl: varchar("api_url", { length: 1024 }).notNull(),
    isActive: varchar("is_active", { length: 10 }).default("true").notNull(), // "true" or "false"
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => ({
    userIdIndex: index("user_apis_user_id_idx").on(table.userId),
    userApiIndex: index("user_apis_user_api_idx").on(table.userId, table.id),
  })
);

export const AIModels = createTable(
  "ai_models",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userApiId: integer("user_api_id"), // Reference to user_apis table, nullable for system models
    name: varchar("name", { length: 256 }).notNull(), // Model ID from API
    displayName: varchar("display_name", { length: 256 }).notNull(),
    provider: varchar("provider", { length: 256 }).notNull(),
    inputPrice: integer("input_price").default(0).notNull(), // Price per token for input (in micro-cents)
    outputPrice: integer("output_price").default(0).notNull(), // Price per token for output (in micro-cents)
    owner: varchar("owner", { length: 256 }).notNull(), // "system" or userId
    tags: text("tags").$type<string[]>(), // Store tags as a JSON array
    maxTokens: integer("max_tokens"), // Max context length
    isActive: varchar("is_active", { length: 10 }).default("true").notNull(), // "true" or "false"
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => ({
    displayNameIndex: index("ai_models_display_name_idx").on(table.displayName),
    ownerIndex: index("ai_models_owner_idx").on(table.owner),
    userApiIndex: index("ai_models_user_api_idx").on(table.userApiId),
  })
);

export const Subscriptions = createTable(
  "subscriptions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    status: varchar("status", { length: 256 }).notNull(),
    standardCredits: integer("standard_credits").notNull(),
    maxStandardCredits: integer("max_standard_credits").notNull(),
    premiumCredits: integer("premium_credits").notNull(),
    maxPremiumCredits: integer("max_premium_credits").notNull(),
    resetDate: timestamp("reset_date", { withTimezone: true }),
    lastUpdated: timestamp("last_updated", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => ({ // Use 'table' instead of 'example' - more descriptive
    userIdIndex: index("subscriptions_user_id_idx").on(table.userId), // Prefix index names with table name
  })
);
