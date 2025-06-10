"use server"

import { getChats, createChat, deleteChat } from "~/app/api/uploadchat/core";
import { NextResponse } from "next/server";
import { getAuth  } from "@clerk/nextjs/server";

// Get chats for a specific user
export async function GET( request: Request, { params }: { params: { userId: string } }) {

    const requestedUserId = await getRequestUserId(params);
    const { userId } = getAuth(request);

    // Only allow users to access their own chats
    if (!userId || userId !== requestedUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all chats and filter by user ID
    const allChats = await getChats(); // AWAIT IS CORRECT HERE
    const userChats = allChats.filter(chat => chat.userId === userId);

    // Sort the chats by createdAt in descending order (newest first)
    const sortedUserChats = userChats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());


  return NextResponse.json(sortedUserChats);
}

async function getRequestUserId(params: { userId: string }) {
    const { userId } = await params;
    return userId;
}

interface ChatData {
    name: string;
    url: string;
}