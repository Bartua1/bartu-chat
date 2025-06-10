// src/app/_components/sidenav.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
// Import icons for sidebar toggle, search, new chat (from image)
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  Bars3BottomLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
// CORRECTED IMPORT PATH for useSidebar
import { useSidebar } from "~/app/_components/sidebar"; // Assuming sidebar.tsx is directly in _components

// Define the shape of your subscription data (matching API response)
interface SubscriptionDetails {
  status: string;
  planId: string;
  standardCredits: number;
  maxStandardCredits: number;
  premiumCredits: number;
  maxPremiumCredits: number;
  resetDate: string;
}

export function SideNav() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isCompact, toggleCompact } = useSidebar(); // Only extract what's used from useSidebar

  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [errorSubscription, setErrorSubscription] = useState<string | null>(null);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!isSignedIn) {
        setIsLoadingSubscription(false);
        return;
      }

      setIsLoadingSubscription(true);
      setErrorSubscription(null);
      try {
        const response = await fetch("/api/settings/subscription");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.statusText}`);
        }
        const result: SubscriptionDetails = (await response.json()) as SubscriptionDetails;
        setSubscription(result);
      } catch (err) {
        console.error("Failed to fetch subscription data in SideNav:", err);
        setErrorSubscription(err instanceof Error ? err.message : "Failed to load subscription.");
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    void fetchSubscriptionData();
  }, [isSignedIn]);

  const handleToggleCompact = () => {
    toggleCompact();
  };

  const navItemClass = `flex items-center rounded-md p-2 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 ${
    isCompact ? 'justify-center' : 'space-x-3'
  }`;
  const iconClass = `h-5 w-5 ${isCompact ? '' : ''}`;
  const sidebarWidthClass = isCompact ? 'w-16' : 'w-64';

  if (!isLoaded || !isSignedIn || isLoadingSubscription) {
    return (
      <aside className={`fixed left-0 top-0 z-20 hidden h-full border-r border-neutral-700 bg-neutral-900 p-4 md:block ${sidebarWidthClass}`}>
        <div className="flex h-full flex-col justify-between">
          <div className="flex-grow">
            <h1 className={`mb-8 text-2xl font-bold text-neutral-100 ${isCompact ? 'hidden' : ''}`}>Bartu Chat</h1>
            <div className="text-neutral-400">Loading...</div>
          </div>
          <div className={`flex items-center ${isCompact ? 'justify-center' : 'space-x-4'}`}>
            <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-700"></div>
            {!isCompact && (
              <div className="flex-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-700"></div>
                <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-neutral-700"></div>
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  if (errorSubscription) {
    return (
      <aside className={`fixed left-0 top-0 z-20 hidden h-full border-r border-neutral-700 bg-neutral-900 p-4 md:block ${sidebarWidthClass}`}>
        <div className="flex h-full flex-col justify-between">
          <div className="flex-grow">
            <h1 className={`mb-8 text-2xl font-bold text-neutral-100 ${isCompact ? 'hidden' : ''}`}>Bartu Chat</h1>
            <div className="text-red-400">Error: {errorSubscription}</div>
          </div>
        </div>
      </aside>
    );
  }

  const currentPlan = subscription?.status === "pro" ? "Pro Plan" : "Free Plan";

  return (
    <aside
      // Removed isOpen condition here, as layout-content.tsx controls if SideNav is mounted at all.
      // Now SideNav always expects to be mounted when it should be visible.
      className={`fixed left-0 top-0 z-20 hidden h-full border-r border-neutral-700 bg-neutral-900 p-4 md:block ${sidebarWidthClass} transition-all duration-300`}
    >
      <div className="flex h-full flex-col justify-between">
        {/* Top Section */}
        <div>
          <h1 className={`mb-8 text-2xl font-bold text-neutral-100 ${isCompact ? 'hidden' : ''}`}>Bartu Chat</h1>

          {isCompact && (
            <div className="mb-4 flex flex-col items-center space-y-4">
              <button
                onClick={handleToggleCompact}
                className="group flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-700 text-neutral-300 transition-colors hover:bg-neutral-600 hover:text-neutral-100"
                title="Expand Sidebar"
              >
                <Bars3BottomLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => console.log('Search clicked')}
                className="group flex h-10 w-10 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
                title="Search"
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => console.log('New Chat clicked')}
                className="group flex h-10 w-10 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
                title="New Chat"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </div>
          )}

          {!isCompact && (
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link href="/chat" className={navItemClass}>
                    <ChatBubbleLeftRightIcon className={iconClass} />
                    <span>Chats</span>
                  </Link>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {/* Bottom Section */}
        <div className="mb-4 space-y-4">
          {!isCompact && (
            <div className="flex items-center justify-between rounded-md p-2 hover:bg-neutral-800">
              <div className="flex items-center space-x-3">
                {user?.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt={user?.fullName || "User Avatar"}
                    className="h-9 w-9 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-neutral-100">{user?.fullName || "User"}</p>
                  <span className="text-xs text-neutral-400">
                    {currentPlan}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isCompact && (
            <button
              onClick={handleToggleCompact}
              className="flex w-full items-center justify-center rounded-md p-2 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
              title="Compact Sidebar"
            >
              <Bars3BottomLeftIcon className="h-5 w-5 rotate-180" />
            </button>
          )}

          {isCompact && (
             <Link
              href="/settings/subscriptions"
              className="group flex flex-col items-center space-y-1 rounded-md p-2 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
              title={`${user?.fullName || "User"}'s Plan: ${currentPlan}`}
            >
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={user?.fullName || "User Avatar"}
                  className="h-9 w-9 rounded-full"
                />
              )}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}