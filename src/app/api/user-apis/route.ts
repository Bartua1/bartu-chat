import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { userAPIs, AIModels } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { OpenAI } from "openai";

// GET - Fetch user's APIs
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apis = await db
      .select()
      .from(userAPIs)
      .where(eq(userAPIs.userId, userId));

    return NextResponse.json(apis);
  } catch (error) {
    console.error("Error fetching user APIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch APIs" },
      { status: 500 }
    );
  }
}

// POST - Add new API (test connection but don't auto-import models)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, provider, apiKey, apiUrl } = body;

    if (!name || !provider || !apiKey || !apiUrl) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Test the API connection based on provider
    try {
      if (provider.toLowerCase() === "google" || provider.toLowerCase() === "gemini") {
        // For Google Gemini, test with a simple request to list models
        const response = await fetch(`${apiUrl}/models?key=${apiKey}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        // For OpenAI-compatible APIs
        const client = new OpenAI({
          baseURL: apiUrl,
          apiKey: apiKey,
        });

        // Just test the connection by trying to list models
        await client.models.list();
      }
    } catch (error) {
      console.error("Error testing API connection:", error);
      return NextResponse.json(
        { error: "Failed to connect to API. Please check your API key and URL." },
        { status: 400 }
      );
    }

    // Save the API
    const [newAPI] = await db
      .insert(userAPIs)
      .values({
        userId,
        name,
        provider,
        apiKey,
        apiUrl,
        isActive: "true",
      })
      .returning();

    return NextResponse.json({
      api: newAPI,
      message: "API added successfully. You can now import models from the Models page."
    });
  } catch (error) {
    console.error("Error adding API:", error);
    return NextResponse.json(
      { error: "Failed to add API" },
      { status: 500 }
    );
  }
}

// DELETE - Remove API and associated models
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const apiId = searchParams.get("id");

    if (!apiId) {
      return NextResponse.json(
        { error: "API ID is required" },
        { status: 400 }
      );
    }

    // Delete associated models first
    await db
      .delete(AIModels)
      .where(
        and(
          eq(AIModels.userApiId, parseInt(apiId)),
          eq(AIModels.owner, userId)
        )
      );

    // Delete the API
    await db
      .delete(userAPIs)
      .where(
        and(
          eq(userAPIs.id, parseInt(apiId)),
          eq(userAPIs.userId, userId)
        )
      );

    return NextResponse.json({ message: "API and models deleted successfully" });
  } catch (error) {
    console.error("Error deleting API:", error);
    return NextResponse.json(
      { error: "Failed to delete API" },
      { status: 500 }
    );
  }
}
