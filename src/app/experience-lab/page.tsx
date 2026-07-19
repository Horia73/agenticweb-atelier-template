import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExperienceLab } from "./experience-lab";

export const metadata: Metadata = {
  title: "Experience Primitives · Playground",
  robots: { index: false, follow: false },
};

export default function ExperienceLabPage() {
  if (process.env.EXPERIENCE_LAB !== "1") notFound();
  return <ExperienceLab />;
}
