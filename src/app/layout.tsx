import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles.css";
import { Providers } from "@/app/Providers";

export const metadata: Metadata = {
  title: "PakDropship — Pakistan's #1 Vendor-Based Dropshipping Platform",
  description: "Start dropshipping in Pakistan with zero inventory. Connect with verified vendors, sell online, and let vendors ship directly to your customers via our COD network.",
  keywords: ["dropshipping pakistan", "sell online pakistan", "cod dropshipping", "pakdropship", "reseller pakistan", "vendor dropshipping", "shopify dropshipping pakistan"],
  authors: [{ name: "PakDropship" }],
  openGraph: {
    title: "PakDropship — Sell Without Inventory",
    description: "Start dropshipping in Pakistan with zero inventory. Connect with verified vendors, sell online, and let vendors ship directly to your customers.",
    url: "https://pakdropship.site",
    siteName: "PakDropship",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      }
    ],
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PakDropship — Sell Without Inventory",
    description: "Start dropshipping in Pakistan with zero inventory. Connect with verified vendors.",
    images: ["/og-image.jpg"],
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
