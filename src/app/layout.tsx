import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { site } from "@/content";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="ro" className={sans.variable}>
      <body className="font-[family-name:var(--font-sans)]">{children}</body>
    </html>
  );
}
