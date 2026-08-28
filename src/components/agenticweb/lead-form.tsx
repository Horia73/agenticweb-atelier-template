"use client"

import * as React from "react"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  awosLead,
  awosTrack,
  type AwosLeadField,
  type AwosLeadInput,
} from "@/lib/awos"
import { cn } from "@/lib/utils"

export type LeadFormFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "textarea"
  | "select"

export type LeadFormFieldOption = {
  label: string
  value: string
}

export type LeadFormField = {
  name: string
  label: string
  type?: LeadFormFieldType
  required?: boolean
  description?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  min?: number
  max?: number
  maxLength?: number
  rows?: number
  options?: LeadFormFieldOption[]
  /** Declară sensul unui câmp suplimentar în Clienți. Fără această opțiune,
   * valoarea ajunge în `meta` ca text. */
  leadField?: Omit<AwosLeadField, "key" | "value"> & { key?: string }
}

export type LeadFormStep = {
  id: string
  title: string
  description?: string
  fields: LeadFormField[]
}

export type LeadFormLabels = {
  submit: string
  next: string
  previous: string
  step: string
  of: string
  successTitle: string
  success: string
  error: string
}

const DEFAULT_LABELS: LeadFormLabels = {
  submit: "Trimite cererea",
  next: "Continuă",
  previous: "Înapoi",
  step: "Pasul",
  of: "din",
  successTitle: "Cerere trimisă",
  success: "Mulțumim! Am primit cererea și revenim cât de curând.",
  error: "Nu am putut trimite cererea. Încearcă din nou.",
}

const CORE_LEAD_FIELDS = new Set(["name", "email", "phone", "message"])

function defaultSteps(showPhone: boolean, showMessage: boolean): LeadFormStep[] {
  return [
    {
      id: "contact",
      title: "Date de contact",
      fields: [
        {
          name: "name",
          label: "Nume",
          autoComplete: "name",
          required: true,
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
          required: true,
        },
        ...(showPhone
          ? [
              {
                name: "phone",
                label: "Telefon",
                type: "tel" as const,
                autoComplete: "tel",
              },
            ]
          : []),
        ...(showMessage
          ? [
              {
                name: "message",
                label: "Mesaj",
                type: "textarea" as const,
                rows: 4,
                maxLength: 4000,
              },
            ]
          : []),
      ],
    },
  ]
}

function formValues(form: HTMLFormElement) {
  return Object.fromEntries(
    [...new FormData(form).entries()]
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, String(value).trim()])
  )
}

function buildLeadPayload({
  answers,
  channel,
  fields,
  source,
}: {
  answers: Record<string, string>
  channel?: string
  fields: LeadFormField[]
  source?: AwosLeadInput["source"]
}): AwosLeadInput {
  const meta: Record<string, string> = {}
  const semanticFields: AwosLeadField[] = []

  for (const field of fields) {
    const value = answers[field.name]
    if (!value || CORE_LEAD_FIELDS.has(field.name)) continue
    if (field.leadField) {
      semanticFields.push({
        ...field.leadField,
        key: field.leadField.key ?? field.name,
        label: field.leadField.label ?? field.label,
        value,
      })
    } else {
      meta[field.name] = value
    }
  }

  return {
    name: answers.name || "Vizitator",
    email: answers.email || undefined,
    phone: answers.phone || undefined,
    message: answers.message || undefined,
    source: source ?? "form",
    channel,
    meta: Object.keys(meta).length ? meta : undefined,
    fields: semanticFields.length ? semanticFields : undefined,
  }
}

function LeadFieldControl({
  defaultValue,
  field,
  id,
  invalid,
  onInvalid,
}: {
  defaultValue?: string
  field: LeadFormField
  id: string
  invalid: boolean
  onInvalid: React.FormEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
}) {
  const common = {
    id,
    name: field.name,
    required: field.required,
    defaultValue,
    "aria-invalid": invalid || undefined,
    onInvalid,
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        {...common}
        placeholder={field.placeholder}
        rows={field.rows ?? 4}
        maxLength={field.maxLength}
      />
    )
  }

  if (field.type === "select") {
    return (
      <NativeSelect {...common} className="w-full">
        <NativeSelectOption value="" disabled>
          {field.placeholder ?? "Alege o opțiune"}
        </NativeSelectOption>
        {field.options?.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    )
  }

  return (
    <Input
      {...common}
      type={field.type ?? "text"}
      placeholder={field.placeholder}
      autoComplete={field.autoComplete}
      inputMode={field.inputMode}
      min={field.min}
      max={field.max}
      maxLength={field.maxLength}
    />
  )
}

