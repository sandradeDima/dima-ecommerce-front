"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { getPageTypeFromPath, trackPageView } from "@/lib/analytics/ga4";

export default function GaRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;

    const query = searchParams.toString();
    const routeKey = query ? `${pathname}?${query}` : pathname;
    if (lastTrackedRef.current === routeKey) return;

    let cancelled = false;
    let retryTimer: number | null = null;

    const sendPageView = () => {
      if (cancelled) return;

      const tracked = trackPageView(routeKey, getPageTypeFromPath(pathname));
      if (tracked) {
        lastTrackedRef.current = routeKey;
        return;
      }

      retryTimer = window.setTimeout(sendPageView, 300);
    };

    sendPageView();

    return () => {
      cancelled = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [pathname, searchParams]);

  return null;
}
