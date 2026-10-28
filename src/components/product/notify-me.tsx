"use client";

import { useState } from "react";
import { notifySchema } from "@/lib/validation";

type State = { status: "idle" | "loading" | "success" | "error"; message?: string };

/** Back-in-stock alert. Reports success only when the email provider confirms. */
export function NotifyMe({ variantId }: { variantId: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const check = notifySchema.safeParse({ email, variantId, website: (new FormData(e.currentTarget).get("website") as string) ?? "" });
    if (!check.success) return setState({ status: "error", message: check.error.issues[0]?.message ?? "Check your email address." });
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/notify-me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(check.data) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setEmail("");
        setState({ status: "success", message: "We'll email you as soon as it's back in stock." });
      } else setState({ status: "error", message: body.error ?? "Something went wrong." });
    } catch {
      setState({ status: "error", message: "Network problem — please try again." });
    }
  }

  return (
    <form className="notify" onSubmit={onSubmit} noValidate>
      <label htmlFor="notify-email" className="label">Notify me when available</label>
      <div className="newsletter__row">
        <input id="notify-email" type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={state.status === "error"} aria-describedby="notify-status" disabled={state.status === "loading"} />
        <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <button type="submit" disabled={state.status === "loading"}>{state.status === "loading" ? "Saving…" : "Notify me"}</button>
      </div>
      <p id="notify-status" role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "form-error small" : "small"}>{state.message}</p>
    </form>
  );
}
