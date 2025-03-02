// Create a separate client component for the layout content
'use client';
import { useMediaQuery } from 'usehooks-ts';
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { LoginForm } from "./sign-in";
import { TopNav } from "./topnav";
import { SideNav } from "./sidenav";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <>
      <SignedIn>
        {isMobile ? (
          <>
            <TopNav />
            <div className="mt-16">
              {children}
            </div>
          </>
        ) : (
          <div>
            <SidebarProvider>
              <SideNav />
              <SidebarInset>
                {children}
              </SidebarInset>
            </SidebarProvider>
          </div>
        )}
      </SignedIn>
      <SignedOut>
        <LoginForm />
      </SignedOut>
    </>
  );
}