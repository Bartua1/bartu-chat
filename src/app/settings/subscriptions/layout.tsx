import type { Metadata } from "next"; // Optional: for type safety

// Metadata for the /settings/subscription route segment
export const metadata: Metadata = { // Use Metadata type for better type checking
  title: "Subscription Settings",
  description: "Manage your subscription plan and account settings",
};

// This layout will wrap the page.tsx component in the same directory
export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* You can add common UI elements for this segment here, like headers, footers, or sidebars specific to subscription settings */}
      {children} {/* This is where your page.tsx content will be rendered */}
    </>
  );
}