import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { messages, model, stream, attachments } = await request.json();

    if (!messages || !model) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Process attachments if provided
    let processedMessages = messages;
    if (attachments && attachments.length > 0) {
      // Add attachment content to the last user message
      const lastUserMessageIndex = messages.length - 1;
      let attachmentContent = '\n\n**Attached Files:**\n';
      
      for (const attachment of attachments) {
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/attachments/${attachment.id}/content`);
          if (response.ok) {
            const data = await response.json();
            attachmentContent += `\n**${data.fileName}:**\n\`\`\`\n${data.content}\n\`\`\`\n`;
          }
        } catch (error) {
          console.error('Error fetching attachment:', error);
          attachmentContent += `\n**${attachment.fileName}:** (Error loading file)\n`;
        }
      }
      
      processedMessages = [...messages];
      processedMessages[lastUserMessageIndex] = {
        ...processedMessages[lastUserMessageIndex],
        content: processedMessages[lastUserMessageIndex].content + attachmentContent
      };
    }

    // Initialize OpenAI client with proper server-side credentials
    const client = new OpenAI({
      baseURL: process.env.OPEN_AI_URL,
      apiKey: process.env.OPEN_AI_API_KEY ?? "dummy", // Use proper API key from environment variables
    });

    // Handle streaming response
    if (stream) {
        const stream = await client.chat.completions.create({
          model,
          messages: processedMessages,
          stream: true,
        });

      // Create a TransformStream to handle SSE streaming
      const encoder = new TextEncoder();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      // Process the stream
      (async () => {
        try {
          for await (const chunk of stream) {
            const data = chunk.choices[0]?.delta?.content || '';
            if (data) {
              // Format as SSE (Server-Sent Events)
              const payload = `data: ${JSON.stringify({
                choices: [{ delta: { content: data } }]
              })}\n\n`;
              await writer.write(encoder.encode(payload));
            }
          }
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Streaming error:', error);
          const errorPayload = `data: ${JSON.stringify({ error: 'Streaming error occurred' })}\n\n`;
          await writer.write(encoder.encode(errorPayload));
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const completion = await client.chat.completions.create({
        model,
        messages: processedMessages,
      });

      return NextResponse.json(completion, { status: 200 });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
