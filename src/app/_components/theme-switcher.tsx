"use client";

import React from "react";
import { useTheme } from "~/app/_components/theme-context";
import { themeEnum } from "~/server/db/schema";
import { Sun, Moon, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "boring":
        return <Palette className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeValue: string) => {
    switch (themeValue) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "boring":
        return "Boring";
      default:
        return "Light";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-9 px-0">
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeEnum.enumValues.map((themeValue) => (
          <DropdownMenuItem
            key={themeValue}
            onClick={() => setTheme(themeValue)}
            className="flex items-center gap-2"
          >
            {themeValue === "light" && <Sun className="h-4 w-4" />}
            {themeValue === "dark" && <Moon className="h-4 w-4" />}
            {themeValue === "boring" && <Palette className="h-4 w-4" />}
            <span>{getThemeLabel(themeValue)}</span>
            {theme === themeValue && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
