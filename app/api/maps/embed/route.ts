import { NextRequest, NextResponse } from "next/server";
import {
  isPotentialGoogleMapsShortUrl,
  resolveMapEmbedSrc,
} from "@/lib/maps/googleMaps";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();

  if (!rawUrl) {
    return NextResponse.json({ embedSrc: resolveMapEmbedSrc(null) });
  }

  let resolvedUrl = rawUrl;

  if (isPotentialGoogleMapsShortUrl(rawUrl)) {
    try {
      const response = await fetch(rawUrl, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
      });

      if (response.url) {
        resolvedUrl = response.url;
      }
    } catch {
      resolvedUrl = rawUrl;
    }
  }

  return NextResponse.json({
    embedSrc: resolveMapEmbedSrc(resolvedUrl),
    resolvedUrl,
  });
}
