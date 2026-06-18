import type { Metadata } from 'next'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import '../index.css'

export const metadata: Metadata = {
  title: 'Overthinking Lunch',
  description: 'A local AI ordering assistant for Flour + Water Pizzeria in San Francisco.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Theme accentColor="red" grayColor="sand" radius="small">
          {children}
        </Theme>
      </body>
    </html>
  )
}
