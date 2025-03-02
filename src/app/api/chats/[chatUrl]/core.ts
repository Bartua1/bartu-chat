import { db } from "~/server/db";
import { messages, chats } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function deleteChat(chatId: string) {
    const chatResult = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    const chat = chatResult[0];
    if (!chat) {
        return { error: "Chat not found" };
    }

    await db.delete().from(messages).where(eq(messages.chatId, chat.id));
    await db.delete().from(chats).where(eq(chats.id, chat.id));

    return { success: true };
}