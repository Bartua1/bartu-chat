import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { z } from "zod";
import { OpenAI } from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
    baseURL: process.env.OPEN_AI_URL,
    apiKey: process.env.OPEN_AI_API_KEY ?? "dummy", // Use proper API key from environment variables
});

// Input validation schema
const generateTitleSchema = z.object({
  message: z.string().min(1),
  model: z.string().optional()
});

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = generateTitleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { message, model = "qwen2.5-7b-instruct-1m" } = validationResult.data;

    // Generate title using OpenAI
    const response = await openai.chat.completions.create({
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
    const title = response.choices[0]?.message.content?.trim() || `Chat - ${new Date().toLocaleDateString()}`;
    
    // Remove any quotes that might be in the title
    const cleanTitle = title.replace(/["']/g, "");
    
    // If this is a thinking model (Response starts with <Think>), we need to delete whatever is inside the <Think> tag and return the rest
    if (cleanTitle.startsWith("<Think>")) {
      const thinkIndex = cleanTitle.indexOf("<Think>");
      const cleanTitle = cleanTitle.slice(thinkIndex + 7).trim();
    }

    return NextResponse.json({ title: cleanTitle });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Failed to generate title" },
      { status: 500 }
    );
  }
}