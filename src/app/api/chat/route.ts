import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "~/server/db";
import { AIModels, userAPIs } from "~/server/db/schema";
import { eq } from "drizzle-orm";

interface Attachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  content?: string;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  partial?: boolean;
  tokensPerSecond?: number;
  thinking?: string | null;
  attachments?: Attachment[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      messages: Message[];
      model: string;
      stream?: boolean;
      attachments?: Attachment[];
    };

    const { messages, model, stream, attachments } = body;

    if (!messages || !model) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Process attachments if provided
    let processedMessages: Message[] = messages;
    if (attachments && attachments.length > 0) {
      // Add attachment content to the last user message
      const lastUserMessageIndex = messages.length - 1;
      let attachmentContent = "\n\n**Attached Files:**\n";

      for (const attachment of attachments) {
        try {
          const response = await fetch(
            `${
              process.env.NEXTAUTH_URL ?? "http://localhost:3000"
            }/api/attachments/${attachment.id}/content`
          );
          if (response.ok) {
            const data = (await response.json()) as Attachment;
            attachmentContent += `\n**${data.fileName}:**\n\`\`\`\n${data.content ?? ""}\n\`\`\`\n`;
          }
        } catch (error) {
          console.error("Error fetching attachment:", error);
          attachmentContent += `\n**${attachment.fileName}:** (Error loading file)\n`;
        }
      }

      processedMessages = [...messages];
      const lastMessage = processedMessages[lastUserMessageIndex];
      if (lastMessage) {
        processedMessages[lastUserMessageIndex] = {
          ...lastMessage,
          content: lastMessage.content + attachmentContent,
          role: lastMessage.role ?? "user",
        };
      }
    }
    // Check if this is a system model (from OpenAI directly) or a user model
    let apiUrl: string = process.env.OPEN_AI_URL ?? "https://api.openai.com/v1";
    let apiKey: string = process.env.OPEN_AI_API_KEY ?? "dummy";
    let actualModelId: string = model;

    // Try to fetch model details from the database first
    // The frontend sends model 'id', but we need to check both 'name' and 'id' fields
    const aiModel = await db
      .select()
      .from(AIModels)
      .leftJoin(userAPIs, eq(AIModels.userApiId, userAPIs.id))
      .where(eq(AIModels.name, model))
      .limit(1);

    // If model found in database, use its API configuration
    if (aiModel && aiModel.length > 0) {
      const modelRow = aiModel[0];
      
      if (modelRow?.user_apis?.apiUrl && modelRow?.user_apis?.apiKey) {
        apiUrl = modelRow.user_apis.apiUrl;
        apiKey = modelRow.user_apis.apiKey;
      }
      
      // Use the model name as the actual model ID for the API call
      if (modelRow?.ai_models?.name) {
        actualModelId = modelRow.ai_models.name;
      }
    } else {
      // If not found by name, try to find by display name or just use the model as-is
      // This handles system models that come directly from OpenAI
      actualModelId = model;
    }

    // Initialize OpenAI client with proper server-side credentials
    const client = new OpenAI({
      baseURL: apiUrl,
      apiKey: apiKey,
    });

    // Handle streaming response
    if (stream) {
      const streamResponse = await client.chat.completions.create({
        model: actualModelId,
        messages: processedMessages,
        stream: true,
      });

      // Create a TransformStream to handle SSE streaming
      const encoder = new TextEncoder();
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      // Process the stream
      void (async () => {
        try {
          for await (const chunk of streamResponse) {
            const data = chunk.choices[0]?.delta?.content ?? "";
            if (data) {
              // Format as SSE (Server-Sent Events)
              const payload = `data: ${JSON.stringify({
                choices: [{ delta: { content: data } }],
              })}\n\n`;
              await writer.write(encoder.encode(payload));
            }
          }
          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          console.error("Streaming error:", error);
          const errorPayload = `data: ${JSON.stringify({
            error: "Streaming error occurred",
          })}\n\n`;
          await writer.write(encoder.encode(errorPayload));
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      // Non-streaming response
      const completion = await client.chat.completions.create({
        model: actualModelId,
        messages: processedMessages,
      });

      return NextResponse.json(completion, { status: 200 });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
