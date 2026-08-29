import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";

// Display face: a grotesque with a width axis, run slightly expanded for headlines
// and big numbers - a back-page / matchday-programme voice rather than another
// geometric startup sans.
const archivo = Archivo({
  variable: "--ff-display",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

// Body face: warm, highly legible workhorse - not Inter.
const hanken = Hanken_Grotesk({
  variable: "--ff-body",
  subsets: ["latin"],
  display: "swap",
});

// Every number on the site (odds, confidence %, scores, form, countdown) is set
// in this, with tabular figures, so columns of data line up.
const geistMono = Geist_Mono({
  variable: "--ff-mono",
  subsets: ["latin"],
});

// Only used by the brand wordmark in <Logo>. The SVG geometry was drawn against
// Montserrat's metrics, so a fallback face makes the two words collide.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["900"],
  style: ["italic"],
  display: "swap",
});

const DESCRIPTION = "Statistical football predictions, odds, and confidence ratings, backed by a public results archive.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${hanken.variable} ${geistMono.variable} ${montserrat.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <ThemeScript />
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
