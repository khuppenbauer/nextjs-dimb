'use client'

import { useSearchParams } from 'next/navigation'
import MapComponent from '../components/Map'

export default function Home() {
  const searchParams = useSearchParams()
  const simplified = searchParams.get('simplified') || 0.005
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const url = `${baseUrl}/api/igs?simplified=${simplified}`

  return (
    <MapComponent baseUrl={baseUrl} url={url} controls={['search', 'locate']} label={false} />
  )
}
