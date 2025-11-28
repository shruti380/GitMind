import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "GitMind",
  description: "Your AI Github assistant!",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      {/* FIX: Added suppressHydrationWarning={true} to ignore client/server mismatches 
        on the root element, often caused by browser extensions or third-party scripts.
      */}
      <html 
        lang="en" 
        className={`${GeistSans.variable}`}
        suppressHydrationWarning={true} // <-- Hydration mismatch fix
      >
        <body>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}