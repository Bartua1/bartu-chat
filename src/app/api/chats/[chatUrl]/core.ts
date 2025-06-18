import { db } from "~/server/db";
import { messages, chats } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function updateChat(chatUrl: string, updates: { name?: string }) {
    const chatResult = await db.select().from(chats).where(eq(chats.url, chatUrl)).limit(1);
    const chat = chatResult[0];
    if (!chat) {
        return { error: "Chat not found" };
    }

    const updatedChat = await db.update(chats)
        .set(updates)
        .where(eq(chats.url, chatUrl))
        .returning();

    return { success: true, chat: updatedChat[0] };
}

export async function deleteChat(chatId: string) {
    const chatResult = await db.select().from(chats).where(eq(chats.url, chatId)).limit(1);
    const chat = chatResult[0];
    if (!chat) {
        return { error: "Chat not found" };
    }

    await db.delete(messages).where(eq(messages.chatId, chat.id));
    await db.delete(chats).where(eq(chats.id, chat.id));

    return { success: true };
}
