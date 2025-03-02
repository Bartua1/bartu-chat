import { db } from "~/server/db";
import { chats } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

export async function getChats() {
  return await db.select().from(chats);
}

export async function createChat(name: string, userId: string) {
  return await db
    .insert(chats)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    .values({ name: name, userId: userId, url: uuidv4() })
    .returning();
}

export async function deleteChat(id: number) {
  return await db.delete(chats).where(eq(chats.id, id)).returning();
}