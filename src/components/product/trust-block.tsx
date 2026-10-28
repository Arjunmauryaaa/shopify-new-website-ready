import { brand } from "@/config/brand";

/** Reassurance copy drawn only from configured, real policy values. Renders nothing when none are set. */
export function TrustBlock({ compact = false }: { compact?: boolean }) {
  const { promises, deliveryEstimate, paymentMethods } = brand.commerce;
  if (promises.length === 0 && !deliveryEstimate && paymentMethods.length === 0) return null;
  return (
    <div className={`trust ${compact ? "trust--compact" : ""}`}>
      {deliveryEstimate && <p className="small">{deliveryEstimate}</p>}
      {promises.length > 0 && (
        <ul className="small">
          {promises.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {paymentMethods.length > 0 && (
        <p className="small muted">
          <span className="label">Secure checkout</span> · {paymentMethods.join(" · ")}
        </p>
      )}
    </div>
  );
}
