// src/components/ThemeSwitcher.tsx
"use client"; // Important: Mark as client component

import React from "react";
import { useTheme } from "~/app/_components/theme-context";
import { themeEnum } from "~/server/db/schema"; // Import for types

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme(themeEnum.enumValues[0])} // "light"
        className={`rounded px-4 py-2 ${
          theme === themeEnum.enumValues[0]
            ? "bg-primary text-white"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme(themeEnum.enumValues[1])} // "dark"
        className={`rounded px-4 py-2 ${
          theme === themeEnum.enumValues[1]
            ? "bg-primary text-white"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        Dark
      </button>
      <button
        onClick={() => setTheme(themeEnum.enumValues[2])} // "boring"
        className={`rounded px-4 py-2 ${
          theme === themeEnum.enumValues[2]
            ? "bg-primary text-white"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        Boring
      </button>
    </div>
  );
};