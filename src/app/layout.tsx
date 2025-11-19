import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salina Bookshelf ERP",
  description: "Publishing operations management platform",
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
