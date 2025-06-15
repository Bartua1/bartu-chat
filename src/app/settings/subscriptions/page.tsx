"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { SettingsLayout } from "~/app/_components/settings-layout";

export default function SubscriptionPage() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Handle Upgrade to Pro
  const handleUpgradeClick = async () => {
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
      await signOut();
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

  return (
    <SettingsLayout>
      <div>
        <div className="mb-8 flex items-baseline justify-between">
          <h1 className="text-3xl font-bold text-foreground">Upgrade to Pro</h1>
          <span className="text-2xl font-bold text-foreground">$8/month</span>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          {/* Feature Card 1 */}
          <div className="rounded-lg bg-card border p-6 shadow-md">
            <div className="mb-3 text-red-500">
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
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">
              Access to All Models
            </h3>
            <p className="text-muted-foreground">
              Get access to our full suite of models including Claude, o3-mini-high,
              and more!
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="rounded-lg bg-card border p-6 shadow-md">
            <div className="mb-3 text-purple-500">
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
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">
              Generous Limits
            </h3>
            <p className="text-muted-foreground">
              Receive **1500 standard credits** per month, plus **100 premium credits***
              per month.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="rounded-lg bg-card border p-6 shadow-md">
            <div className="mb-3 text-orange-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
              >
                <path d="M11.644 14.707a.75.75 0 0 1-.584 1.134 6.702 6.702 0 0 0 3.756-3.756.75.75 0 0 1 1.134.584 8.202 8.202 0 0 1-4.81 4.81ZM9.75 10.5a.75.75 0 0 0 0 1.5 1.5 1.5 0 0 1 1.5 1.5.75.75 0 0 0 1.5 0 3 3 0 0 0-3-3ZM12 2.25a.75.75 0 0 1 .75.75V4.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM4.5 12a.75.75 0 0 1 .75-.75H6a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75ZM18 12a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM12 19.5a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75ZM6.002 6.002a.75.75 0 0 1 .458 1.004l-1.5 2.25a.75.75 0 1 1-1.248-.748l1.5-2.25a.75.75 0 0 1 .79-.256ZM17.25 6.002a.75.75 0 0 1 .79-.256l1.5 2.25a.75.75 0 1 1-1.248.748l-1.5-2.25a.75.75 0 0 1 .458-1.004ZM4.498 17.252a.75.75 0 0 1-.256.79l-2.25 1.5a.75.75 0 1 1-.748-1.248l2.25-1.5a.75.75 0 0 1 .79-.256ZM18.752 17.252a.75.75 0 0 1-.79-.256l-2.25 1.5a.75.75 0 1 1-.748 1.248l2.25-1.5a.75.75 0 0 1 .79-.256Z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">
              Priority Support
            </h3>
            <p className="text-muted-foreground">
              Get faster responses and dedicated assistance from the T3 team whenever
              you need help!
            </p>
          </div>
        </div>

        <button
          onClick={handleUpgradeClick}
          className="mb-6 w-full rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          disabled={isUpgrading}
        >
          {isUpgrading ? "Upgrading..." : "Upgrade Now"}
        </button>

        <p className="mb-12 text-sm text-muted-foreground">
          * Premium credits are used for GPT Image Gen, Claude Sonnet, and Grok 3.
          Additional Premium credits can be purchased separately.
        </p>

        {/* Danger Zone */}
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-6 shadow-md">
          <h2 className="mb-2 text-xl font-bold text-destructive">Danger Zone</h2>
          <p className="mb-4 text-muted-foreground">
            Permanently delete your account and all associated data.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="rounded-lg bg-destructive px-6 py-3 text-lg font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-50"
            disabled={isDeletingAccount}
          >
            {isDeletingAccount ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </SettingsLayout>
  );
}
