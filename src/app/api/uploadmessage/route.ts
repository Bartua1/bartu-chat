import { getMessages, createMessage, deleteMessage } from './core';
import { NextResponse } from 'next/server';

export async function GET() {
    const messages = await getMessages();
    return NextResponse.json(messages);
}

interface MessageData {
    chatUrl: string;
    model: string;
    userId: string;
    content: string;
    sender: string; // System or User
}

export async function POST(req: Request) {
    const { chatUrl, model, userId, content, sender } = (await req.json()) as MessageData;
    const newMessage = await createMessage(model, userId, content, chatUrl, sender);
    return NextResponse.json(newMessage);
}

interface DeleteMessageData {
    id: number;
}

export async function DELETE(req: Request) {
    const { id } = (await req.json()) as DeleteMessageData;
    const deletedMessage = await deleteMessage(id);
    return NextResponse.json(deletedMessage);
}
