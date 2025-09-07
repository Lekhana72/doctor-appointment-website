import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"
import { Chatbot } from "@/components/chatbot"
import { Suspense } from "react"
import { NotificationsProvider } from "@/components/notifications-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NotificationsProvider>
            <Suspense fallback={null}>
              {children}
              <Chatbot />
            </Suspense>
          </NotificationsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
