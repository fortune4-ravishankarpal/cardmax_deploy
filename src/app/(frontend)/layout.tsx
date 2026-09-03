import React from 'react'
import './styles.css'
import { PolicyBanner } from './components/PolicyBanner'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>
        <PolicyBanner />
        <main>{children}</main>
      </body>
    </html>
  )
}
