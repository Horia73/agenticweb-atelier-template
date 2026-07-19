import { redirect } from "next/navigation";
import { StillroomLanding } from "@/components/landing/stillroom-landing";

export default function StudioSeedPage() {
  if (process.env.EXPERIENCE_LAB === "1") {
    redirect("/experience-lab#layered-depth");
  }

  return <StillroomLanding />;
}
