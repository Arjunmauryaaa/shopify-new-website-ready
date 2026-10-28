import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { ContactForm } from "@/components/forms/contact-form";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ title: "Contact", description: `Contact ${brand.name}.`, path: "/contact", locale });
}

export default function ContactPage() {
  const { email, phone, hours, address } = brand.support;
  return (
    <div className="page page--narrow">
      <header className="page-head">
        <h1 className="page-title">Contact</h1>
      </header>
      <div className="contact">
        <ContactForm />
        {(email || phone || hours || address) && (
          <aside className="contact__details" aria-label="Contact details">
            {email && <p><span className="label">Email</span><br /><a href={`mailto:${email}`}>{email}</a></p>}
            {phone && <p><span className="label">Phone</span><br /><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></p>}
            {hours && <p><span className="label">Hours</span><br />{hours}</p>}
            {address && <p><span className="label">Address</span><br />{address}</p>}
          </aside>
        )}
      </div>
    </div>
  );
}
