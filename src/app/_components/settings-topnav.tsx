"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "./theme-switcher";
import { useClerk } from "@clerk/nextjs";

const tabs = [
  { name: "Account", href: "/settings/subscriptions" },
  { name: "API Keys", href: "/settings/api-keys" },
  { name: "Models", href: "/settings/models" },
  { name: "Customization", href: "/settings/customization" },
  { name: "History & Sync", href: "/settings/history" },
  { name: "Attachments", href: "/settings/attachments" },
  { name: "Contact Us", href: "/settings/contact" },
];

export function SettingsTopNav() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <>
      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 md:px-8 border-b border-border">
        <Link href="/" className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Chat</span>
        </Link>
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          <button
            onClick={() => void signOut()}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex overflow-x-auto whitespace-nowrap pb-0">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`mr-4 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  pathname === tab.href
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
