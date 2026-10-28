import { missingProductionConfig } from "@/config/env";

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const missing = missingProductionConfig();
  if (missing.length === 0) return;

  const message = `[config] Missing required production configuration: ${missing.join(", ")}. See .env.example.`;
  if (process.env.STRICT_ENV === "true" || process.env.VERCEL_ENV === "production") {
    throw new Error(message);
  }
  console.error(message);
}
