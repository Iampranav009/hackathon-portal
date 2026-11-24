import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hackathon-portal-lake.vercel.app"),
  title: "Hackathon Portal — Hackathons for Engineering Students",
  description:
    "Hackathons and community events for engineering students in India — AI, GenAI agents, Next.js, React, TypeScript and Python. Pick it here, apply yourself. No auto-apply.",
  openGraph: {
    title: "Hackathon Portal — Hackathons for Engineering Students",
    description:
      "Hackathons and community events for engineering students in India. Pick it here, apply yourself. No auto-apply.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hackathon Portal — Hackathons for Engineering Students",
    description:
      "Hackathons and community events for engineering students in India. Pick it here, apply yourself.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900">{children}</body>
    </html>
  );
}
