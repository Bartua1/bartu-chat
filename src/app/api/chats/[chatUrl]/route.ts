"use server"

import { NextResponse } from "next/server";
import { getAuth  } from "@clerk/nextjs/server";
import { deleteChat } from "./core";

// Delete a chat and all its messages
export async function DELETE(request: Request, context: { params: { chatUrl: string } }) {
    const { params } = context; // Destructure to get params
    const requestChatId = params.charUrl; // No need to await individual properties
    console.log(`Deleting chat with ID: ${requestChatId}`);

    // Delete the chat
    const deleteResult = await deleteChat(requestChatId);

    return NextResponse.json(deleteResult);
}

