import { NextRequest, NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the theme from the request body
    const { theme } = await request.json() as { theme: string };

    if (!theme || !["light", "dark", "boring"].includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme. Must be 'light', 'dark', or 'boring'" },
        { status: 400 }
      );
    }

    try {
      // Update the user's theme in the database
      await db
        .update(users)
        .set({ theme: theme as "light" | "dark" | "boring" })
        .where(eq(users.id, userId));

      // Also update Clerk's publicMetadata for immediate access
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          theme: theme,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: "Theme updated successfully",
        theme: theme 
      });

    } catch (dbError) {
      console.error("Database error:", dbError);
      // If database update fails, still try to update Clerk
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: {
            theme: theme,
          },
        });
        
        return NextResponse.json({ 
          success: true, 
          message: "Theme updated in Clerk (database update failed)",
          theme: theme 
        });
      } catch (clerkError) {
        console.error("Clerk update error:", clerkError);
        return NextResponse.json(
          { error: "Failed to update theme" },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error("Theme update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
