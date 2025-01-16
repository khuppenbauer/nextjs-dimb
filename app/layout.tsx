import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIMB Map",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
