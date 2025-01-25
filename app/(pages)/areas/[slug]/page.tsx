'use client'

import React from 'react';
import { useSearchParams, useParams } from 'next/navigation'
import MapComponent from '@/components/Map'
  
export default function PageApp() {
  const baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL as string
  const searchParams = useSearchParams()
  const simplified = searchParams.get('simplified') || 0.005
  const type = searchParams.get('type') || 'combined'
  const params = useParams()
  const { slug } = params;
  const url =  `${baseUrl}/api/areas/${slug}?simplified=${simplified}&type=${type}`
  return (
    <MapComponent baseUrl={baseUrl} url={url} controls={['search', 'locate']} label={false} />
  )
}
