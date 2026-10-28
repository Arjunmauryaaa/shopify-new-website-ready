import Link from "@/components/ui/link";

export default function NotFound() {
  return (
    <div className="page page--narrow empty">
      <h1 className="page-title">Page not found</h1>
      <p className="muted">The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/shop" className="btn btn--outline">Continue shopping</Link>
    </div>
  );
}
