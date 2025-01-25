'use client'

import React from 'react';
import { useParams } from 'next/navigation'
import MapComponent from '@/components/Map'
  
export default function PageApp() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const params = useParams()
  const { slug } = params;
  const url =  `${baseUrl}/api/postcodes/${slug}/geometry`
  return (
    <MapComponent baseUrl={baseUrl} url={url} controls={['search', 'locate']} label={false} />
  )
}
