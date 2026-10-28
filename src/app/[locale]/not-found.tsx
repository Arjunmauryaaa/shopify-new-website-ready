import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="page page--narrow">
      <p className="label">Error 404</p>
      <h1 className="page-title">Page not found</h1>
      <EmptyState title="We can’t find that page." actions={[{ href: "/shop", label: "Continue shopping", primary: true }, { href: "/", label: "Back to home" }]}>
        The link may be out of date, or the page may have moved.
      </EmptyState>
    </div>
  );
}
