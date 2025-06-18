import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { OpenAI } from "openai";
import { db } from "~/server/db";
import { AIModels, userAPIs } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Input validation schema
const generateTitleSchema = z.object({
  message: z.string().min(1),
  model: z.string().min(1) // Make model required
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json() as unknown;
    const validationResult = generateTitleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { message, model } = validationResult.data;

    // Fetch model details from the database (same logic as chat API)
    const aiModel = await db
      .select()
      .from(AIModels)
      .where(eq(AIModels.name, model))
      .limit(1);

    if (!aiModel || aiModel.length === 0) {
      return NextResponse.json({ error: "Model not found" }, { status: 400 });
    }

    const modelDetails = aiModel[0];

    // Fetch API details from the database
    let apiUrl: string | undefined = process.env.OPEN_AI_URL;
    let apiKey: string | undefined = process.env.OPEN_AI_API_KEY;

    if (modelDetails?.userApiId) {
      const userApi = await db
        .select()
        .from(userAPIs)
        .where(eq(userAPIs.id, modelDetails.userApiId))
        .limit(1);

      if (!userApi || userApi.length === 0) {
        return NextResponse.json({ error: "API not found" }, { status: 400 });
      }

      apiUrl = userApi[0]?.apiUrl;
      apiKey = userApi[0]?.apiKey;
    }

    apiUrl = apiUrl ?? "https://api.openai.com";
    apiKey = apiKey ?? "dummy";

    // Initialize OpenAI client with dynamic configuration
    const client = new OpenAI({
      baseURL: apiUrl,
      apiKey: apiKey,
    });

    // Generate title using the selected model
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates concise, descriptive titles based on user messages. Keep titles under 6 words."
        },
        {
          role: "user",
          content: `Generate a short, descriptive title for a chat that starts with this message: "${message}"`
        }
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    // Extract and clean the title
    let title = response.choices[0]?.message.content?.trim() ?? `Chat - ${new Date().toLocaleDateString()}`;

    // Remove any quotes that might be in the title
    title = title.replace(/["']/g, "");

    // If this is a thinking model (Response starts with <Think>), we need to extract content after the thinking tag
    if (title.startsWith("<Think>")) {
      const thinkEndIndex = title.indexOf("</Think>");
      if (thinkEndIndex !== -1) {
        title = title.slice(thinkEndIndex + 8).trim();
      } else {
        // If no closing tag, remove the opening tag
        title = title.slice(7).trim();
      }
    }

    // Fallback if title is empty after processing
    if (!title) {
      title = `Chat - ${new Date().toLocaleDateString()}`;
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}
