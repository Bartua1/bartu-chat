// layout.tsx
import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { Inter } from "next/font/google";

import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import { CustomSignIn } from "./_components/sign-in";
import { TopNav } from "./_components/topnav";
import { SideNav } from "./_components/sidenav";
import { useMediaQuery } from 'usehooks-ts'; // Import the hook
import { LayoutContent } from "./_components/layout-content";
import { ChatProvider } from "./_components/chat-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Bartu Chat",
  description: "Generated by a loyal subscriber to theo's youtube channel",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  return (
    <ClerkProvider>
      <ChatProvider>
        <html lang="en" className={`${GeistSans.variable}`}>
          <body>
            <LayoutContent>{children}</LayoutContent>
          </body>
        </html>
      </ChatProvider>
    </ClerkProvider>
  );
}