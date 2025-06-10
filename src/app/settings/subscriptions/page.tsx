"use client"; // This component needs to be a Client Component

import { useUser, useClerk } from "@clerk/nextjs"; // For Clerk user data and sign out
import { useRouter } from "next/navigation"; // For App Router navigation
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast"; // Assuming you have react-hot-toast installed
import { ArrowLeftIcon, SunIcon } from "@heroicons/react/24/outline"; // For icons
import Link from "next/link";

// Define the shape of your subscription data (camelCase matching API response)
interface SubscriptionDetails {
  status: string;
  planId: string;
  standardCredits: number;
  maxStandardCredits: number;
  premiumCredits: number;
  maxPremiumCredits: number;
  resetDate: string; // From Drizzle, it's a Date object but JSON.stringify converts to string
}

export default function SubscriptionPage() {
  const { user, isLoaded, isSignedIn } = useUser(); // Get user details from Clerk
  const { signOut } = useClerk(); // For sign out
  const router = useRouter();

  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [activeTab, setActiveTab] = useState("Account"); // For tab navigation

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
      router.push("/"); // Or your sign-in page
    }
    // Fetch data when component mounts or user state changes
    if (isLoaded && isSignedIn) {
      void fetchSubscriptionData();
    }
  }, [isLoaded, isSignedIn, router]);

  // Handle Upgrade to Pro
  const handleUpgradeClick = async () => {
    if (!subscription) return;

    setIsUpgrading(true);
    try {
      const response = await fetch("/api/settings/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgradeToPro" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }

      toast.success("Successfully upgraded to Pro! 🎉");
      void fetchSubscriptionData(); // Re-fetch to update UI
    } catch (err) {
      console.error("Upgrade failed:", err);
      toast.error(err instanceof Error ? err.message : "An unknown error occurred during upgrade.");
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you absolutely sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await fetch("/api/settings/account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.statusText}`);
      }

      toast.success("Your account has been deleted.");
      // Redirect to home or sign-up page after deletion
      await signOut(); // Sign out from Clerk
      void router.push("/");
    } catch (err) {
      console.error("Failed to delete account:", err);
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred during account deletion.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Show loading while Clerk session loads
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-neutral-100">
        Loading user data...
      </div>
    );
  }

  // Show loading for data from API
  if (isLoading || !subscription) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-neutral-100">
        Loading subscription details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-red-400">
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
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      {/* Page Head (using Next.js App Router metadata for title) */}

      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2 text-sm text-neutral-400 hover:text-neutral-100">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Chat</span>
        </Link>
        <div className="flex items-center space-x-4">
          <button className="text-neutral-400 hover:text-neutral-100">
            <SunIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => void signOut()}
            className="text-neutral-400 hover:text-neutral-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 p-4 md:flex-row md:px-8">
        {/* Left Sidebar */}
        <aside className="w-full space-y-6 md:w-1/4 md:flex-shrink-0">
          {/* User Profile Card - uses Clerk's user object directly */}
          <div className="rounded-lg bg-neutral-800 p-6 shadow-md">
            <div className="mb-4 flex items-center space-x-4">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={user?.fullName || "User Avatar"}
                  className="h-16 w-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-bold">{user?.fullName || "User"}</h2>
                <p className="text-sm text-neutral-400">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            <span className="inline-block rounded-full bg-neutral-700 px-3 py-1 text-xs font-semibold text-neutral-300">
              {subscription.status === "pro" ? "Pro Plan" : "Free Plan"}
            </span>
          </div>

          {/* Message Usage Card */}
          <div className="rounded-lg bg-neutral-800 p-6 shadow-md">
            <h3 className="mb-2 text-lg font-semibold text-neutral-100">Message Usage</h3>
            <p className="text-sm text-neutral-400">
              Resets {resetsTomorrow} {resetDate}
            </p>
            <div className="mt-4">
              <p className="flex justify-between text-base">
                <span className="font-semibold">Standard</span>
                <span>
                  {subscription.standardCredits}/{subscription.maxStandardCredits}
                </span>
              </p>
              <div className="mt-1 h-2 rounded-full bg-neutral-700">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${
                      (subscription.standardCredits / subscription.maxStandardCredits) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                {subscription.maxStandardCredits - subscription.standardCredits} messages
                remaining
              </p>
              {subscription.maxPremiumCredits > 0 && (
                <>
                  <p className="mt-4 flex justify-between text-base">
                    <span className="font-semibold">Premium</span>
                    <span>
                      {subscription.premiumCredits}/{subscription.maxPremiumCredits}
                    </span>
                  </p>
                  <div className="mt-1 h-2 rounded-full bg-neutral-700">
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
          <div className="rounded-lg bg-neutral-800 p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-neutral-100">Keyboard Shortcuts</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-base text-neutral-300">
                <span>Search</span>
                <span className="flex space-x-1">
                  <kbd className="rounded bg-neutral-700 px-2 py-1 text-xs">Ctrl</kbd>
                  <kbd className="rounded bg-neutral-700 px-2 py-1 text-xs">K</kbd>
                </span>
              </li>
              <li className="flex items-center justify-between text-base text-neutral-300">
                <span>New Chat</span>
                <span className="flex space-x-1">
                  <kbd className="rounded bg-neutral-700 px-2 py-1 text-xs">Ctrl</kbd>
                  <kbd className="rounded bg-neutral-700 px-2 py-1 text-xs">Shift</kbd>
                  <kbd className="rounded bg-neutral-700 px-2 py-1 text-xs">O</kbd>
                </span>
              </li>
              <li className="flex items-center justify-between text-base text-neutral-300">
                <span>Toggle Sidebar</span>
                <span className="flex space-x-1">
                  <kbd className="rounded bg-neutral-700 px-2 py-1 text-xs">Ctrl</kbd>
                  <kbd className="rounded bg-neutral-700 px-2 py-1 text-xs">B</kbd>
                </span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow rounded-lg bg-neutral-900 p-0 md:p-6">
          {/* Tabs Navigation */}
          <nav className="mb-8 overflow-x-auto whitespace-nowrap border-b border-neutral-700 pb-2">
            {[
              "Account",
              "Customization",
              "History & Sync",
              "Models",
              "API Keys",
              "Attachments",
              "Contact Us",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mr-4 px-3 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? "rounded-md bg-neutral-800 text-neutral-100"
                    : "text-neutral-400 hover:text-neutral-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Account Tab Content (Subscription Upgrade) */}
          {activeTab === "Account" && (
            <div>
              <div className="mb-8 flex items-baseline justify-between">
                <h1 className="text-3xl font-bold text-neutral-100">Upgrade to Pro</h1>
                <span className="text-2xl font-bold text-neutral-100">$8/month</span>
              </div>

              {subscription.status === "pro" ? (
                <div className="rounded-lg bg-green-900/30 p-6 text-green-300">
                  <h2 className="mb-2 text-xl font-semibold">You are currently on the Pro Plan!</h2>
                  <p>Enjoy all the premium features and generous limits.</p>
                </div>
              ) : (
                <>
                  <div className="mb-8 grid gap-6 sm:grid-cols-3">
                    {/* Feature Card 1 */}
                    <div className="rounded-lg bg-neutral-800 p-6 shadow-md">
                      <div className="mb-3 text-red-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-7 w-7"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0v1.5a3.75 3.75 0 1 1-7.5 0V6.75ZM15.75 9.75a3 3 0 1 1 6 0V13.5a3 3 0 0 1-3 3h-2.25c-.721 0-1.42.148-2.078.42a5.72 5.72 0 0 1-1.042 1.042 5.721 5.721 0 0 1-1.042-1.042 3.75 3.75 0 0 0-2.078-.42H5.25a3 3 0 0 1-3-3V9.75a3 3 0 1 1 6 0v.75c0 .753-.375 1.442-.979 1.875A3.75 3.75 0 0 0 9.75 16.5h.75a3.75 3.75 0 0 0 3.75-3.75V9.75Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-neutral-100">
                        Access to All Models
                      </h3>
                      <p className="text-neutral-400">
                        Get access to our full suite of models including Claude, o3-mini-high,
                        and more!
                      </p>
                    </div>

                    {/* Feature Card 2 */}
                    <div className="rounded-lg bg-neutral-800 p-6 shadow-md">
                      <div className="mb-3 text-purple-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-7 w-7"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 .174.45l3.5 4a.75.75 0 0 0 1.061-.054.75.75 0 0 0-.054-1.06L13.5 11.25V6Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-neutral-100">
                        Generous Limits
                      </h3>
                      <p className="text-neutral-400">
                        Receive **1500 standard credits** per month, plus **100 premium credits***
                        per month.
                      </p>
                    </div>

                    {/* Feature Card 3 */}
                    <div className="rounded-lg bg-neutral-800 p-6 shadow-md">
                      <div className="mb-3 text-orange-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-7 w-7"
                        >
                          <path d="M11.644 14.707a.75.75 0 0 1-.584 1.134 6.702 6.702 0 0 0 3.756-3.756.75.75 0 0 1 1.134.584 8.202 8.202 0 0 1-4.81 4.81ZM9.75 10.5a.75.75 0 0 0 0 1.5 1.5 1.5 0 0 1 1.5 1.5.75.75 0 0 0 1.5 0 3 3 0 0 0-3-3ZM12 2.25a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM4.5 12a.75.75 0 0 1 .75-.75H6a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75ZM18 12a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM12 19.5a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75ZM6.002 6.002a.75.75 0 0 1 .458 1.004l-1.5 2.25a.75.75 0 1 1-1.248-.748l1.5-2.25a.75.75 0 0 1 .79-.256ZM17.25 6.002a.75.75 0 0 1 .79-.256l1.5 2.25a.75.75 0 1 1-1.248.748l-1.5-2.25a.75.75 0 0 1 .458-1.004ZM4.498 17.252a.75.75 0 0 1-.256.79l-2.25 1.5a.75.75 0 1 1-.748-1.248l2.25-1.5a.75.75 0 0 1 .79-.256ZM18.752 17.252a.75.75 0 0 1-.79-.256l-2.25 1.5a.75.75 0 1 1-.748 1.248l2.25-1.5a.75.75 0 0 1 .79-.256Z" />
                        </svg>
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-neutral-100">
                        Priority Support
                      </h3>
                      <p className="text-neutral-400">
                        Get faster responses and dedicated assistance from the T3 team whenever
                        you need help!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleUpgradeClick}
                    className="mb-6 w-full rounded-lg bg-fuchsia-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-fuchsia-700 disabled:opacity-50"
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? "Upgrading..." : "Upgrade Now"}
                  </button>

                  <p className="mb-12 text-sm text-neutral-500">
                    * Premium credits are used for GPT Image Gen, Claude Sonnet, and Grok 3.
                    Additional Premium credits can be purchased separately.
                  </p>
                </>
              )}

              {/* Danger Zone */}
              <div className="rounded-lg bg-neutral-800 p-6 shadow-md">
                <h2 className="mb-2 text-xl font-bold text-red-500">Danger Zone</h2>
                <p className="mb-4 text-neutral-400">
                  Permanently delete your account and all associated data.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="rounded-lg bg-red-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          )}

          {/* You would add other tab content here, e.g.,
          {activeTab === "Customization" && <div>Customization options...</div>}
          */}
        </main>
      </div>
    </div>
  );
}