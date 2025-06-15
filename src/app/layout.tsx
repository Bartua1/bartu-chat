// src/app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "~/styles/globals.css";
import { Toaster } from "react-hot-toast";
// CORRECTED IMPORT PATH for LayoutContent
import { LayoutContent } from "~/app/_components/layout-content";
import { ThemeProvider } from "~/app/_components/theme-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Bartu Chat",
  description: "Your AI Chat Assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider>
            <LayoutContent>
              {children}
            </LayoutContent>
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
