import Link from "@/components/ui/link";
import { brand, type NavItem } from "@/config/brand";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { MarketSelector } from "./market-selector";
import { Wordmark } from "./wordmark";

function Column({ title, items }: { title: string; items: readonly NavItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={title}>
      <h2 className="label">{title}</h2>
      <ul>
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href}>{i.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__grid">
        <Column title="Shop" items={brand.footer.shop} />
        <Column title="Customer service" items={brand.footer.service} />
        <Column title="About" items={brand.footer.about} />
        <div className="footer__newsletter">
          <NewsletterForm id="footer-newsletter" />
          {brand.footer.social.length > 0 && (
            <ul className="footer__social" aria-label="Social">
              {brand.footer.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener noreferrer" target="_blank">{s.label}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="footer__base">
        <Wordmark className="footer__wordmark" />
        <ul className="footer__legal">
          {brand.footer.legal.map((i) => (
            <li key={i.href}>
              <Link href={i.href}>{i.label}</Link>
            </li>
          ))}
        </ul>
        <p className="small muted">
          © {year} {brand.name}.
        </p>
        <MarketSelector className="footer__market" />
      </div>
    </footer>
  );
}
