import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrendCart — Discover What's Trending. Find What's Worth Buying.",
  description:
    "TrendCart helps you discover trending products, best sellers, today's best deals, hidden gems and viral picks — scored from real signals, not hype. Find what's worth buying.",
  keywords: [
    "trending products",
    "best sellers",
    "Amazon deals",
    "product reviews",
    "hidden gems",
    "viral products",
    "gift ideas",
    "best products",
  ],
  authors: [{ name: "TrendCart" }],
  applicationName: "TrendCart",
  openGraph: {
    title: "TrendCart — Discover What's Trending",
    description:
      "Find trending products, best sellers, great deals, and highly rated picks in one place — scored by real signals, not hype.",
    siteName: "TrendCart",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrendCart — Discover What's Trending",
    description:
      "Find trending products, best sellers, great deals, and highly rated picks in one place.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
