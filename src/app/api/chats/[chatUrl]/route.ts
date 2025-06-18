"use server"

import { NextRequest, NextResponse } from "next/server";
import { getAuth  } from "@clerk/nextjs/server";
import { deleteChat, updateChat } from "./core";
import { z } from "zod";

// Input validation schema
const updateChatSchema = z.object({
  name: z.string().min(1).optional(),
});

// Update a chat
export async function PATCH(request: NextRequest, context: { params: { chatUrl: string } }) {
    const { params } = context;
    const chatUrl = params.chatUrl;
    
    // Authenticate the user
    const { userId } = getAuth(request);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Parse and validate request body
        const body = await request.json() as unknown;
        const validationResult = updateChatSchema.safeParse(body);
        
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid request", details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const updates = validationResult.data;
        
        // Update the chat
        const updateResult = await updateChat(chatUrl, updates);
        
        if (updateResult.error) {
            return NextResponse.json({ error: updateResult.error }, { status: 404 });
        }

        return NextResponse.json(updateResult);
    } catch (error) {
        console.error("Error updating chat:", error);
        return NextResponse.json(
            { error: "Failed to update chat" },
            { status: 500 }
        );
    }
}

// Delete a chat and all its messages
export async function DELETE(request: NextRequest, context: { params: { chatUrl: string } }) {
    const { params } = context; // Destructure to get params
    const requestChatId = params.chatUrl; // Fixed typo: was charUrl
    console.log(`Deleting chat with ID: ${requestChatId}`);

    // Delete the chat
    const deleteResult = await deleteChat(requestChatId);

    return NextResponse.json(deleteResult);
}
