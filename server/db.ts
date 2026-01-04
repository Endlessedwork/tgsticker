import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  referencePhotos, InsertReferencePhoto, ReferencePhoto,
  stickerPacks, InsertStickerPack, StickerPack,
  stickers, InsertSticker, Sticker
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Reference Photos
export async function createReferencePhoto(photo: InsertReferencePhoto): Promise<ReferencePhoto> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(referencePhotos).values(photo);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(referencePhotos).where(eq(referencePhotos.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getReferencePhotosByUserId(userId: number): Promise<ReferencePhoto[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(referencePhotos).where(eq(referencePhotos.userId, userId)).orderBy(desc(referencePhotos.createdAt));
}

export async function getReferencePhotoById(id: number): Promise<ReferencePhoto | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(referencePhotos).where(eq(referencePhotos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Sticker Packs
export async function createStickerPack(pack: InsertStickerPack): Promise<StickerPack> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(stickerPacks).values(pack);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(stickerPacks).where(eq(stickerPacks.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getStickerPacksByUserId(userId: number): Promise<StickerPack[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(stickerPacks).where(eq(stickerPacks.userId, userId)).orderBy(desc(stickerPacks.createdAt));
}

export async function getStickerPackById(id: number): Promise<StickerPack | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(stickerPacks).where(eq(stickerPacks.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteStickerPack(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all stickers in the pack first
  await db.delete(stickers).where(eq(stickers.packId, id));
  // Then delete the pack
  await db.delete(stickerPacks).where(eq(stickerPacks.id, id));
}

// Stickers
export async function createSticker(sticker: InsertSticker): Promise<Sticker> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(stickers).values(sticker);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(stickers).where(eq(stickers.id, insertedId)).limit(1);
  return inserted[0];
}

export async function getStickersByPackId(packId: number): Promise<Sticker[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(stickers).where(eq(stickers.packId, packId)).orderBy(desc(stickers.createdAt));
}

export async function deleteSticker(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(stickers).where(eq(stickers.id, id));
}
