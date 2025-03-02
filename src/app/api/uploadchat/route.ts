import { getChats, createChat, deleteChat } from "./core";
import { NextResponse } from "next/server";

export async function GET() {
  const chats = await getChats();
  return NextResponse.json(chats);
}

interface ChatData {
  name: string;
  userId: string;
  url: string;
}

export async function POST(req: Request) {
  const { name, userId } = (await req.json()) as ChatData;
  const newChat = await createChat(name, userId);
  return NextResponse.json(newChat);
}

interface DeleteChatData {
  id: number;
}

export async function DELETE(req: Request) {
  const { id } = (await req.json()) as DeleteChatData;
  const deletedChat = await deleteChat(id);
  return NextResponse.json(deletedChat);
}