import type { ReactNode } from "react";
import Link from "@/components/ui/link";

/** A designed empty / error screen: a calm mark, a plain statement and clear next steps. */
export function EmptyState({ title, children, actions, role }: { title: string; children?: ReactNode; actions?: { href: string; label: string; primary?: boolean }[]; role?: "alert" }) {
  return (
    <div className="blank" role={role}>
      <svg className="blank__mark" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="44" />
        <path d="M24 78c14-22 30-22 36-6s24 14 36-8" />
        <circle cx="86" cy="36" r="5" />
      </svg>
      <h2 className="blank__title">{title}</h2>
      {children && <p className="muted blank__text">{children}</p>}
      {actions && (
        <div className="blank__actions">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className={`btn ${a.primary ? "btn--solid" : "btn--outline"}`}>{a.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
