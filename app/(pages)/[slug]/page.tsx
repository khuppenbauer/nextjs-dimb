'use client'

import React from 'react';
import { useSearchParams, useParams } from 'next/navigation'
import MapComponent from '@/components/Map'
  
export default function PageApp() {
  const searchParams = useSearchParams()
  const params = useParams()
  const simplified = searchParams.get('simplified') || 0.005
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const { slug } = params;
  const url =  `${baseUrl}/api/igs/${slug}/geometry?simplified=${simplified}`
  return (
    <MapComponent baseUrl={baseUrl} url={url} controls={['search', 'locate']} label={false} />
  )
}
