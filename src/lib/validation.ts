import { z } from "zod";

export const variantGid = z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/, "Invalid variant");

export const cartActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), variantId: variantGid, quantity: z.number().int().min(1).max(20) }),
  z.object({ action: z.literal("update"), lineId: z.string().min(1).max(400), quantity: z.number().int().min(0).max(99) }),
  z.object({ action: z.literal("remove"), lineId: z.string().min(1).max(400) }),
  z.object({ action: z.literal("discount"), code: z.string().trim().max(60) }),
  z.object({ action: z.literal("market") }),
  z.object({ action: z.literal("note"), note: z.string().trim().max(500) }),
  z.object({ action: z.literal("buyNow"), variantId: variantGid, quantity: z.number().int().min(1).max(20) }),
]);
export type CartAction = z.infer<typeof cartActionSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  /** which list to join */
  list: z.enum(["newsletter", "atelier"]).default("newsletter"),
  /** honeypot */
  website: z.string().max(0).optional(),
});

export const notifySchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  variantId: variantGid,
  website: z.string().max(0).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(4000),
  /** honeypot */
  website: z.string().max(0).optional(),
});

export const searchQuerySchema = z.string().trim().min(1).max(100);

export const handleListSchema = z
  .string()
  .max(2000)
  .transform((s) => s.split(",").map((h) => h.trim()).filter(Boolean))
  .pipe(z.array(z.string().regex(/^[a-z0-9][a-z0-9-_]*$/i).max(255)).max(50));

/** zod `flatten()` field errors into `{ field: message }`. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
