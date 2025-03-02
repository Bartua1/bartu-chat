// Create a separate client component for the layout content
'use client';
import { useMediaQuery } from 'usehooks-ts';
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { CustomSignIn } from "./sign-in";
import { TopNav } from "./topnav";
import { SideNav } from "./sidenav";

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
          <div className="grid grid-cols-5">
            <SideNav />
            <div className="col-span-4">
              {children}
            </div>
          </div>
        )}
      </SignedIn>
      <SignedOut>
        <CustomSignIn />
      </SignedOut>
    </>
  );
}