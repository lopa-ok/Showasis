import type { Metadata } from 'next'
import "./globals.css";

export const metadata: Metadata = {
  title: "Showasis",
  description: "Showasis is a shower slot booking platform for stasis"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}