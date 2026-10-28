"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page page--narrow empty" role="alert">
      <h1 className="page-title">Something went wrong</h1>
      <p className="muted">We couldn’t load this page. Please try again.</p>
      <button type="button" className="btn btn--outline" onClick={reset}>Try again</button>
    </div>
  );
}
