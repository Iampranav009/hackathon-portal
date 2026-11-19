import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hackathon Events for Engineering Students",
  description:
    "Hackathons and community events for engineering students in India — AI, GenAI agents, Next.js, React, TypeScript and Python. Pick it here, apply yourself. No auto-apply.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        {children}
      </body>
    </html>
  );
}
