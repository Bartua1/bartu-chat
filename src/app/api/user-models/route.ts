import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { db } from "~/server/db";
import { users, AIModels, userFavoriteModels, userAPIs } from "~/server/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      // Create a new user if one doesn't exist
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        if (!clerkUser) {
          throw new Error('Failed to fetch user info from Clerk');
        }
        await db.insert(users).values({
          id: userId,
          email: clerkUser.emailAddresses?.[0]?.emailAddress ?? '',
          firstName: clerkUser.firstName ?? '',
          lastName: clerkUser.lastName ?? '',
        });
        const newUser = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });
        if (!newUser) {
          return new NextResponse("Failed to create user", { status: 500 });
        }
        user = newUser;
      } catch (createUserError: unknown) {
        const errorMessage = createUserError instanceof Error ? createUserError.message : "Unknown error";
        console.error("[USER_MODELS_GET_CREATE_USER]", errorMessage);
        return new NextResponse("Failed to create user", { status: 500 });
      }
    }

    // Fetch all active models that are either system models or belong to this user
    const models = await db
      .select()
      .from(AIModels)
      .where(
        and(
          eq(AIModels.isActive, "true"),
          or(
            eq(AIModels.owner, "system"),
            eq(AIModels.owner, userId)
          )
        )
      );

    // Fetch user's favorite model IDs from the user_favorite_models table
    const favoriteModelIdsResult = await db.select({ modelId: userFavoriteModels.modelId }).from(userFavoriteModels).where(eq(userFavoriteModels.userId, userId));
    const favoriteModelIds = favoriteModelIdsResult.map(item => item.modelId);

    // Format models for frontend consumption
    const formattedModels = models.map(model => ({
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
      // Add favorite status based on user's favoriteModels array
      isFavorite: favoriteModelIds.includes(model.id),
    }));

    return NextResponse.json(formattedModels);
  } catch (error: unknown) {
    console.error("[USER_MODELS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let userId: string | null | undefined;
  try {
    const { userId: authUserId } = getAuth(req);
    userId = authUserId;
    
    const body: unknown = await req.json();

    if (!userId) {
      console.log("[USER_MODELS_POST] No userId found in auth");
      return new NextResponse("Unauthorized", { status: 403 });
    }

    if (typeof body === 'object' && body !== null && 'apiId' in body && 'models' in body) {
      console.log("[USER_MODELS_POST] Processing bulk import");
      const { apiId, models } = body as { apiId: number; models: Array<{
        name: string;
        displayName: string;
        provider: string;
        inputPrice: number;
        outputPrice: number;
        maxTokens: number | null;
        isActive: string;
      }> };

      if (typeof apiId !== 'number' || !Array.isArray(models)) {
        return new NextResponse("Invalid import data", { status: 400 });
      }

      if (models.length === 0) {
        return new NextResponse("No models to import", { status: 400 });
      }

      try {
        // Verify the API belongs to the user
        const userAPI = await db.query.userAPIs.findFirst({
          where: and(eq(userAPIs.id, apiId), eq(userAPIs.userId, userId)),
        });

        if (!userAPI) {
          return new NextResponse("API not found", { status: 404 });
        }

        // Prepare models for insertion
        const modelsToInsert = models.map(model => ({
          userApiId: apiId,
          name: model.name,
          displayName: model.displayName,
          provider: model.provider,
          inputPrice: model.inputPrice,
          outputPrice: model.outputPrice,
          owner: userId as string, // We know userId is string at this point due to check above
          maxTokens: model.maxTokens,
          isActive: model.isActive,
        }));

        // Insert models into database
        await db.insert(AIModels).values(modelsToInsert);

        return NextResponse.json({ 
          message: `Successfully imported ${models.length} model${models.length > 1 ? 's' : ''}`,
          count: models.length 
        });
      } catch (insertError: unknown) {
        console.error("[USER_MODELS_POST_IMPORT]", insertError);
        return new NextResponse("Failed to import models", { status: 500 });
      }
    }

    if (typeof body === 'object' && body !== null && 'modelId' in body) {
      // ModelId comes from frontend as either string or number (the AI model's ID field)
      const { modelId } = body as { modelId: string | number };
      
      // Convert to number for database lookup
      const modelIdNum = typeof modelId === 'string' ? parseInt(modelId) : modelId;
      if (isNaN(modelIdNum)) {
        console.log("[USER_MODELS_POST] modelId is not a valid number");
        return new NextResponse("Invalid modelId", { status: 400 });
      }

      // Verify the model exists and is accessible to the user
      const model = await db.query.AIModels.findFirst({
        where: and(
          eq(AIModels.id, modelIdNum),
          or(
            eq(AIModels.owner, "system"),
            eq(AIModels.owner, userId)
          )
        ),
      });

      if (!model) {
        console.log("[USER_MODELS_POST] Model not found or not accessible");
        return new NextResponse("Model not found", { status: 404 });
      }

      // Check if the user already has this model as a favorite
      const existingFavorite = await db.query.userFavoriteModels.findFirst({
        where: and(eq(userFavoriteModels.userId, userId), eq(userFavoriteModels.modelId, modelIdNum)),
      });

      if (existingFavorite) {
        // If it's a favorite, remove it
        await db.delete(userFavoriteModels).where(and(eq(userFavoriteModels.userId, userId), eq(userFavoriteModels.modelId, modelIdNum)));
      } else {
        // If it's not a favorite, add it
        await db.insert(userFavoriteModels).values({ userId: userId, modelId: modelIdNum });
      }

      // Fetch the updated list of favorite model IDs
      const favoriteModelIdsResult = await db.select({ modelId: userFavoriteModels.modelId }).from(userFavoriteModels).where(eq(userFavoriteModels.userId, userId));
      const favoriteModelIds = favoriteModelIdsResult.map(item => item.modelId);

      return NextResponse.json({ favoriteModels: favoriteModelIds });
    }

    // Invalid request body
    console.log("[USER_MODELS_POST] ERROR: Invalid request body structure");
    console.log("[USER_MODELS_POST] Expected either { apiId, models } for import or { modelId } for favorite toggle");
    return new NextResponse("Invalid request body", { status: 400 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[USER_MODELS_POST] CATCH ERROR:", errorMessage);
    console.error("[USER_MODELS_POST] ERROR STACK:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("[USER_MODELS_POST] userId at error:", userId);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body: unknown = await req.json();
    if (typeof body !== 'object' || body === null || !('modelId' in body)) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { modelId } = body as { modelId: string };
    if (typeof modelId !== 'string') {
      return new NextResponse("Invalid modelId", { status: 400 });
    }

    // Check if the model exists and belongs to the user
    const existingModel = await db.query.AIModels.findFirst({
      where: and(eq(AIModels.id, parseInt(modelId)), eq(AIModels.owner, userId)),
    });

    if (!existingModel) {
      return new NextResponse("Model not found or does not belong to the user", { status: 404 });
    }

    // Delete the model
    await db.delete(AIModels).where(eq(AIModels.id, parseInt(modelId)));

    return NextResponse.json({ message: "Model deleted successfully" });
  } catch (error: unknown) {
    console.error("[USER_MODELS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