export function LeadForm({
  channel,
  className,
  labels: labelOverrides,
  onSuccess,
  showMessage = true,
  showPhone = true,
  source,
  steps: configuredSteps,
  subtitle,
  title = "Trimite-ne o cerere",
}: {
  /** DE UNDE din site vine cererea: slug stabil per plasare, de exemplu
   * `form:pagina-contact`. Devine filtru și etichetă în Clienți. */
  channel?: string
  className?: string
  labels?: Partial<LeadFormLabels>
  onSuccess?: () => void
  /** Compatibilitate cu formularul simplu implicit. Ignorat când dai `steps`. */
  showMessage?: boolean
  /** Compatibilitate cu formularul simplu implicit. Ignorat când dai `steps`. */
  showPhone?: boolean
  /** Ce fel de cerere este. Plasarea se declară prin `channel`. */
  source?: AwosLeadInput["source"]
  /** Un singur pas sau mai mulți; aceleași componente gestionează ambele fluxuri. */
  steps?: LeadFormStep[]
  subtitle?: string
  title?: string
}) {
  const generatedSteps = React.useMemo(
    () => defaultSteps(showPhone, showMessage),
    [showMessage, showPhone]
  )
  const steps = configuredSteps?.length ? configuredSteps : generatedSteps
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const allFields = React.useMemo(
    () => steps.flatMap((item) => item.fields),
    [steps]
  )
  const [currentStep, setCurrentStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [invalidFields, setInvalidFields] = React.useState<Record<string, string>>({})
  const [status, setStatus] = React.useState<
    "idle" | "sending" | "success" | "error"
  >("idle")
  const requestRef = React.useRef<AbortController | null>(null)
  const formRef = React.useRef<HTMLFormElement | null>(null)
  const idPrefix = React.useId()
  const step = steps[currentStep] ?? steps[0]
  const isMultiStep = steps.length > 1
  const isLastStep = currentStep === steps.length - 1

  React.useEffect(() => () => requestRef.current?.abort(), [])

  function rememberCurrentStep() {
    if (!formRef.current) return answers
    const nextAnswers = { ...answers, ...formValues(formRef.current) }
    setAnswers(nextAnswers)
    return nextAnswers
  }

  function validateCurrentStep() {
    const form = formRef.current
    if (!form) return false
    const valid = form.checkValidity()
    if (!valid) {
      const firstInvalid = form.querySelector<HTMLElement>(":invalid")
      firstInvalid?.focus()
      form.reportValidity()
    }
    return valid
  }

  function handleNext() {
    if (!validateCurrentStep()) return
    rememberCurrentStep()
    setInvalidFields({})
    setStatus("idle")
    setCurrentStep((value) => Math.min(value + 1, steps.length - 1))
  }

  function handlePrevious() {
    rememberCurrentStep()
    setInvalidFields({})
    setStatus("idle")
    setCurrentStep((value) => Math.max(value - 1, 0))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "sending" || !validateCurrentStep()) return
    const form = event.currentTarget
    const latestAnswers = { ...answers, ...formValues(form) }

    // Honeypot: roboții completează câmpul invizibil; ieșim silențios.
    if (latestAnswers.website) {
      setStatus("success")
      return
    }

    setAnswers(latestAnswers)
    setStatus("sending")
    const controller = new AbortController()
    requestRef.current?.abort()
    requestRef.current = controller
    try {
      await awosLead(
        buildLeadPayload({
          answers: latestAnswers,
          channel,
          fields: allFields,
          source,
        }),
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
      <Alert className={className}>
        <CheckCircle2Icon aria-hidden="true" />
        <AlertTitle>{labels.successTitle}</AlertTitle>
        <AlertDescription>{labels.success}</AlertDescription>
      </Alert>
    )
  }

  if (!step) return null

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        {isMultiStep ? (
          <CardDescription aria-live="polite">
            {labels.step} {currentStep + 1} {labels.of} {steps.length}
          </CardDescription>
        ) : null}
      </CardHeader>
      <form ref={formRef} onSubmit={handleSubmit}>
        <CardContent>
          <FieldSet>
            <FieldLegend>{step.title}</FieldLegend>
            {step.description ? (
              <FieldDescription>{step.description}</FieldDescription>
            ) : null}
            <FieldGroup>
              {step.fields.map((field) => {
                const id = `${idPrefix}-${step.id}-${field.name}`
                const error = invalidFields[field.name]
                return (
                  <Field key={field.name} data-invalid={Boolean(error)}>
                    <FieldLabel htmlFor={id}>
                      {field.label}
                      {field.required ? <span aria-hidden="true">*</span> : null}
                    </FieldLabel>
                    <LeadFieldControl
                      defaultValue={answers[field.name]}
                      field={field}
                      id={id}
                      invalid={Boolean(error)}
                      onInvalid={(event) => {
                        setInvalidFields((current) => ({
                          ...current,
                          [field.name]: event.currentTarget.validationMessage,
                        }))
                      }}
                    />
                    {field.description ? (
                      <FieldDescription>{field.description}</FieldDescription>
                    ) : null}
                    <FieldError>{error}</FieldError>
                  </Field>
                )
              })}
            </FieldGroup>
          </FieldSet>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] size-px opacity-0"
          />
          {status === "error" ? (
            <Alert variant="destructive" className="mt-6">
              <AlertCircleIcon aria-hidden="true" />
              <AlertDescription>{labels.error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="mt-6 justify-between gap-3 border-t">
          {isMultiStep && currentStep > 0 ? (
            <Button type="button" variant="outline" onClick={handlePrevious}>
              <ArrowLeftIcon aria-hidden="true" />
              {labels.previous}
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}
          {isLastStep ? (
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? <Spinner /> : null}
              {labels.submit}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              {labels.next}
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
