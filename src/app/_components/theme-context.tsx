"use client"; // Important: Mark as client component

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { themeEnum } from "~/server/db/schema"; // Import the Drizzle enum

// Use the Drizzle enum types for better type safety
type Theme = typeof themeEnum.enumValues[number];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: "light" | "dark" | "system";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { userId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const [theme, setThemeState] = useState<Theme>(() => {
    // Initial state from localStorage (for immediate display)
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme && themeEnum.enumValues.includes(storedTheme as Theme)) {
        return storedTheme as Theme;
      }
    }
    return "light"; // Default to light if no localStorage value
  });

  const [systemTheme, setSystemTheme] = useState<"light" | "dark" | "system">(
    "system",
  );

  // Effect to listen for system theme changes (prefers-color-scheme)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    setSystemTheme(mediaQuery.matches ? "dark" : "light"); // Set initial system theme

    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  // Function to apply theme class and save preference
  const applyTheme = useCallback(
    async (newTheme: Theme, isInitialLoad = false) => {
      setThemeState(newTheme); // Update React state

      // Apply class to HTML element (removes existing theme classes first)
      document.documentElement.classList.remove(...themeEnum.enumValues);
      document.documentElement.classList.add(newTheme);

      localStorage.setItem("theme", newTheme); // Save to localStorage

      // Save to database/Clerk if user is authenticated and it's not the initial load
      if (userId && userLoaded && authLoaded && !isInitialLoad) {
        try {
          await fetch("/api/user/theme", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: newTheme }),
          });
        } catch (error) {
          console.error("Failed to save theme to DB/Clerk:", error);
          // Optional: handle error (e.g., revert theme, show toast)
        }
      }
    },
    [userId, userLoaded, authLoaded], // Dependencies for useCallback
  );

  // Initial load effect: Prioritize Clerk's publicMetadata for authenticated users
  useEffect(() => {
    if (!userLoaded || !authLoaded) return; // Wait for Clerk hooks to load

    let initialTheme: Theme = "light"; // Default theme

    if (userId && user?.publicMetadata?.theme) {
      // User is logged in and Clerk has a theme saved in publicMetadata
      // Ensure the theme from publicMetadata is a valid enum value
      const clerkTheme = user.publicMetadata.theme as string;
      if (themeEnum.enumValues.includes(clerkTheme as Theme)) {
        initialTheme = clerkTheme as Theme;
      } else {
        console.warn(
          `Clerk publicMetadata theme '${clerkTheme}' is invalid. Defaulting to 'light'.`,
        );
      }
    } else {
      // Not logged in or no Clerk metadata theme, check localStorage
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme && themeEnum.enumValues.includes(storedTheme as Theme)) {
        initialTheme = storedTheme as Theme;
      }
    }
    // Apply the determined initial theme, marking as initial load to prevent immediate DB write
    applyTheme(initialTheme, true);
  }, [userId, userLoaded, authLoaded, user?.publicMetadata?.theme, applyTheme]); // Dependencies for useEffect

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};