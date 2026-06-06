import type { Metadata } from "next";
import "./globals.css";
import NavigationProgress from "@/components/NavigationProgress";

export const metadata: Metadata = {
  metadataBase: new URL('https://payzati.com'),
  title: "Payzati — Pay Anyone. Anywhere. Instantly.",
  description: "Global B2B B2C Payroll & Settlement Platform powered by Interledger Protocol. Instant cross-border salary payments with near-zero fees and automatic tax compliance.",
  keywords: "payroll, global payments, interledger, ILP, cross-border, salary, fintech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Payzati',
              url: 'https://payzati.com',
              logo: 'https://payzati.com/logo.png',
            }),
          }}
        />
      </head>
      <body>
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}

