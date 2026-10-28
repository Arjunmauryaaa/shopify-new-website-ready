"use client";

import { EmptyState } from "@/components/ui/empty-state";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page page--narrow">
      <h1 className="page-title">Something went wrong</h1>
      <EmptyState title="We couldn’t load this page." role="alert" actions={[{ href: "/shop", label: "Go to the shop" }]}>
        This is usually temporary. Try again, or come back in a moment.
      </EmptyState>
      <button type="button" className="btn btn--solid" onClick={reset}>Try again</button>
    </div>
  );
}
