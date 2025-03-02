import { db } from "~/server/db";
import { messages } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { chats } from "~/server/db/schema";

export async function getMessages() {
  return await db.select().from(messages);
}

export async function getChat(chatUrl: string) {
  return await db.select().from(chats).where(eq(chats.url, chatUrl)).limit(1);
}

export async function createMessage(model: string, userId: string, content: string, chatUrl: string, sender: string) {
  const chatResult: { id: number }[] = await getChat(chatUrl);
  if (!chatResult[0]) {
    throw new Error("Chat not found");
  }
  return await db
    .insert(messages)
    .values({chatId: chatResult[0].id, model: model, userId: userId, content: content, sender: sender })
    .returning();
}

export async function deleteMessage(id: number) {
  return await db.delete(messages).where(eq(messages.id, id)).returning();
}