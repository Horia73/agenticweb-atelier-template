"use client"

import * as React from "react"
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { awosLead, awosTrack } from "@/lib/awos"
import { cn } from "@/lib/utils"

type LeadFormLabels = {
  name: string
  email: string
  phone: string
  message: string
  submit: string
  success: string
  error: string
}

const DEFAULT_LABELS: LeadFormLabels = {
  name: "Nume",
  email: "Email",
  phone: "Telefon",
  message: "Mesaj",
  submit: "Trimite mesajul",
  success: "Mulțumim! Revenim cât de curând.",
  error: "Nu am putut trimite mesajul. Încearcă din nou.",
}

export function LeadForm({
  className,
  labels: labelOverrides,
  onSuccess,
  showMessage = true,
  showPhone = true,
  source,
  title,
}: {
  className?: string
  labels?: Partial<LeadFormLabels>
  onSuccess?: () => void
  showMessage?: boolean
  showPhone?: boolean
  /** Identificator opțional al plasării (ex. "footer", "pagina-contact"). */
  source?: string
  title?: string
}) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const [status, setStatus] = React.useState<
    "idle" | "sending" | "success" | "error"
  >("idle")
  const requestRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => () => requestRef.current?.abort(), [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "sending") return
    const form = event.currentTarget
    const data = new FormData(form)
    // Honeypot: roboții completează câmpul invizibil; ieșim silențios.
    if (String(data.get("website") ?? "").length > 0) {
      setStatus("success")
      return
    }
    const name = String(data.get("name") ?? "").trim()
    const email = String(data.get("email") ?? "").trim()
    const phone = String(data.get("phone") ?? "").trim()
    const message = String(data.get("message") ?? "").trim()
    if (!name || !email) return

    setStatus("sending")
    const controller = new AbortController()
    requestRef.current?.abort()
    requestRef.current = controller
    try {
      await awosLead(
        {
          name,
          email,
          phone: phone || undefined,
          message: message || undefined,
          source,
        },
        controller.signal
      )
      awosTrack("lead_submit")
      setStatus("success")
      form.reset()
      onSuccess?.()
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setStatus("error")
    } finally {
      if (requestRef.current === controller) requestRef.current = null
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-3 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm",
          className
        )}
      >
        <CheckCircle2Icon className="size-5 shrink-0 text-primary" />
        <p className="text-sm">{labels.success}</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate={false}
      className={cn(
        "space-y-4 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm",
        className
      )}
    >
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lead-name">{labels.name}</Label>
          <Input id="lead-name" name="name" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-email">{labels.email}</Label>
          <Input
            id="lead-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
      </div>
      {showPhone ? (
        <div className="space-y-2">
          <Label htmlFor="lead-phone">{labels.phone}</Label>
          <Input id="lead-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      ) : null}
      {showMessage ? (
        <div className="space-y-2">
          <Label htmlFor="lead-message">{labels.message}</Label>
          <Textarea id="lead-message" name="message" rows={4} maxLength={4000} />
        </div>
      ) : null}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] size-px opacity-0"
      />
      {status === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {labels.error}
        </p>
      ) : null}
      <Button type="submit" disabled={status === "sending"} className="w-full sm:w-auto">
        {status === "sending" ? (
          <LoaderCircleIcon className="animate-spin" />
        ) : null}
        {labels.submit}
      </Button>
    </form>
  )
}
