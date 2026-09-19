import Script from "next/script";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GA_MEASUREMENT_ID } from "@/lib/analytics.config";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Public pages only - /admin sits outside this layout, so admin visits aren't counted. */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
          </Script>
        </>
      )}
      <AnnouncementBar />
      <Header />
      {children}
      <Footer />
    </>
  );
}
