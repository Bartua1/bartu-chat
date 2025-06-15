"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SettingsTopNav } from "./settings-topnav";

interface SubscriptionDetails {
  status: string;
  planId: string;
  standardCredits: number;
  maxStandardCredits: number;
  premiumCredits: number;
  maxPremiumCredits: number;
  resetDate: string;
}

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch subscription data
  const fetchSubscriptionData = async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/subscription");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }
      const result: SubscriptionDetails = (await response.json()) as SubscriptionDetails;
      setSubscription(result);
    } catch (err) {
      console.error("Failed to fetch subscription data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not signed in after Clerk loads
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
    // Fetch data when component mounts or user state changes
    if (isLoaded && isSignedIn) {
      void fetchSubscriptionData();
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while Clerk session loads
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Loading user data...
      </div>
    );
  }

  // Show loading for data from API
  if (isLoading || !subscription) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Loading subscription details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-destructive">
        Error: {error}
      </div>
    );
  }

  // Format the reset date for display
  const resetDate = subscription.resetDate
    ? new Date(subscription.resetDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A";
  const resetsTomorrow = subscription.resetDate
    ? new Date(subscription.resetDate).toDateString() ===
      new Date(new Date().setDate(new Date().getDate() + 1)).toDateString()
      ? "tomorrow at"
      : `on ${new Date(subscription.resetDate).toLocaleDateString()} at`
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SettingsTopNav />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 p-4 md:flex-row md:px-8">
        {/* Left Sidebar */}
        <aside className="w-full space-y-6 md:w-1/4 md:flex-shrink-0">
          {/* User Profile Card */}
          <div className="rounded-lg bg-card border p-6 shadow-md">
            <div className="mb-4 flex items-center space-x-4">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={user?.fullName || "User Avatar"}
                  className="h-16 w-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-card-foreground">{user?.fullName || "User"}</h2>
                <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {subscription.status === "pro" ? "Pro Plan" : "Free Plan"}
            </span>
          </div>

          {/* Message Usage Card */}
          <div className="rounded-lg bg-card border p-6 shadow-md">
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">Message Usage</h3>
            <p className="text-sm text-muted-foreground">
              Resets {resetsTomorrow} {resetDate}
            </p>
            <div className="mt-4">
              <p className="flex justify-between text-base text-card-foreground">
                <span className="font-semibold">Standard</span>
                <span>
                  {subscription.standardCredits}/{subscription.maxStandardCredits}
                </span>
              </p>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${
                      (subscription.standardCredits / subscription.maxStandardCredits) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {subscription.maxStandardCredits - subscription.standardCredits} messages
                remaining
              </p>
              {subscription.maxPremiumCredits > 0 && (
                <>
                  <p className="mt-4 flex justify-between text-base text-card-foreground">
                    <span className="font-semibold">Premium</span>
                    <span>
                      {subscription.premiumCredits}/{subscription.maxPremiumCredits}
                    </span>
                  </p>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{
                        width: `${
                          (subscription.premiumCredits / subscription.maxPremiumCredits) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Card */}
          <div className="rounded-lg bg-card border p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">Keyboard Shortcuts</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-base text-card-foreground">
                <span>Search</span>
                <span className="flex space-x-1">
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl</kbd>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">K</kbd>
                </span>
              </li>
              <li className="flex items-center justify-between text-base text-card-foreground">
                <span>New Chat</span>
                <span className="flex space-x-1">
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl</kbd>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Shift</kbd>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">O</kbd>
                </span>
              </li>
              <li className="flex items-center justify-between text-base text-card-foreground">
                <span>Toggle Sidebar</span>
                <span className="flex space-x-1">
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">Ctrl</kbd>
                  <kbd className="rounded bg-muted px-2 py-1 text-xs">B</kbd>
                </span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow rounded-lg bg-background p-0 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
