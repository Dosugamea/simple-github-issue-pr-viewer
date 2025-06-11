import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ApiKeyProvider } from "@/components/api-key-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GitHub Repository Viewer",
  description: "GitHub APIを使ったリポジトリ閲覧ツール",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ApiKeyProvider>
          {children}
          <Toaster />
        </ApiKeyProvider>
      </body>
    </html>
  )
}
