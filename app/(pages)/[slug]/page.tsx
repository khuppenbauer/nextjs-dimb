import React from 'react';
import getConfig from 'next/config';
import MapComponent from '@/components/Map'

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();
  
export default async function PageApp({ params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url =  `${baseUrl}/api/igs/${slug}/geometry?simplified=0.005`
  return (
    <MapComponent baseUrl={baseUrl} url={url} controls={['search', 'locate']} label={false} />
  )
}