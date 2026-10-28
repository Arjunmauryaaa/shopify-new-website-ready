"use client";

import { useState } from "react";
import { contactSchema, fieldErrors } from "@/lib/validation";

type State = { status: "idle" | "loading" | "success" | "error"; message?: string; fields: Record<string, string> };

export function ContactForm() {
  const [state, setState] = useState<State>({ status: "idle", fields: {} });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const check = contactSchema.safeParse(data);
    if (!check.success) {
      setState({ status: "error", message: "Please correct the highlighted fields.", fields: fieldErrors(check.error) });
      return;
    }
    setState({ status: "loading", fields: {} });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(check.data),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        form.reset();
        setState({ status: "success", message: "Thank you — your message has been sent.", fields: {} });
      } else {
        setState({ status: "error", message: body.error ?? "Something went wrong.", fields: body.fields ?? {} });
      }
    } catch {
      setState({ status: "error", message: "Network problem — please try again.", fields: {} });
    }
  }

  const f = state.fields;
  const busy = state.status === "loading";
  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="c-name">Name</label>
        <input id="c-name" name="name" autoComplete="name" required aria-invalid={Boolean(f.name)} aria-describedby={f.name ? "c-name-err" : undefined} disabled={busy} />
        {f.name && <p id="c-name-err" className="form-error small">{f.name}</p>}
      </div>
      <div className="field">
        <label htmlFor="c-email">Email</label>
        <input id="c-email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(f.email)} aria-describedby={f.email ? "c-email-err" : undefined} disabled={busy} />
        {f.email && <p id="c-email-err" className="form-error small">{f.email}</p>}
      </div>
      <div className="field">
        <label htmlFor="c-message">Message</label>
        <textarea id="c-message" name="message" rows={6} required aria-invalid={Boolean(f.message)} aria-describedby={f.message ? "c-message-err" : undefined} disabled={busy} />
        {f.message && <p id="c-message-err" className="form-error small">{f.message}</p>}
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <button type="submit" className="btn btn--solid" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
      <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "form-error" : ""}>{state.message}</p>
    </form>
  );
}
