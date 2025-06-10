// src/server/webhooks/clerk.ts
import { WebhookEvent } from "@clerk/nextjs/server";
import {
  createUserInDb,
  updateUserInDb,
  deleteUserFromDb,
} from "~/server/db/actions";
import { themeEnum } from "~/server/db/schema";

type Theme = typeof themeEnum.enumValues[number];

export async function handleClerkWebhookEvent(evt: WebhookEvent) {
  const eventType = evt.type;

  switch (eventType) {
    case "user.created":
      const userCreated = evt.data;
      await createUserInDb(
        userCreated.id,
        userCreated.first_name +
          (userCreated.last_name ? ` ${userCreated.last_name}` : ""),
        userCreated.email_addresses[0]?.email_address || null,
        userCreated.image_url || null,
        // If you store initial theme in Clerk public_metadata, you can read it:
        (userCreated.public_metadata.theme as Theme) || "light",
      );
      console.log(`User ${userCreated.id} created in Drizzle DB`);
      break;
    case "user.updated":
      const userUpdated = evt.data;
      // You can sync other fields if needed, like name, email, image etc.
      // Theme updates via Clerk public_metadata (if allowed from Clerk's UI)
      // would also be synced here.
      await updateUserInDb(userUpdated.id, {
        name:
          userUpdated.first_name +
          (userUpdated.last_name ? ` ${userUpdated.last_name}` : ""),
        email: userUpdated.email_addresses[0]?.email_address || null,
        image: userUpdated.image_url || null,
        // theme: userUpdated.public_metadata.theme as Theme || undefined, // Only update if present
      });
      console.log(`User ${userUpdated.id} updated in Drizzle DB`);
      break;
    case "user.deleted":
      const userDeleted = evt.data;
      if (userDeleted.id) {
        await deleteUserFromDb(userDeleted.id);
        console.log(`User ${userDeleted.id} deleted from Drizzle DB`);
      }
      break;
    default:
      console.warn(`Unhandled webhook event type: ${eventType}`);
  }
}