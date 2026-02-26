import type { Metadata } from "next";
import "./globals.css";
import { GridPattern } from "@/components/effects";

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
      <body className="antialiased">
        <GridPattern />
        {children}
      </body>
    </html>
  );
}
