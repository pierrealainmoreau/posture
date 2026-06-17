import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { SiteFooter } from "@/components/SiteFooter";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Posture — La 3ème main du manager",
  description: "La 3ème main du manager. Une suite d'outils IA pour mieux communiquer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} bg-background text-foreground flex flex-col min-h-screen`}>
        <LanguageProvider>
          <AnalyticsTracker />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
