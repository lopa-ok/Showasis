import type { Metadata } from 'next'
import "./globals.css";

export const metadata: Metadata = {
  title: "Showasis",
  description: "Showasis is a shower booking platform"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-textPrimary antialiased">
        {children}
      </body>
    </html>
  )
}