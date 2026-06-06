import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Payzati — Pay Anyone. Anywhere. Instantly.",
  description: "Global B2B Payroll & Settlement Platform powered by Interledger Protocol. Instant cross-border salary payments with near-zero fees and automatic tax compliance.",
  keywords: "payroll, global payments, interledger, ILP, cross-border, salary, fintech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
