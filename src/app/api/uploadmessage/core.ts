import { db } from "~/server/db";
import { messages, attachments } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { chats } from "~/server/db/schema";

export async function getMessages() {
  return await db.select().from(messages);
}

export async function getChat(chatUrl: string) {
  return await db.select().from(chats).where(eq(chats.url, chatUrl)).limit(1);
}

export async function createMessage(model: string, userId: string, content: string, chatUrl: string, sender: string, attachmentIds?: number[]) {
  const chatResult: { id: number }[] = await getChat(chatUrl);
  if (!chatResult[0]) {
    throw new Error("Chat not found");
  }
  
  const newMessage = await db
    .insert(messages)
    .values({chatId: chatResult[0].id, model: model, userId: userId, content: content, sender: sender })
    .returning();
  
  // Update attachment messageIds if provided
  if (attachmentIds && attachmentIds.length > 0 && newMessage[0]) {
    const messageId = newMessage[0].id;
    await Promise.all(
      attachmentIds.map(attachmentId =>
        db.update(attachments)
          .set({ messageId: messageId })
          .where(eq(attachments.id, attachmentId))
      )
    );
  }
  
  return newMessage;
}

export async function deleteMessage(id: number) {
  return await db.delete(messages).where(eq(messages.id, id)).returning();
}
