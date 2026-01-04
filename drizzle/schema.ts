import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Reference photos uploaded by users for sticker generation
 */
export const referencePhotos = mysqlTable("reference_photos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferencePhoto = typeof referencePhotos.$inferSelect;
export type InsertReferencePhoto = typeof referencePhotos.$inferInsert;

/**
 * Sticker packs created by users
 */
export const stickerPacks = mysqlTable("sticker_packs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  referencePhotoId: int("referencePhotoId"),
  style: varchar("style", { length: 50 }).notNull().default("cute_cartoon"), // cute_cartoon, realistic_cartoon, anime, chibi
  bodyType: varchar("bodyType", { length: 50 }).notNull().default("half_body"), // half_body, full_body, mixed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StickerPack = typeof stickerPacks.$inferSelect;
export type InsertStickerPack = typeof stickerPacks.$inferInsert;

/**
 * Individual stickers within packs
 */
export const stickers = mysqlTable("stickers", {
  id: int("id").autoincrement().primaryKey(),
  packId: int("packId").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  emotion: varchar("emotion", { length: 100 }).notNull(), // e.g., "happy", "sad", "angry", "surprised"
  prompt: text("prompt"), // AI prompt used to generate this sticker
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sticker = typeof stickers.$inferSelect;
export type InsertSticker = typeof stickers.$inferInsert;
