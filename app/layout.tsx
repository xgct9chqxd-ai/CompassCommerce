import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sans = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Compass Commerce",
    template: "%s | Compass Commerce",
  },
  description:
    "Commerce shell for Compass products, backed by the validated licensing service and ready for checkout, provisioning, and activation flows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        <div className="relative min-h-screen overflow-x-hidden">
          <SiteHeader />
          <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
            {children}
          </div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
