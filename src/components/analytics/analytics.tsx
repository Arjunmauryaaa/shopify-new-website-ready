"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import {
  analyticsConfig as cfg,
  analyticsEnabled,
  CONSENT_EVENT,
  readConsent,
  track,
  writeConsent,
  type Consent,
} from "@/lib/analytics";

/** Loads configured tracking scripts only after the visitor accepts, and renders the consent banner. */
export function Analytics() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate stored choice after mount
    setConsent(readConsent());
    setReady(true);
    const onChange = (e: Event) => setConsent((e as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (consent === "granted") track({ name: "page_view", path: pathname });
  }, [consent, pathname]);

  if (!analyticsEnabled() || !ready) return null;

  return (
    <>
      {consent === "granted" && (
        <>
          {(cfg.ga4 || cfg.googleAds) && (
            <>
              <Script src={`https://www.googletagmanager.com/gtag/js?id=${cfg.ga4 || cfg.googleAds}`} strategy="afterInteractive" />
              <Script id="gtag-init" strategy="afterInteractive">{`
                window.dataLayer = window.dataLayer || [];
                window.gtag = function(){ dataLayer.push(arguments); };
                gtag('js', new Date());
                ${cfg.ga4 ? `gtag('config', ${JSON.stringify(cfg.ga4)}, { send_page_view: false });` : ""}
                ${cfg.googleAds ? `gtag('config', ${JSON.stringify(cfg.googleAds)});` : ""}
              `}</Script>
            </>
          )}
          {cfg.meta && (
            <Script id="meta-pixel" strategy="afterInteractive">{`
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', ${JSON.stringify(cfg.meta)});
            `}</Script>
          )}
          {cfg.klaviyo && (
            <Script src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${encodeURIComponent(cfg.klaviyo)}`} strategy="afterInteractive" />
          )}
        </>
      )}

      {consent === null && (
        <div className="consent" role="dialog" aria-modal="false" aria-label="Cookie preferences">
          <p className="small">
            We use cookies for analytics and to measure our advertising. You can accept or decline; the store works either way.
          </p>
          <div className="consent__actions">
            <button type="button" className="btn btn--outline" onClick={() => writeConsent("denied")}>Decline</button>
            <button type="button" className="btn btn--solid" onClick={() => writeConsent("granted")}>Accept</button>
          </div>
        </div>
      )}
    </>
  );
}
