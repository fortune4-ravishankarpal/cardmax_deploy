import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Card max',
  title: 'Card max',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
