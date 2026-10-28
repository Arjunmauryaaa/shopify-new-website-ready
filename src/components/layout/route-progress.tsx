"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** A thin progress line while a page change is in flight, so slow connections never feel frozen. */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      setActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setActive(false), 10_000); // never get stuck if a navigation is cancelled
    };
    window.addEventListener("route:start", start);
    return () => {
      window.removeEventListener("route:start", start);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the finished navigation is what ends the indicator
    setActive(false);
  }, [pathname]);

  return <div className="route-progress" data-active={active} role="presentation" aria-hidden="true" />;
}
