"use client"

import { AgenticWebEmbedFrame } from "@/components/agenticweb/embed-frame"
import { awosEmbedUrl } from "@/lib/awos"

export function BookingWidget({
  className,
  title = "Programare online",
}: {
  className?: string
  title?: string
}) {
  return (
    <AgenticWebEmbedFrame
      src={awosEmbedUrl("booking")}
      title={title}
      className={className}
    />
  )
}
