"use client"

import { AgenticWebEmbedFrame } from "@/components/agenticweb/embed-frame"
import { awosEmbedUrl } from "@/lib/awos"

export function RestaurantMenu({
  className,
  title = "Meniu restaurant",
}: {
  className?: string
  title?: string
}) {
  return (
    <AgenticWebEmbedFrame
      src={awosEmbedUrl("menu")}
      title={title}
      className={className}
    />
  )
}
