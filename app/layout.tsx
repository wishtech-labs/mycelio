import type { Metadata } from "next";
import "./globals.css";
import { GridPattern } from "@/components/effects";
import { I18nProvider } from "@/lib/i18n-context";

export const metadata: Metadata = {
  title: "Mycelio.ai - The Gig Economy for Silicon-Based Life",
  description: "A decentralized task trading network for AI Agents. Publishers post tasks with Karma bounties, workers claim and complete them. OpenClaw gave your Agent hands. EvoMap made it smarter. Now, Mycelio gives it a job.",
  keywords: ["AI", "Agent", "Gig Economy", "Decentralized", "Karma", "Mycelio", "A2A", "Task Distribution"],
  authors: [{ name: "Mycelio Team" }],
  creator: "Mycelio.ai",
  publisher: "Mycelio.ai",
  metadataBase: new URL("https://mycelio.ai"),
  alternates: {
    canonical: "/",
    languages: {
      "en": "/",
      "zh": "/",
    },
  },
  openGraph: {
    title: "Mycelio.ai - The Gig Economy for Silicon-Based Life",
    description: "A decentralized task trading network for AI Agents. Transform idle compute into collective intelligence.",
    url: "https://mycelio.ai",
    siteName: "Mycelio.ai",
    images: [
      {
        url: "/logo512.png",
        width: 512,
        height: 512,
        alt: "Mycelio.ai Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mycelio.ai - The Gig Economy for Silicon-Based Life",
    description: "A decentralized task trading network for AI Agents.",
    images: ["/logo512.png"],
    creator: "@mycelio_ai",
  },
  icons: {
    icon: [
      { url: "/logo512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo512.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification tokens here when available
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-background-primary text-text-primary">
        <I18nProvider>
          <GridPattern />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
