import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wiki - La Galipette Cendrée",
  description: "Dynamic wiki generated from Obsidian vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
