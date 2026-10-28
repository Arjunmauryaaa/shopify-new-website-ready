"use client";

import { useState } from "react";
import { newsletterSchema } from "@/lib/validation";

type State = { status: "idle" | "loading" | "success" | "error"; message?: string };

export function NewsletterForm({ id = "newsletter", list = "newsletter", label = "Newsletter", button = "Subscribe", success = "Thank you — you're subscribed." }: { id?: string; list?: "newsletter" | "atelier"; label?: string; button?: string; success?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const honeypot = (new FormData(e.currentTarget).get("website") as string) ?? "";
    const check = newsletterSchema.safeParse({ email, website: honeypot, list });
    if (!check.success) {
      setState({ status: "error", message: check.error.issues[0]?.message ?? "Enter a valid email address." });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(check.data),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setEmail("");
        setState({ status: "success", message: success });
      } else {
        setState({ status: "error", message: body.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setState({ status: "error", message: "Network problem — please try again." });
    }
  }

  const describedBy = `${id}-status`;
  return (
    <form className="newsletter" onSubmit={onSubmit} noValidate>
      <label htmlFor={`${id}-email`} className="label">{label}</label>
      <div className="newsletter__row">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={state.status === "error"}
          aria-describedby={describedBy}
          disabled={state.status === "loading"}
        />
        <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <button type="submit" disabled={state.status === "loading"}>
          {state.status === "loading" ? "Sending…" : button}
        </button>
      </div>
      <p id={describedBy} role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "form-error small" : "small"}>
        {state.message}
      </p>
    </form>
  );
}
