"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getAwosReviews, type AwosReview } from "@/lib/awos"
import { cn } from "@/lib/utils"

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return (
    <span
      aria-label={`${rating} din 5 stele`}
      role="img"
      className="flex items-center gap-0.5 text-amber-500"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          aria-hidden
          className={cn(
            "size-3.5",
            index < rounded ? "fill-current" : "fill-transparent opacity-40"
          )}
        />
      ))}
    </span>
  )
}

export function Reviews({
  className,
  title = "Ce spun clienții",
}: {
  className?: string
  title?: string
}) {
  const [reviews, setReviews] = React.useState<AwosReview[] | null | undefined>(
    undefined
  )
  const listRef = React.useRef<HTMLUListElement>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    getAwosReviews(controller.signal)
      .then(setReviews)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setReviews(null)
        }
      })
    return () => controller.abort()
  }, [])

  // Fără recenzii (sau cu API-ul indisponibil) secțiunea dispare complet.
  if (reviews === null || (reviews && reviews.length === 0)) return null

  const scrollByCard = (direction: 1 | -1) => {
    const list = listRef.current
    if (!list) return
    const card = list.querySelector("li")
    const step = card ? card.clientWidth + 16 : list.clientWidth * 0.8
    list.scrollBy({ left: direction * step, behavior: "smooth" })
  }

  return (
    <section
      aria-label={title}
      aria-busy={reviews === undefined}
      className={cn("space-y-4", className)}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {reviews && reviews.length > 1 ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Recenzia anterioară"
              onClick={() => scrollByCard(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Recenzia următoare"
              onClick={() => scrollByCard(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        ) : null}
      </div>

      {reviews === undefined ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-72 shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : (
        <ul
          ref={listRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]"
        >
          {reviews.map((review) => (
            <li
              key={review.id}
              className="w-[85%] max-w-xs shrink-0 snap-start rounded-2xl border bg-card p-5 text-card-foreground shadow-sm sm:w-72"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">{review.author}</p>
                {review.rating !== null ? <Stars rating={review.rating} /> : null}
              </div>
              <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-muted-foreground">
                {review.text}
              </p>
              {review.date ? (
                <p className="mt-3 text-xs text-muted-foreground/70">
                  {new Date(review.date).toLocaleDateString("ro-RO", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
