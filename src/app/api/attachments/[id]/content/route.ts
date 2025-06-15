import { NextRequest, NextResponse } from 'next/server';
import { db } from "~/server/db";
import { attachments } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const attachmentId = parseInt(id);
    
    if (isNaN(attachmentId)) {
      return NextResponse.json({ error: 'Invalid attachment ID' }, { status: 400 });
    }
    
    // Get attachment from database
    const attachment = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId))
      .limit(1);
    
    if (!attachment[0]) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }
    
    // Read file content
    const filePath = path.join(process.cwd(), 'public', attachment[0].url);
    const content = await readFile(filePath, 'utf-8');
    
    return NextResponse.json({
      id: attachment[0].id,
      fileName: attachment[0].fileName,
      fileType: attachment[0].fileType,
      fileSize: attachment[0].fileSize,
      content: content,
    });
  } catch (error) {
    console.error('Error reading attachment content:', error);
    return NextResponse.json({ error: 'Failed to read attachment content' }, { status: 500 });
  }
}
