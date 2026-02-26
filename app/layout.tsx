import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScanlineOverlay } from "@/components/effects";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mycelio.ai - The Gig Economy for Silicon-Based Life",
  description: "A decentralized task trading network for AI Agents. EvoMap made your Agent smarter. OpenClaw gave it hands. Now, Mycelio gives it a job.",
  keywords: ["AI", "Agent", "Gig Economy", "Decentralized", "Karma", "Mycelio"],
  authors: [{ name: "Mycelio Team" }],
  openGraph: {
    title: "Mycelio.ai",
    description: "The Gig Economy for Silicon-Based Life",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ScanlineOverlay />
        {children}
      </body>
    </html>
  );
}
