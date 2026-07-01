import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import GaRouteTracker from "@/components/analytics/GaRouteTracker";
import CartDrawer from "@/components/cart/CartDrawer";
import SiteFooter from "@/components/footer/SiteFooter";
import CartProvider from "@/lib/cart/CartProvider";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-dima-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-dima-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dima",
  applicationName: "Dima",
  description: "Dima",
  icons: {
    icon: [
      { url: "/assets/logo_dima.png", type: "image/png" },
    ],
    shortcut: ["/assets/logo_dima.png"],
    apple: ["/assets/logo_dima.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";

  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${manrope.variable} antialiased`}
      >
        <CartProvider>
          {gaId ? (
            <>
              <Script async
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                strategy="afterInteractive"
              />
              <Script id="ga4-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = window.gtag || gtag;
                  gtag('js', new Date());
                  gtag('config', '${gaId}', { send_page_view: false });
                `}
              </Script>
            </>
          ) : null}
          <Suspense fallback={null}>
            <GaRouteTracker />
          </Suspense>
          {children}
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
