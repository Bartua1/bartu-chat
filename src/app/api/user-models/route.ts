import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { AIModels, userAPIs } from "~/server/db/schema";
import { eq, and, or } from "drizzle-orm";
import { OpenAI } from "openai";

interface ModelData {
  id: number;
  name: string;
  displayName: string;
  provider: string;
  inputPrice: number;
  outputPrice: number;
  maxTokens: number | null;
  isActive: string;
  userApiId: number | null;
  owner: string;
}

interface AvailableModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface ImportModelRequest {
  apiId: number;
  models: {
    name: string;
    displayName: string;
    inputPrice: number;
    outputPrice: number;
    maxTokens: number | null;
    isActive: string;
    tags?: string[];
  }[];
}

// GET - Fetch user's models (both system and user-added)
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const models = await db
      .select({
        id: AIModels.id,
        name: AIModels.name,
        displayName: AIModels.displayName,
        provider: AIModels.provider,
        inputPrice: AIModels.inputPrice,
        outputPrice: AIModels.outputPrice,
        maxTokens: AIModels.maxTokens,
        isActive: AIModels.isActive,
        userApiId: AIModels.userApiId,
        owner: AIModels.owner,
        apiName: userAPIs.name,
        apiUrl: userAPIs.apiUrl,
      })
      .from(AIModels)
      .leftJoin(userAPIs, eq(AIModels.userApiId, userAPIs.id))
      .where(
        or(
          eq(AIModels.owner, "system"),
          eq(AIModels.owner, userId)
        )
      );

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching user models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

// PATCH - Update model settings
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, displayName, inputPrice, outputPrice, maxTokens, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Only allow updates to user-owned models
    const updateData: Partial<ModelData> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (inputPrice !== undefined) updateData.inputPrice = inputPrice;
    if (outputPrice !== undefined) updateData.outputPrice = outputPrice;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db
      .update(AIModels)
      .set(updateData)
      .where(
        and(
          eq(AIModels.id, id),
          eq(AIModels.owner, userId)
        )
      );

    return NextResponse.json({ message: "Model updated successfully" });
  } catch (error) {
    console.error("Error updating model:", error);
    return NextResponse.json(
      { error: "Failed to update model" },
      { status: 500 }
    );
  }
}

// POST - Import selected models from a specific API
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as ImportModelRequest;
    const { apiId, models } = body;

    if (!apiId || !models || !Array.isArray(models)) {
      return NextResponse.json(
        { error: "API ID and models array are required" },
        { status: 400 }
      );
    }

    // Verify the API belongs to the user
    const userApi = await db
      .select()
      .from(userAPIs)
      .where(
        and(
          eq(userAPIs.id, apiId),
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

    // Prepare model inserts
    const modelInserts = models.map(model => ({
      userApiId: apiId,
      name: model.name,
      displayName: model.displayName,
      provider: api.provider,
      owner: userId,
      inputPrice: model.inputPrice,
      outputPrice: model.outputPrice,
      maxTokens: model.maxTokens,
      isActive: model.isActive,
      tags: model.tags || null,
    }));

    // Insert the models
    const insertedModels = await db
      .insert(AIModels)
      .values(modelInserts)
      .returning();

    return NextResponse.json({
      message: `Successfully imported ${insertedModels.length} models`,
      models: insertedModels
    });
  } catch (error) {
    console.error("Error importing models:", error);
    return NextResponse.json(
      { error: "Failed to import models" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user model
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get("id");

    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Only allow deletion of user-owned models
    await db
      .delete(AIModels)
      .where(
        and(
          eq(AIModels.id, parseInt(modelId)),
          eq(AIModels.owner, userId)
        )
      );

    return NextResponse.json({ message: "Model deleted successfully" });
  } catch (error) {
    console.error("Error deleting model:", error);
    return NextResponse.json(
      { error: "Failed to delete model" },
      { status: 500 }
    );
  }
}
