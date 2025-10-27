import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pario Integration System',
  description: 'Modular Connector Plugin (MCP) System for integrations',
}

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