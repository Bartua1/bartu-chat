import { NextRequest, NextResponse } from 'next/server';
import { db } from "~/server/db";
import { attachments } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const messageId = url.searchParams.get('messageId');
  
  if (!messageId) {
    return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
  }
  
  try {
    const messageAttachments = await db
      .select()
      .from(attachments)
      .where(eq(attachments.messageId, parseInt(messageId)));
    
    return NextResponse.json(messageAttachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const messageId = formData.get('messageId') as string;
    const fileName = formData.get('fileName') as string;
    
    if (!file || !messageId) {
      return NextResponse.json({ error: 'File and message ID required' }, { status: 400 });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() ?? 'txt';
    const uniqueFileName = `${timestamp}_${fileName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    
    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Save attachment record to database
    const attachment = await db
      .insert(attachments)
      .values({
        messageId: parseInt(messageId),
        fileName: fileName,
        fileType: file.type || 'text/plain',
        fileSize: file.size,
        url: `/uploads/${uniqueFileName}`,
      })
      .returning();
    
    return NextResponse.json(attachment[0]);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
}

interface DeleteAttachmentData {
  id: number;
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = (await request.json()) as DeleteAttachmentData;
    
    if (!id) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 });
    }
    
    const deletedAttachment = await db
      .delete(attachments)
      .where(eq(attachments.id, id))
      .returning();
    
    return NextResponse.json(deletedAttachment[0]);
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
