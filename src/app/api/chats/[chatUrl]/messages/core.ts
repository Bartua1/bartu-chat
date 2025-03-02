import { db } from "~/server/db";
import { messages, chats } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function getChat(chatUrl: string) {
    return await db.select().from(chats).where(eq(chats.url, chatUrl)).limit(1);
}

export async function getMessages(chatUrl: string) {
    const chatResult = await getChat(chatUrl);
    const chat = chatResult[0];
    if (!chat) {
        return []; // Or throw an error, depending on your requirements
    }

    return await db.select().from(messages).where(eq(messages.chatId, chat.id));
}