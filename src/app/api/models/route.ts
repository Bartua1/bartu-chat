import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { AIModels, userAPIs } from "~/server/db/schema";
import { eq, or } from "drizzle-orm";
import { OpenAI } from 'openai';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      // Return system models only for unauthenticated users
      try {
        const openAIUrl = process.env.OPEN_AI_URL;
        const client = new OpenAI({
          baseURL: openAIUrl,
          apiKey: process.env.OPEN_AI_API_KEY ?? "dummy",
        });
        const response = await client.models.list();
        return NextResponse.json(response.data, { status: 200 });
      } catch (error) {
        console.error('Error fetching system models:', error);
        return NextResponse.json(
          { error: 'Failed to fetch models' },
          { status: 500 }
        );
      }
    }

    // For authenticated users, return both system and user models
    const models = await db
      .select({
        id: AIModels.id,
        name: AIModels.name,
        object: AIModels.provider,
        created: AIModels.createdAt,
        owned_by: AIModels.owner,
        displayName: AIModels.displayName,
        provider: AIModels.provider,
        inputPrice: AIModels.inputPrice,
        outputPrice: AIModels.outputPrice,
        maxTokens: AIModels.maxTokens,
        isActive: AIModels.isActive,
        userApiId: AIModels.userApiId,
        apiName: userAPIs.name,
        apiUrl: userAPIs.apiUrl,
        tags: AIModels.tags,
        apiKey: userAPIs.apiKey,
      })
      .from(AIModels)
      .leftJoin(userAPIs, eq(AIModels.userApiId, userAPIs.id))
      .where(
        or(
          eq(AIModels.owner, "system"),
          eq(AIModels.owner, userId)
        )
      );

    // If no user models found, also include system models from OpenAI
    if (models.filter(m => m.owned_by === userId).length === 0) {
      try {
        const openAIUrl = process.env.OPEN_AI_URL;
        const client = new OpenAI({
          baseURL: openAIUrl,
          apiKey: process.env.OPEN_AI_API_KEY ?? "dummy",
        });
        const systemResponse = await client.models.list();
        
        // Add system models to the result
        const systemModels = systemResponse.data.map(model => ({
          id: model.id,
          name: model.id,
          object: model.object,
          created: model.created,
          owned_by: "system",
          displayName: model.id,
          provider: "openai",
          inputPrice: 0,
          outputPrice: 0,
          maxTokens: null,
          isActive: "true",
          userApiId: null,
          tags: [],
          apiName: null,
          apiUrl: process.env.OPEN_AI_URL,
          apiKey: process.env.OPEN_AI_API_KEY,
        }));
        
        // Process models to ensure tags is always an array
        const processedModels = models.map(model => ({
          ...model,
          tags: Array.isArray(model.tags) ? model.tags : (model.tags ? JSON.parse(model.tags as string) as string[] : [])
        }));
        
        return NextResponse.json([...systemModels, ...processedModels], { status: 200 });
      } catch (error) {
        console.error('Error fetching system models:', error);
        // Return only user models if system models fail
        const processedModels = models.map(model => ({
          ...model,
          tags: Array.isArray(model.tags) ? model.tags : (model.tags ? JSON.parse(model.tags as string) as string[] : [])
        }));
        return NextResponse.json(processedModels, { status: 200 });
      }
    }

    // Process models to ensure tags is always an array
    const processedModels = models.map(model => ({
      ...model,
      tags: model.tags ?? []
    }));

    return NextResponse.json(processedModels, { status: 200 });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
