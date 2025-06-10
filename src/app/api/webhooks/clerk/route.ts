// src/app/api/webhooks/clerk/route.ts
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers"; // Used for reading request headers in app directory
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { handleClerkWebhookEvent } from "./core"; // Import core webhook logic

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local",
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error: No Svix headers", { status: 400 });
  }

  // Get the body
  // Webhooks are typically JSON, so we parse it as such.
  const payload = await req.json();
  const body = JSON.stringify(payload); // Convert back to string for Svix verification

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error: Invalid signature", { status: 400 });
  }

  // Handle the event using the abstracted logic
  try {
    await handleClerkWebhookEvent(evt);
    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Failed to process webhook event:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}