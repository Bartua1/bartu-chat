// src/app/api/settings/account/route.ts
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server"; // Import clerkClient for user deletion
import { db } from "~/server/db"; // Import your Drizzle client
import { Subscriptions } from "~/server/db/schema"; // Import your Drizzle schema table
import { eq } from "drizzle-orm"; // For Drizzle query conditions

export async function DELETE(request: Request) {
  const { userId } = auth(); // Get Clerk userId

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await db.delete(Subscriptions).where(eq(Subscriptions.userId, userId));
    await clerkClient.users.deleteUser(userId);

    return new NextResponse("Account and associated data deleted successfully", { status: 200 });
  } catch (error) {
    console.error("[ACCOUNT_DELETE_ERROR]", error);
    return new NextResponse("Failed to delete account. Please try again.", { status: 500 });
  }
}