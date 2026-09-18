import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "@/frontend/globals.css"
import { SessionProvider } from "next-auth/react"
import Navbar from "@/frontend/components/Navbar"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
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