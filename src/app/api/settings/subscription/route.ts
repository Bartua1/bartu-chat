// src/app/api/settings/subscription/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { Subscriptions } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getAuth  } from "@clerk/nextjs/server";

// Zod schema for input validation on PATCH requests
const upgradeSchema = z.object({
  action: z.literal("upgradeToPro"),
});

export async function GET(request: Request) {
  const { userId } = getAuth(request);

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let subscription = await db.query.Subscriptions.findFirst({
      where: eq(Subscriptions.userId, userId),
    });

    // If no subscription exists, create a default 'free' one for them
    if (!subscription) {
      const tomorrowTwoAM = new Date();
      tomorrowTwoAM.setDate(tomorrowTwoAM.getDate() + 1);
      tomorrowTwoAM.setHours(2, 0, 0, 0);

      const newSubscription = {
        userId: userId,
        status: "free",
        planId: "standard",
        standardCredits: 20,
        maxStandardCredits: 20,
        premiumCredits: 0,
        maxPremiumCredits: 0,
        resetDate: tomorrowTwoAM,
      };

      const [insertedSubscription] = await db.insert(Subscriptions).values(newSubscription).returning();
      subscription = insertedSubscription;

      if (!subscription) {
        throw new Error("Failed to create default subscription.");
      }
    }

    const responseData = {
      status: subscription.status,
      planId: subscription.planId,
      standardCredits: subscription.standardCredits,
      maxStandardCredits: subscription.maxStandardCredits,
      premiumCredits: subscription.premiumCredits,
      maxPremiumCredits: subscription.maxPremiumCredits,
      resetDate: subscription.resetDate,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[SUBSCRIPTION_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedBody = upgradeSchema.parse(body);

    if (validatedBody.action === "upgradeToPro") {
      let subscription = await db.query.Subscriptions.findFirst({
        where: eq(Subscriptions.userId, userId),
      });

      // If no subscription exists, create a default 'free' one first.
      // This ensures an entry exists before attempting to upgrade it.
      if (!subscription) {
        const tomorrowTwoAM = new Date();
        tomorrowTwoAM.setDate(tomorrowTwoAM.getDate() + 1);
        tomorrowTwoAM.setHours(2, 0, 0, 0);

        const newSubscriptionData = {
          userId: userId,
          status: "free",
          planId: "standard",
          standardCredits: 20,
          maxStandardCredits: 20,
          premiumCredits: 0,
          maxPremiumCredits: 0,
          resetDate: tomorrowTwoAM,
        };

        const [insertedSub] = await db.insert(Subscriptions).values(newSubscriptionData).returning();
        subscription = insertedSub; // Assign the newly created free subscription

        if (!subscription) {
          throw new Error("Failed to create default free subscription during upgrade attempt.");
        }
      }

      // Now that we are certain a subscription record exists (either existing or newly created free),
      // we can proceed with upgrading it to Pro.
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      nextMonthDate.setHours(2, 0, 0, 0); // Example: reset at 2 AM next month

      const [updatedSubscription] = await db.update(Subscriptions)
        .set({
          status: "pro",
          planId: "pro",
          standardCredits: 1500,
          maxStandardCredits: 1500,
          premiumCredits: 100,
          maxPremiumCredits: 100,
          resetDate: nextMonthDate,
          updatedAt: new Date(), // Manually update updatedAt if not using $onUpdate() in insert
        })
        .where(eq(Subscriptions.userId, userId))
        .returning();

      if (!updatedSubscription) {
        // This case should ideally not happen if the preceding `if (!subscription)` block
        // successfully ensured a subscription was created or found. This is a defensive check.
        throw new Error("Failed to update subscription to Pro after ensuring its existence.");
      }

      return NextResponse.json(updatedSubscription);
    } else {
      return new NextResponse("Invalid action", { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    console.error("[SUBSCRIPTION_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}