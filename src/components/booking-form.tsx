"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { site } from "@/content";

export function BookingForm() {
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const confirmationRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const copy = site.booking;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (status === "success") {
      confirmationRef.current?.focus();
    } else if (status === "error") {
      errorRef.current?.focus();
    }
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated || status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const message = String(data.get("message") ?? "").trim();
    const body = {
      key: "aw_d63fa8fdb1db55ee5f982b378b0231d5",
      source: "form",
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      ...(message ? { message } : {}),
      page: window.location.href,
      website: String(data.get("website") ?? ""),
      meta: { session: String(data.get("session") ?? "") },
    };

    setStatus("submitting");
    setErrorMessage("");
    try {
      const response = await fetch("https://os.agenticweb.ro/api/embed/v1/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      setStatus("success");
    } catch {
      setErrorMessage(copy.errorText);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        ref={confirmationRef}
        className="rounded-card border border-secondary bg-muted p-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        role="status"
        aria-live="polite"
        tabIndex={-1}
      >
        <Check aria-hidden className="mb-4 size-7" />
        <h3 className="font-heading text-2xl">{copy.successTitle}</h3>
        <p className="mt-3 text-muted-foreground">{copy.successText}</p>
        <Button variant="outline" className="mt-6 min-h-11" onClick={() => setStatus("idle")}>{copy.reset}</Button>
      </div>
    );
  }

  return (
    <form ref={formRef} data-booking-form="agenticweb-lead" data-hydrated={hydrated} aria-busy={!hydrated || status === "submitting"} onSubmit={handleSubmit}>
      <fieldset disabled={!hydrated || status === "submitting"} className="space-y-5 disabled:opacity-70">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="name">{copy.fields.name}</Label><Input id="name" name="name" autoComplete="name" required className="min-h-12 bg-card" /></div>
          <div className="space-y-2"><Label htmlFor="email">{copy.fields.email}</Label><Input id="email" name="email" type="email" autoComplete="email" required className="min-h-12 bg-card" /></div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="session">{copy.fields.session}</Label>
          <select id="session" name="session" required defaultValue="" className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="" disabled>{copy.sessionPlaceholder}</option>
            {site.workshop.schedule.map((session) => <option key={session} value={session}>{session}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label htmlFor="message">{copy.fields.message}</Label><Textarea id="message" name="message" rows={4} className="bg-card" /></div>
        <div className="sr-only" aria-hidden="true">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{copy.privacy}</p>
        {status === "error" && (
          <div ref={errorRef} role="alert" tabIndex={-1} className="rounded-md border border-destructive p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <p className="flex items-start gap-2"><AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0" /><span>{errorMessage}</span></p>
            <p className="mt-2 text-sm text-muted-foreground">{copy.errorAction}</p>
          </div>
        )}
        <Button type="submit" size="lg" className="min-h-12 w-full sm:w-auto">
          {status === "submitting" ? <><LoaderCircle aria-hidden className="animate-spin" />{copy.submitting}</> : status === "error" ? copy.retry : copy.submit}
        </Button>
      </fieldset>
    </form>
  );
}
