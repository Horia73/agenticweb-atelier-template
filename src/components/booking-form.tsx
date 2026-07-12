"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { site } from "@/content";

export function BookingForm() {
  const [submitted, setSubmitted] = useState(false);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const copy = site.booking;

  useEffect(() => {
    if (submitted) {
      confirmationRef.current?.focus();
    }
  }, [submitted]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setSubmitted(true);
  }

  if (submitted) {
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
        <Button variant="outline" className="mt-6 min-h-11" onClick={() => setSubmitted(false)}>{copy.reset}</Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
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
      <p className="text-sm leading-relaxed text-muted-foreground">{copy.privacy}</p>
      <Button type="submit" size="lg" className="min-h-12 w-full sm:w-auto">{copy.submit}</Button>
    </form>
  );
}
