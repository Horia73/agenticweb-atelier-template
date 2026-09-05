import type { Metadata } from "next";
import { site } from "@/content";
import "./globals.css";
import "@fontsource-variable/inter";
import "@fontsource/instrument-serif/latin.css";
import "@fontsource/instrument-serif/latin-ext.css";
import "@fontsource/instrument-serif/latin-italic.css";
import "@fontsource/instrument-serif/latin-ext-italic.css";
import { ChatWidget } from "@/components/agenticweb/chatbot";
import { AWOS_EMBED_URL, SITE_KEY } from "@/lib/awos";

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
    <html
      lang="ro"
      className="font-sans"
    >
      <body>
        {children}
        {site.chatbot.enabled && process.env.NEXT_PUBLIC_AWOS_SITE_KEY ? (
          <ChatWidget
            title={site.chatbot.title}
            suggestions={site.chatbot.suggestions}
          />
        ) : null}
        {SITE_KEY ? (
          <script src={AWOS_EMBED_URL} data-site-key={SITE_KEY} async />
        ) : null}
      </body>
    </html>
  );
}
