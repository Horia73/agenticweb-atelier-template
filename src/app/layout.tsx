import type { Metadata } from "next";
import { site } from "@/content";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ChatWidget } from "@/components/agenticweb/chatbot";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className={cn("font-sans", inter.variable)}>
      <body>
        {children}
        {site.chatbot.enabled && process.env.NEXT_PUBLIC_AWOS_SITE_KEY ? (
          <ChatWidget
            title={site.chatbot.title}
            suggestions={site.chatbot.suggestions}
          />
        ) : null}
      </body>
    </html>
  );
}
