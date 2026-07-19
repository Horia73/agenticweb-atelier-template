"use client"

import { cn } from "@/lib/utils"

export function AgenticWebEmbedFrame({
  src,
  title,
  className,
  heightClassName = "h-[42rem]",
}: {
  src: string
  title: string
  className?: string
  heightClassName?: string
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border bg-muted/30 shadow-sm",
        heightClassName,
        className
      )}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full bg-background"
      />
    </div>
  )
}
