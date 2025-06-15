// src/app/_components/sidenav.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { ThemeSwitcher } from "~/app/_components/theme-switcher";

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

// Define the shape of chat data
interface Chat {
  id: number;
  name: string;
  url: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date | null;
}

export function SideNav() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isCompact, toggleCompact } = useSidebar(); // Only extract what's used from useSidebar
  const router = useRouter();

  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [errorSubscription, setErrorSubscription] = useState<string | null>(null);
  
  // Chat-related state
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

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

  // Fetch user chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!isSignedIn || !user?.id) {
        setIsLoadingChats(false);
        return;
      }

      setIsLoadingChats(true);
      setErrorChats(null);
      try {
        const response = await fetch(`/api/users/${user.id}/chats`);
        if (!response.ok) {
          const errorData = await response.json() as { error?: string };
          throw new Error(errorData.error || `Error: ${response.statusText}`);
        }
        const result = await response.json() as Chat[];
        // Convert createdAt strings to Date objects
        const chatsWithDates = result.map(chat => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : null,
        }));
        setChats(chatsWithDates);
      } catch (err) {
        console.error("Failed to fetch chats in SideNav:", err);
        setErrorChats(err instanceof Error ? err.message : "Failed to load chats.");
      } finally {
        setIsLoadingChats(false);
      }
    };

    void fetchChats();
  }, [isSignedIn, user?.id]);

  // Handle new chat creation
  const handleNewChat = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/uploadchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Chat',
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create new chat');
      }

      const newChatArray = await response.json() as Chat[];
      const newChat = newChatArray[0];
      if (newChat) {
        // Add the new chat to our local state
        setChats(prev => [newChat, ...prev]);
        router.push(`/${newChat.url}`);
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleCompact = () => {
    toggleCompact();
  };

  const navItemClass = `flex items-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
    isCompact ? 'justify-center' : 'space-x-3'
  }`;
  const iconClass = `h-5 w-5 ${isCompact ? '' : ''}`;
  const sidebarWidthClass = isCompact ? 'w-16' : 'w-64';

  if (!isLoaded || !isSignedIn || isLoadingSubscription || isLoadingChats) {
    return (
      <aside className={`fixed left-0 top-0 z-20 hidden h-full border-r border-sidebar-border bg-sidebar-background p-4 md:block ${sidebarWidthClass}`}>
        <div className="flex h-full flex-col justify-between">
          <div className="flex-grow">
            <h1 className={`mb-8 text-2xl font-bold text-sidebar-foreground ${isCompact ? 'hidden' : ''}`}>Bartu Chat</h1>
            <div className="text-muted-foreground">Loading...</div>
          </div>
          <div className={`flex items-center ${isCompact ? 'justify-center' : 'space-x-4'}`}>
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
            {!isCompact && (
              <div className="flex-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
                <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-muted"></div>
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  if (errorSubscription) {
    return (
      <aside className={`fixed left-0 top-0 z-20 hidden h-full border-r border-sidebar-border bg-sidebar-background p-4 md:block ${sidebarWidthClass}`}>
        <div className="flex h-full flex-col justify-between">
          <div className="flex-grow">
            <h1 className={`mb-8 text-2xl font-bold text-sidebar-foreground ${isCompact ? 'hidden' : ''}`}>Bartu Chat</h1>
            <div className="text-destructive">Error: {errorSubscription}</div>
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
      className={`fixed left-0 top-0 z-20 hidden h-full border-r border-sidebar-border bg-sidebar-background p-4 md:block ${sidebarWidthClass} transition-all duration-300`}
    >
      <div className="flex h-full flex-col">
        {/* Header with Title and Compact Toggle */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-2xl font-bold text-sidebar-foreground ${isCompact ? 'hidden' : ''}`}>Bartu Chat</h1>
          
          {/* Compact Toggle Button - Always visible in top right */}
          <button
            onClick={handleToggleCompact}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shrink-0"
            title={isCompact ? "Expand Sidebar" : "Compact Sidebar"}
          >
            <Bars3BottomLeftIcon className={`h-5 w-5 ${isCompact ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Top Section - Navigation */}
        <div className="flex-grow flex flex-col overflow-hidden">
          {/* New Chat Button and Search */}
          {!isCompact && (
            <div className="mb-4 space-y-3">
              <button
                onClick={handleNewChat}
                className="flex w-full items-center justify-center rounded-md bg-sidebar-accent p-2 text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/80"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                New Chat
              </button>
              
              {/* Search Input */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-sidebar-border bg-sidebar-background py-2 pl-10 pr-3 text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:border-sidebar-accent focus:outline-none focus:ring-1 focus:ring-sidebar-accent"
                />
              </div>
            </div>
          )}

          {isCompact && (
            <div className="mb-4 space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`group flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    showSearch ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                  }`}
                  title="Search Chats"
                >
                  <MagnifyingGlassIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNewChat}
                  className="group flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  title="New Chat"
                >
                  <PlusIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Compact Search Input */}
              {showSearch && (
                <div className="px-1">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-sidebar-border bg-sidebar-background py-1 px-2 text-xs text-sidebar-foreground placeholder:text-muted-foreground focus:border-sidebar-accent focus:outline-none focus:ring-1 focus:ring-sidebar-accent"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* Chat List */}
          <div className="flex-1 overflow-hidden">
            {errorChats ? (
              <div className="text-destructive text-sm">Error: {errorChats}</div>
            ) : isLoadingChats ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-y-auto h-full">
                {filteredChats.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    {searchQuery ? 'No chats found' : 'No chats yet'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredChats.map((chat) => (
                      <Link
                        key={chat.id}
                        href={`/${chat.url}`}
                        className="group flex items-center rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        {isCompact ? (
                          <div className="flex h-8 w-8 items-center justify-center">
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                          </div>
                        ) : (
                          <>
                            <ChatBubbleLeftRightIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{chat.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {chat.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4">
          {/* Theme Switcher */}
          <div className={`flex ${isCompact ? 'justify-center' : 'justify-start'}`}>
            <ThemeSwitcher />
          </div>

          {/* User Profile Section */}
          {!isCompact && (
            <div className="flex items-center rounded-md p-2 hover:bg-sidebar-accent" onClick={ () => window.location.href = "/settings/subscriptions" }>
              <div className="flex items-center space-x-3 w-full">
                {user?.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={user.imageUrl}
                      alt={user?.fullName ?? "User Avatar"}
                      className="h-9 w-9 rounded-full object-cover aspect-square"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.fullName ?? "User"}</p>
                  <span className="text-xs text-muted-foreground block">
                    {currentPlan}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isCompact && (
            <div className="flex justify-center">
              <Link
                href="/settings/subscriptions"
                className="group flex items-center justify-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                title={`${user?.fullName ?? "User"}'s Plan: ${currentPlan}`}
              >
                {user?.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={user.imageUrl}
                      alt={user?.fullName ?? "User Avatar"}
                      className="h-9 w-9 rounded-full object-cover aspect-square"
                    />
                  </div>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
