import { getAuth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { db } from "~/server/db";
import { AIModels } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { id } = await params;
    const modelId = id;
    if (!modelId) {
      return new NextResponse("Model ID is required", { status: 400 });
    }

    // Find the model and verify ownership
    const model = await db.query.AIModels.findFirst({
      where: eq(AIModels.id, parseInt(modelId)),
    });

    if (!model) {
      return new NextResponse("Model not found", { status: 404 });
    }

    // Check if user owns the model or it's a system model
    if (model.owner !== userId && model.owner !== "system") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const formattedModel = {
      id: model.id,
      name: model.name,
      displayName: model.displayName,
      provider: model.provider,
      inputPrice: model.inputPrice,
      outputPrice: model.outputPrice,
      owner: model.owner,
      tags: model.tags ?? [],
      maxTokens: typeof model.maxTokens === 'number' ? model.maxTokens : null,
      isActive: model.isActive === "true",
      userApiId: model.userApiId ?? null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    return NextResponse.json(formattedModel);
  } catch (error: unknown) {
    console.error("[USER_MODELS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { id } = await params;
    const modelId = id;
    if (!modelId) {
      return new NextResponse("Model ID is required", { status: 400 });
    }

    const body = await req.json() as { tags: string[] };
    const { tags } = body;

    if (!Array.isArray(tags)) {
      return new NextResponse("Tags must be an array", { status: 400 });
    }

    // Validate tags - only allow specific values
    const allowedTags = ["web", "image", "think", "docs"];
    const invalidTags = tags.filter(tag => !allowedTags.includes(tag));
    if (invalidTags.length > 0) {
      return new NextResponse(
        `Invalid tags: ${invalidTags.join(", ")}. Allowed tags: ${allowedTags.join(", ")}`,
        { status: 400 }
      );
    }

    // Find the model and verify ownership
    const model = await db.query.AIModels.findFirst({
      where: eq(AIModels.id, parseInt(modelId)),
    });

    if (!model) {
      return new NextResponse("Model not found", { status: 404 });
    }

    // Check if user owns the model or it's a system model
    if (model.owner !== userId && model.owner !== "system") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Update the model tags
    await db
      .update(AIModels)
      .set({
        tags: tags,
        updatedAt: new Date(),
      })
      .where(eq(AIModels.id, parseInt(modelId)));

    // Return the updated model data
    const updatedModel = await db.query.AIModels.findFirst({
      where: eq(AIModels.id, parseInt(modelId)),
    });

    if (!updatedModel) {
      return new NextResponse("Failed to retrieve updated model", { status: 500 });
    }

    const formattedModel = {
      id: updatedModel.id,
      name: updatedModel.name,
      displayName: updatedModel.displayName,
      provider: updatedModel.provider,
      inputPrice: updatedModel.inputPrice,
      outputPrice: updatedModel.outputPrice,
      owner: updatedModel.owner,
      tags: updatedModel.tags ?? [],
      maxTokens: typeof updatedModel.maxTokens === 'number' ? updatedModel.maxTokens : null,
      isActive: updatedModel.isActive === "true",
      userApiId: updatedModel.userApiId ?? null,
      createdAt: updatedModel.createdAt,
      updatedAt: updatedModel.updatedAt,
    };

    return NextResponse.json(formattedModel);
  } catch (error: unknown) {
    console.error("[USER_MODELS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
