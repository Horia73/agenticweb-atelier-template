const AWOS_URL =
  process.env.NEXT_PUBLIC_AWOS_URL ?? "https://os.agenticweb.ro"
const SITE_KEY = process.env.NEXT_PUBLIC_AWOS_SITE_KEY ?? ""

export type AwosChatConfig = {
  siteName: string
  welcome: string
}

export type AwosChatResult = {
  conversationId: string | null
  reply: string
  capped?: boolean
}

function requireSiteKey() {
  if (!SITE_KEY) {
    throw new Error("NEXT_PUBLIC_AWOS_SITE_KEY lipsește")
  }
  return SITE_KEY
}

function visitorId(): string | null {
  try {
    let id = localStorage.getItem("awos:visitor")
    if (!id) {
      id = `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
      localStorage.setItem("awos:visitor", id)
    }
    return id
  } catch {
    return null
  }
}

export async function getAwosChatConfig(
  signal?: AbortSignal
): Promise<AwosChatConfig | null> {
  const response = await fetch(
    `${AWOS_URL}/api/embed/v1/config?key=${encodeURIComponent(requireSiteKey())}`,
    { signal }
  )
  if (!response.ok) throw new Error(`config_failed:${response.status}`)

  const payload = (await response.json()) as {
    site?: { name?: string }
    chat?: { welcome?: string } | null
  }
  if (!payload.chat) return null

  return {
    siteName: payload.site?.name?.trim() || "firma noastră",
    welcome:
      payload.chat.welcome?.trim() ||
      `Salut! Sunt asistentul ${payload.site?.name?.trim() || "firmei"}. Cu ce te pot ajuta?`,
  }
}

export function awosTrack(name: string) {
  if (!SITE_KEY) return
  try {
    const body = JSON.stringify({
      key: SITE_KEY,
      e: [{ t: "ev", n: name, p: location.pathname }],
    })
    if (!navigator.sendBeacon?.(`${AWOS_URL}/api/embed/v1/a`, body)) {
      fetch(`${AWOS_URL}/api/embed/v1/a`, {
        method: "POST",
        body,
        keepalive: true,
      }).catch(() => undefined)
    }
  } catch {
    // Analytics-ul nu are voie să blocheze conversația.
  }
}

export async function awosChat(options: {
  message: string
  conversationId?: string | null
  onDelta?: (text: string) => void
  signal?: AbortSignal
}): Promise<AwosChatResult> {
  const response = await fetch(`${AWOS_URL}/api/embed/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: requireSiteKey(),
      message: options.message,
      conversationId: options.conversationId ?? undefined,
      stream: true,
      page: location.pathname,
      visitorId: visitorId() ?? undefined,
    }),
    signal: options.signal,
  })

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("text/event-stream")) {
    const payload = (await response.json()) as {
      conversationId?: string
      reply?: string
      capped?: boolean
      error?: string
    }
    if (!response.ok || !payload.reply) {
      throw new Error(payload.error ?? "chat_failed")
    }
    return {
      conversationId: payload.conversationId ?? null,
      reply: payload.reply,
      capped: payload.capped,
    }
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("no_stream")

  const decoder = new TextDecoder()
  let buffer = ""
  let conversationId = options.conversationId ?? null
  let reply = ""
  let failed = false

  function handleEvent(event: {
    type?: string
    conversationId?: string
    text?: string
  }) {
    if (event.type === "start" && event.conversationId) {
      conversationId = event.conversationId
    } else if (event.type === "delta" && typeof event.text === "string") {
      reply += event.text
      options.onDelta?.(event.text)
    } else if (event.type === "error") {
      failed = true
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (value) buffer += decoder.decode(value, { stream: true })

    for (;;) {
      const eventEnd = buffer.indexOf("\n\n")
      if (eventEnd < 0) break
      const eventBlock = buffer.slice(0, eventEnd)
      buffer = buffer.slice(eventEnd + 2)
      for (const line of eventBlock.split("\n")) {
        if (!line.startsWith("data:")) continue
        try {
          handleEvent(JSON.parse(line.slice(5)))
        } catch {
          // Un eveniment invalid nu trebuie să piardă restul streamului.
        }
      }
    }

    if (done) break
  }

  if (failed || !reply) throw new Error("chat_failed")
  return { conversationId, reply }
}
