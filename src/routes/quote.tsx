import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ChevronDown, Clock3, Loader2, PhoneCall } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { PHONE_DISPLAY, PHONE_HREF, SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { saveQuoteSummary } from "@/lib/quote-request";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Get a Free Quote | Test Landscaping Co" },
      {
        name: "description",
        content: "Request a free landscaping quote in Bothell, WA.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Get a Free Quote | Test Landscaping Co" },
      {
        property: "og:description",
        content: "Request a free landscaping quote in Bothell, WA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuotePage,
});

// One style for every field (text boxes, dropdown, message box) so edges and heights line up.
// Fields with an error get a red border (aria-invalid drives it, so the look and the
// screen-reader state can't drift apart).
const fieldClass =
  "mt-1.5 block h-12 w-full rounded-md border border-input bg-background px-3 text-base font-normal text-foreground shadow-sm focus-visible:border-primary aria-invalid:border-destructive";
const labelClass = "block text-sm font-semibold text-foreground";

const SERVICES = ["Lawn Care", "Garden Design", "Yard Cleanup"];
const MESSAGE_MIN = 20;
const MESSAGE_MAX = 1000;

type FieldName = "name" | "phone" | "email" | "city" | "service" | "message";
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string | undefined>>;

// Page order, so "focus the first invalid field" follows what the visitor sees.
const FIELD_ORDER: FieldName[] = ["name", "phone", "email", "city", "service", "message"];

const EMPTY: Values = { name: "", phone: "", email: "", city: "", service: "", message: "" };

/** Ten digits once spaces, dashes, brackets, dots and an optional leading +1 are removed. */
function phoneDigits(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  else if (trimmed.startsWith("+")) return null; // "+" is only allowed as part of +1
  return digits.length === 10 ? digits : null;
}

function formatPhone(digits: string) {
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function validate(field: FieldName, raw: string): string | undefined {
  const value = raw.trim();
  switch (field) {
    case "name":
      if (!value) return "Please enter your name.";
      if (value.length < 2) return "Name must be at least 2 characters.";
      return;
    case "phone":
      if (!value) return "Please enter your phone number.";
      if (!phoneDigits(value)) return "Enter a 10-digit US phone number, like (425) 555-0100.";
      return;
    case "email":
      if (!value) return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value))
        return "Enter an email address like name@example.com.";
      return;
    case "city":
      if (!value) return "Please enter your city.";
      if (value.length < 2) return "City must be at least 2 characters.";
      return;
    case "service":
      if (!SERVICES.includes(value)) return "Please choose a service.";
      return;
    case "message":
      if (!value) return "Please describe the job.";
      if (value.length < MESSAGE_MIN)
        return `Please add a little more detail (at least ${MESSAGE_MIN} characters).`;
      if (value.length > MESSAGE_MAX)
        return `Please keep it under ${MESSAGE_MAX.toLocaleString("en-US")} characters.`;
      return;
  }
}

/** Trimmed values, with the phone number in (425) 555-0100 form. */
function clean(values: Values): Values {
  const digits = phoneDigits(values.phone);
  return {
    name: values.name.trim(),
    phone: digits ? formatPhone(digits) : values.phone.trim(),
    email: values.email.trim(),
    city: values.city.trim(),
    service: values.service,
    message: values.message.trim(),
  };
}

function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-destructive">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

function Field({
  field,
  label,
  error,
  className = "",
  children,
  extra,
}: {
  field: FieldName;
  label: string;
  error?: string | undefined;
  className?: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={`quote-${field}`} className={labelClass}>
        {label}
      </label>
      {children}
      <FieldError id={`quote-${field}-error`} message={error} />
      {extra}
    </div>
  );
}

function QuotePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "failed">("idle");

  // Shared props for each field: id, name, value, aria wiring and the change/blur rules.
  const fieldProps = (field: FieldName, describedBy: string[] = []) => {
    const error = errors[field];
    const ids = [...describedBy, error ? `quote-${field}-error` : ""].filter(Boolean);
    return {
      id: `quote-${field}`,
      name: field,
      value: values[field],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": ids.length ? ids.join(" ") : undefined,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setValues((v) => ({ ...v, [field]: value }));
        // Clear an error the moment the value is valid (or keep its wording current).
        // New errors only appear on blur or submit, not while someone is still typing.
        if (errors[field]) setErrors((errs) => ({ ...errs, [field]: validate(field, value) }));
      },
      onBlur: () => {
        const error = validate(field, values[field]);
        setErrors((errs) => ({ ...errs, [field]: error }));
        if (field === "phone" && !error) {
          setValues((v) => ({ ...v, phone: formatPhone(phoneDigits(v.phone)!) }));
        }
      },
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;

    const nextErrors: Errors = {};
    for (const field of FIELD_ORDER) nextErrors[field] = validate(field, values[field]);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      document.getElementById(`quote-${firstInvalid}`)?.focus();
      return;
    }

    const cleaned = clean(values);
    setValues((v) => ({ ...v, phone: cleaned.phone }));

    // Subject line of the owner's notification email.
    const subjectInput = form.elements.namedItem("subject") as HTMLInputElement | null;
    if (subjectInput) {
      subjectInput.value = `New quote request from ${cleaned.name} · ${cleaned.phone} · ${cleaned.service} in ${cleaned.city}`;
    }

    saveQuoteSummary({
      firstName: cleaned.name.split(/\s+/)[0] ?? cleaned.name,
      service: cleaned.service,
      city: cleaned.city,
      email: cleaned.email,
    });

    // form-name, bot-field and subject come from the form itself; the visible fields are sent
    // cleaned up (trimmed, phone formatted).
    const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
    for (const field of FIELD_ORDER) body.set(field, cleaned[field]);

    setStatus("sending");
    try {
      // Posted to the static copy of the form, as Netlify recommends for JavaScript-rendered
      // forms, so Netlify's form handler (not a page) receives it.
      const response = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!response.ok) throw new Error(`Form POST failed: ${response.status}`);
      await navigate({ to: "/thank-you" });
    } catch (error) {
      console.error(error);
      setStatus("failed");
    }
  };

  const sending = status === "sending";
  const messageLength = values.message.length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="bg-secondary py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
            Get a Free Quote
          </h1>

          {/* Phones and tablets: one short line, so the form starts on the first screen. */}
          <p className="mt-3 text-base text-muted-foreground lg:hidden">
            Prefer to talk?{" "}
            <a href={PHONE_HREF} className="font-bold text-primary underline underline-offset-4">
              Call {PHONE_DISPLAY}
            </a>
            . We reply within one business day.
          </p>

          <div className="mt-6 grid items-start gap-6 lg:mt-8 lg:grid-cols-[1.5fr_0.75fr]">
            {/* JavaScript on: validated here, sent with fetch, then routed to /thank-you.
                JavaScript off: the browser posts to Netlify and lands on /thank-you. */}
            <form
              name="quote"
              method="POST"
              action="/thank-you"
              data-netlify="true"
              netlify-honeypot="bot-field"
              noValidate
              onSubmit={handleSubmit}
              className="rounded-lg border border-border bg-card p-5 shadow-lg sm:p-8"
            >
              <input type="hidden" name="form-name" value="quote" />
              {/* Filled in just before sending; becomes the owner's email subject. */}
              <input type="hidden" name="subject" data-remove-prefix="" defaultValue="" />
              <p className="hidden">
                <label>
                  Don't fill this out: <input name="bot-field" tabIndex={-1} autoComplete="off" />
                </label>
              </p>

              <p className="mb-5 text-sm text-muted-foreground">All fields are required.</p>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field field="name" label="Name" error={errors.name}>
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    className={fieldClass}
                    {...fieldProps("name")}
                  />
                </Field>

                <Field field="phone" label="Phone" error={errors.phone}>
                  <input
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    className={fieldClass}
                    {...fieldProps("phone")}
                  />
                </Field>

                <Field field="email" label="Email" error={errors.email}>
                  <input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    spellCheck={false}
                    required
                    className={fieldClass}
                    {...fieldProps("email")}
                  />
                </Field>

                <Field field="city" label="City" error={errors.city}>
                  <input
                    type="text"
                    autoComplete="address-level2"
                    required
                    className={fieldClass}
                    {...fieldProps("city")}
                  />
                </Field>

                <Field
                  field="service"
                  label="Service"
                  error={errors.service}
                  className="sm:col-span-2"
                >
                  <span className="relative block">
                    {/* Starts on a placeholder so nobody sends "Lawn Care" by accident. */}
                    <select
                      required
                      className={`${fieldClass} appearance-none pr-10 ${values.service ? "" : "text-muted-foreground"}`}
                      {...fieldProps("service")}
                    >
                      <option value="" disabled>
                        Select a service
                      </option>
                      {SERVICES.map((service) => (
                        <option key={service} value={service} className="text-foreground">
                          {service}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 mt-0.5 size-5 -translate-y-1/2 text-muted-foreground"
                    />
                  </span>
                </Field>

                <Field
                  field="message"
                  label="Describe the job"
                  error={errors.message}
                  className="sm:col-span-2"
                  extra={
                    <p
                      id="quote-message-count"
                      className={`mt-1.5 text-sm tabular-nums ${messageLength > MESSAGE_MAX ? "font-semibold text-destructive" : "text-muted-foreground"}`}
                    >
                      Minimum {MESSAGE_MIN} characters · {messageLength.toLocaleString("en-US")} /{" "}
                      {MESSAGE_MAX.toLocaleString("en-US")}
                    </p>
                  }
                >
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g. Front lawn about 1,500 sq ft, weekly mowing from May"
                    className={`${fieldClass} h-auto min-h-28 py-3 placeholder:text-muted-foreground`}
                    {...fieldProps("message", ["quote-message-count"])}
                  />
                </Field>
              </div>

              {status === "failed" && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
                >
                  <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Sorry, your request didn't go through. Please try again, or call us at{" "}
                    <a href={PHONE_HREF} className="font-bold underline underline-offset-4">
                      {PHONE_DISPLAY}
                    </a>
                    . Everything you typed is still here.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant="accent"
                size="lg"
                disabled={sending}
                // Keep focus in the field while pressing: otherwise its blur error appears
                // mid-click, pushes the button down and the click misses. Submit checks all.
                onMouseDown={(e) => e.preventDefault()}
                className="mt-6 w-full sm:w-auto"
              >
                {sending ? (
                  <>
                    <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send Request"
                )}
              </Button>
            </form>

            {/* Desktop only: the call option sits beside the form. */}
            <aside className="hidden rounded-lg bg-primary p-6 text-primary-foreground shadow-lg lg:sticky lg:top-24 lg:block">
              <div className="flex size-12 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <PhoneCall aria-hidden="true" />
              </div>
              <p className="mt-5 font-heading text-lg font-bold">Prefer to talk?</p>
              <a
                href={PHONE_HREF}
                className="mt-2 block text-lg font-bold underline underline-offset-4"
              >
                Call {PHONE_DISPLAY}
              </a>
              <p className="mt-5 flex items-center gap-2 text-sm text-primary-foreground/80">
                <Clock3 className="size-4" aria-hidden="true" /> We reply within one business day.
              </p>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
