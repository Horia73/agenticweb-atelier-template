"use client"

import * as React from "react"
import {
  BotIcon,
  LoaderCircleIcon,
  MessageCircleIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Button } from "@/components/ui/button"
import {
  Marker,
  MarkerContent,
  MarkerIcon,
} from "@/components/ui/marker"
import {
  awosChat,
  awosTrack,
  getAwosChatConfig,
  type AwosChatConfig,
} from "@/lib/awos"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  durationSeconds?: number
  streaming?: boolean
}

function WorkMarker({
  active = false,
  seconds,
}: {
  active?: boolean
  seconds: number
}) {
  return (
    <Marker
      variant={active ? "default" : "separator"}
      aria-live={active ? "polite" : undefined}
    >
      <MarkerIcon>
        {active ? (
          <LoaderCircleIcon className="animate-spin" />
        ) : (
          <SparklesIcon />
        )}
      </MarkerIcon>
      <MarkerContent>
        {active ? "Pregătește răspunsul" : "A lucrat"} {seconds}s
      </MarkerContent>
    </Marker>
  )
}

type ChatTurn = {
  user?: ChatMessage
  replies: ChatMessage[]
}

const DEFAULT_SUGGESTIONS = [
  "Cu ce mă puteți ajuta?",
  "Cât costă serviciile?",
  "Cum pot lua legătura cu voi?",
]

function groupIntoTurns(messages: ChatMessage[]) {
  const turns: ChatTurn[] = []
  for (const message of messages) {
    if (message.role === "user") {
      turns.push({ user: message, replies: [] })
    } else if (turns.length === 0) {
      turns.push({ replies: [message] })
    } else {
      turns[turns.length - 1].replies.push(message)
    }
  }
  return turns
}

