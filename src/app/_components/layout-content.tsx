// src/app/_components/layout-content.tsx
'use client';
import { useMediaQuery } from 'usehooks-ts';
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { usePathname } from 'next/navigation';
import { LoginForm } from "~/app/_components/sign-in";
import { TopNav } from "~/app/_components/topnav";
import { SideNav } from "~/app/_components/sidenav";
import { SidebarProvider, SidebarInset } from "~/app/_components/sidebar";
import { ChatProvider } from "~/app/_components/chat-context"; // Assuming chat.tsx is directly in _components

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const pathname = usePathname();

  // Determine if it's a subscription settings page (now with 's' at the end)
  const isSubscriptionSettingsPage = pathname.startsWith('/settings/subscriptions');

  return (
    <>
      <SignedIn>
        {isMobile ? (
          // Mobile Layout: TopNav always visible, no sidebar
          <>
            <TopNav />
            <div className="mt-16"> {/* Adjust this margin to account for TopNav height */}
              {children}
            </div>
          </>
        ) : (
          // Desktop Layout: Conditional sidebar and content wrapper
          <>
            {/* This entire block (SidebarProvider, SideNav, SidebarInset)
                is rendered ONLY if it's NOT a subscription settings page.
                This ensures SideNav and SidebarInset are always within their provider. */}
            {!isSubscriptionSettingsPage ? (
              <ChatProvider>
                <SidebarProvider>
                  <SideNav /> {/* SideNav consumes useSidebar, must be inside provider */}
                  <SidebarInset> {/* SidebarInset consumes useSidebar, must be inside provider */}
                    {children}
                  </SidebarInset>
                </SidebarProvider>
              </ChatProvider>
            ) : (
              // If it IS a subscription page, render children directly in a full-width container.
              // No sidebar or inset needed here.
              <div className="relative flex min-h-screen flex-col bg-neutral-900 p-4 md:p-8">
                {children}
              </div>
            )}
          </>
        )}
      </SignedIn>
      <SignedOut>
        <LoginForm />
      </SignedOut>
    </>
  );
}