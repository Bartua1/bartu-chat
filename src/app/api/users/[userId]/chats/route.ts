"use server"

import { getChats, createChat, deleteChat } from "~/app/api/uploadchat/core";
import { NextResponse } from "next/server";
import { getAuth  } from "@clerk/nextjs/server";

// Get chats for a specific user
export async function GET( request: Request, context: { params: { userId: string } }) {
    const requestedUserId = context.params.userId;

    // Verify user authentication
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { userId } = getAuth(request);

    // Only allow users to access their own chats
    if (!userId || userId !== requestedUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all chats and filter by user ID
    const allChats = await getChats();
    const userChats = allChats.filter(chat => chat.userId === userId);

    // Sort the chats by createdAt in descending order (newest first)
    const sortedUserChats = userChats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());


  return NextResponse.json(sortedUserChats);
}

interface ChatData {
    name: string;
    url: string;
}