import type { Metadata } from "next"
import localFont from "next/font/local"
import "@/frontend/globals.css"
import { SessionProvider } from "next-auth/react"
import Navbar from "@/frontend/components/Navbar"
import SessionTimeout from "@/frontend/components/SessionTimeout"
import PWAInstall from "@/frontend/components/PWAInstall"

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
  manifest: "/manifest.json",
  themeColor: "#4338ca",
  icons: [
    {
      rel: "icon",
      type: "image/webp",
      sizes: "48x48",
      url: "/KJU_Logo.webp",
    },
    {
      rel: "apple-touch-icon",
      type: "image/webp",
      sizes: "192x192",
      url: "/KJU_Logo.webp",
    },
    {
      rel: "apple-touch-icon",
      type: "image/webp",
      sizes: "512x512",
      url: "/KJU_Logo.webp",
    },
  ],
  openGraph: {
    title: "KJIT Classroom",
    description: "GitHub-native project submission & portfolio management platform",
    type: "website",
    images: [
      {
        url: "/KJU_Logo.webp",
        width: 512,
        height: 512,
        alt: "KJIT Classroom",
      },
    ],
  },
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
        {/* PWA meta tags for install prompt and standalone mode */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KJIT Classroom" />

        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <SessionTimeout />
          <PWAInstall />
        </SessionProvider>
      </body>
    </html>
  )
}