export function Chatbot({
  className,
  title,
  suggestions = DEFAULT_SUGGESTIONS,
  conversationStorageKey = "awos:chat:conversation",
  onClose,
}: {
  className?: string
  title?: string
  suggestions?: string[]
  conversationStorageKey?: string
  onClose?: () => void
}) {
  const [config, setConfig] = React.useState<
    AwosChatConfig | null | undefined
  >(undefined)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [waitingForFirstToken, setWaitingForFirstToken] = React.useState(false)
  const [requestStartedAt, setRequestStartedAt] = React.useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(1)
  const conversationIdRef = React.useRef<string | null>(null)
  const requestRef = React.useRef<AbortController | null>(null)
  const inFlightRef = React.useRef(false)

  React.useEffect(() => {
    const controller = new AbortController()
    getAwosChatConfig(controller.signal)
      .then(setConfig)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setConfig(null)
        }
      })
    return () => controller.abort()
  }, [])

  React.useEffect(() => {
    if (!config) return
    setMessages((current) => {
      if (current.length > 0) return current
      return [
        {
          id: "greeting",
          role: "assistant",
          content: config.welcome,
        },
      ]
    })
  }, [config])

  React.useEffect(() => {
    try {
      conversationIdRef.current = localStorage.getItem(conversationStorageKey)
    } catch {
      conversationIdRef.current = null
    }
  }, [conversationStorageKey])

  React.useEffect(
    () => () => {
      requestRef.current?.abort()
    },
    []
  )

  React.useEffect(() => {
    if (!loading || !requestStartedAt) return
    const update = () =>
      setElapsedSeconds(
        Math.max(
          1,
          Math.round((window.performance.now() - requestStartedAt) / 1000)
        )
      )
    update()
    const timer = window.setInterval(update, 500)
    return () => window.clearInterval(timer)
  }, [loading, requestStartedAt])

  const turns = React.useMemo(() => groupIntoTurns(messages), [messages])

  function persistConversationId(id: string) {
    conversationIdRef.current = id
    try {
      localStorage.setItem(conversationStorageKey, id)
    } catch {
      // Conversația curentă continuă și dacă storage-ul este indisponibil.
    }
  }

  async function send(raw: string) {
    const content = raw.trim()
    if (!content || inFlightRef.current) return

    inFlightRef.current = true
    const startedAt = window.performance.now()
    setLoading(true)
    setWaitingForFirstToken(true)
    setRequestStartedAt(startedAt)
    setElapsedSeconds(1)
    setInput("")
    if (!conversationIdRef.current) awosTrack("chat_start")

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    }
    const assistantId = crypto.randomUUID()
    setMessages((current) => [...current, userMessage])

    const controller = new AbortController()
    requestRef.current?.abort()
    requestRef.current = controller
    let streaming = false

    try {
      const result = await awosChat({
        message: content,
        conversationId: conversationIdRef.current,
        signal: controller.signal,
        onDelta: (chunk) => {
          if (!streaming) {
            streaming = true
            setWaitingForFirstToken(false)
            setMessages((current) => [
              ...current,
              {
                id: assistantId,
                role: "assistant",
                content: chunk,
                streaming: true,
              },
            ])
            return
          }
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: message.content + chunk }
                : message
            )
          )
        },
      })

      if (result.conversationId) persistConversationId(result.conversationId)
      const durationSeconds = Math.max(
        1,
        Math.round((window.performance.now() - startedAt) / 1000)
      )
      if (!streaming) {
        setMessages((current) => [
          ...current,
          {
            id: assistantId,
            role: "assistant",
            content: result.reply,
            durationSeconds,
          },
        ])
      } else {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: result.reply,
                  streaming: false,
                  durationSeconds,
                }
              : message
          )
        )
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setMessages((current) => [
          ...current,
          {
            id: assistantId,
            role: "assistant",
            content:
              "Nu am putut răspunde acum. Încearcă din nou în câteva momente.",
            durationSeconds: Math.max(
              1,
              Math.round((window.performance.now() - startedAt) / 1000)
            ),
          },
        ])
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null
      inFlightRef.current = false
      setLoading(false)
      setWaitingForFirstToken(false)
      setRequestStartedAt(null)
    }
  }

  if (config === null) return null

  return (
    <section
      aria-label={title ?? "Chat cu asistentul virtual"}
      aria-busy={config === undefined}
      className={cn(
        "flex h-[min(36rem,80dvh)] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xl",
        className
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BotIcon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">
            {title ??
              (config ? `Asistent ${config.siteName}` : "Asistent virtual")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {config ? "Online" : "Se conectează…"}
          </p>
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Închide chatul"
          >
            <XIcon />
          </Button>
        ) : null}
      </header>

      <MessageScrollerProvider
        autoScroll={false}
        defaultScrollPosition="end"
        scrollPreviousItemPeek={0}
        scrollMargin={0}
      >
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent aria-busy={loading}>
              {turns.map((turn, index) => {
                const turnId =
                  turn.user?.id ?? turn.replies[0]?.id ?? `turn-${index}`
                const isLast = index === turns.length - 1
                return (
                  <MessageScrollerItem
                    key={turnId}
                    messageId={turnId}
                    scrollAnchor={Boolean(turn.user)}
                    className="flex flex-col gap-3"
                  >
                    {turn.user && (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground [overflow-wrap:anywhere]">
                          {turn.user.content}
                        </div>
                      </div>
                    )}
                    {turn.replies.map((message) => (
                      <Message key={message.id} from="assistant">
                        {message.durationSeconds ? (
                          <WorkMarker seconds={message.durationSeconds} />
                        ) : null}
                        <MessageContent className="rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5">
                          <MessageResponse isAnimating={message.streaming}>
                            {message.content}
                          </MessageResponse>
                        </MessageContent>
                      </Message>
                    ))}
                    {isLast && waitingForFirstToken && (
                      <WorkMarker active seconds={elapsedSeconds} />
                    )}
                  </MessageScrollerItem>
                )
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      {messages.length <= 1 && config && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex shrink-0 items-end gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault()
          void send(input)
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              void send(input)
            }
          }}
          disabled={!config || loading}
          rows={1}
          maxLength={2000}
          placeholder="Scrie un mesaj…"
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!config || loading || !input.trim()}
          aria-label="Trimite mesajul"
          className="rounded-xl"
        >
          <SendIcon />
        </Button>
      </form>
    </section>
  )
}

export function ChatWidget({
  title,
  suggestions,
}: {
  title?: string
  suggestions?: string[]
}) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (open) awosTrack("chat_open")
  }, [open])

  if (!open) {
    return (
      <Button
        type="button"
        size="icon-lg"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-50 size-12 rounded-full shadow-lg sm:right-6 sm:bottom-6"
        aria-label="Deschide chatul"
      >
        <MessageCircleIcon className="size-5" />
      </Button>
    )
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[25rem]">
      <Chatbot
        title={title}
        suggestions={suggestions}
        onClose={() => setOpen(false)}
        className="h-[min(42rem,calc(100dvh-1.5rem))] max-w-none sm:h-[min(42rem,calc(100dvh-3rem))]"
      />
    </div>
  )
}
