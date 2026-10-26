import type { Metadata } from "next"
import localFont from "next/font/local"
import "@/frontend/globals.css"
import { SessionProvider } from "next-auth/react"
import Navbar from "@/frontend/components/Navbar"

// Self-hosted so `next build` never needs egress to fonts.googleapis.com —
// builds run on locked-down CI agents and offline machines. Files are the
// variable (latin subset) builds; see src/frontend/fonts/README.md.
const inter = localFont({
  src: "../frontend/fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
})

const jetbrainsMono = localFont({
  src: "../frontend/fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  style: "normal",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
})

export const metadata: Metadata = {
  title: "KJIT Classroom",
  description: "GitHub-native project submission & portfolio management platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </SessionProvider>
      </body>
    </html>
  )
}