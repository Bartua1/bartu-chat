import { eq } from "drizzle-orm";
import { db } from "./index";
import { users, themeEnum } from "./schema";

type Theme = typeof themeEnum.enumValues[number];

export async function createUserInDb(
  id: string,
  name: string,
  email: string | null,
  image: string | null,
  theme: Theme = "light"
) {
  try {
    // Split name into firstName and lastName
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") ?? "";

    await db.insert(users).values({
      id,
      email: email ?? "",
      firstName,
      lastName,
      profilePicture: image,
      theme,
    });
  } catch (error) {
    console.error("Error creating user in database:", error);
    throw error;
  }
}

export async function updateUserInDb(
  id: string,
  updates: {
    name?: string;
    email?: string | null;
    image?: string | null;
    theme?: Theme;
  }
) {
  try {
    const updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      profilePicture?: string | null;
      theme?: Theme;
    } = {};

    if (updates.name) {
      const nameParts = updates.name.trim().split(" ");
      updateData.firstName = nameParts[0] ?? "";
      updateData.lastName = nameParts.slice(1).join(" ") ?? "";
    }

    if (updates.email !== undefined) {
      updateData.email = updates.email ?? "";
    }

    if (updates.image !== undefined) {
      updateData.profilePicture = updates.image;
    }

    if (updates.theme) {
      updateData.theme = updates.theme;
    }

    await db.update(users).set(updateData).where(eq(users.id, id));
  } catch (error) {
    console.error("Error updating user in database:", error);
    throw error;
  }
}

export async function deleteUserFromDb(id: string) {
  try {
    await db.delete(users).where(eq(users.id, id));
  } catch (error) {
    console.error("Error deleting user from database:", error);
    throw error;
  }
}
