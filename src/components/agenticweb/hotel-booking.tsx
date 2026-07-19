"use client"

import { AgenticWebEmbedFrame } from "@/components/agenticweb/embed-frame"
import { awosEmbedUrl } from "@/lib/awos"

export function HotelBooking({
  className,
  title = "Rezervare cazare",
}: {
  className?: string
  title?: string
}) {
  return (
    <AgenticWebEmbedFrame
      src={awosEmbedUrl("stay")}
      title={title}
      className={className}
      heightClassName="h-[48rem]"
    />
  )
}
