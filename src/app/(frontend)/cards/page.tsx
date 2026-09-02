import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { MyCards } from '@/components/cards/my-cards'

export default async function CardsPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users') {
    redirect('/login')
  }

  return (
    <main className="cards-page">
      <MyCards />
    </main>
  )
}