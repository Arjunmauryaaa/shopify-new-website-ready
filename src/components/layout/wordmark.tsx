import Link from "@/components/ui/link";
import { brand } from "@/config/brand";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`wordmark ${className}`}>
      {brand.name}
    </Link>
  );
}
