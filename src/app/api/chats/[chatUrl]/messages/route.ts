"use server"

import { NextResponse } from "next/server";
import { getAuth  } from "@clerk/nextjs/server";
import { getMessages } from "./core";

// Get chats for a specific user
export async function GET(request: Request, context: { params: { chatUrl: string } }) {
  const { params } = context; // Destructure to get params
  const requestChatUrl = params.chatUrl; // No need to await individual properties
  console.log(`Fetching messages for chat URL: ${requestChatUrl}`);

  // Get all messages with that chatUrl
  const chatMessages = await getMessages(requestChatUrl);

  return NextResponse.json(chatMessages);
}