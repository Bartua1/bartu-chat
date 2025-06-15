import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { userAPIs } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { OpenAI } from "openai";

interface AvailableModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

// GET - Search available models from a specific API
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const apiId = searchParams.get("apiId");

    if (!apiId) {
      return NextResponse.json(
        { error: "API ID is required" },
        { status: 400 }
      );
    }

    // Verify the API belongs to the user
    const userApi = await db
      .select()
      .from(userAPIs)
      .where(
        and(
          eq(userAPIs.id, parseInt(apiId)),
          eq(userAPIs.userId, userId)
        )
      )
      .limit(1);

    if (userApi.length === 0) {
      return NextResponse.json(
        { error: "API not found or not owned by user" },
        { status: 404 }
      );
    }

    const api = userApi[0]!;

    // Fetch models from the API based on provider
    let models: AvailableModel[] = [];
    try {
      if (api.provider.toLowerCase() === "google" || api.provider.toLowerCase() === "gemini") {
        // For Google Gemini API
        const response = await fetch(`${api.apiUrl}/models?key=${api.apiKey}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json() as { 
          models: Array<{ 
            name: string; 
            version?: string;
            displayName?: string; 
            description?: string;
            inputTokenLimit?: number;
            outputTokenLimit?: number;
            supportedGenerationMethods?: string[];
            temperature?: number;
            topP?: number;
            topK?: number;
          }> 
        };
        
        models = data.models.map(model => ({
          id: model.name.replace('models/', ''), // Remove 'models/' prefix if present
          object: "model",
          created: Date.now(),
          owned_by: "google",
          displayName: model.displayName,
          description: model.description,
          inputTokenLimit: model.inputTokenLimit,
          outputTokenLimit: model.outputTokenLimit,
          supportedGenerationMethods: model.supportedGenerationMethods
        }));
      } else {
        // For OpenAI-compatible APIs
        const client = new OpenAI({
          baseURL: api.apiUrl,
          apiKey: api.apiKey,
        });

        const response = await client.models.list();
        models = response.data.map(model => ({
          id: model.id,
          object: model.object,
          created: model.created,
          owned_by: model.owned_by
        }));
      }
    } catch (error) {
      console.error("Error fetching models from API:", error);
      return NextResponse.json(
        { error: "Failed to fetch models from API. Please check your API connection." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      api: {
        id: api.id,
        name: api.name,
        provider: api.provider,
        apiUrl: api.apiUrl
      },
      models
    });
  } catch (error) {
    console.error("Error searching models:", error);
    return NextResponse.json(
      { error: "Failed to search models" },
      { status: 500 }
    );
  }
}
