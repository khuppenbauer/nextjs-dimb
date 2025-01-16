import React from 'react';
import getConfig from 'next/config';
import MapComponent from '../components/Map'

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();

export default async function Home() {
  const url =  `${baseUrl}/api/igs?simplified=0.005`
  console.log(url)
  return (
    <MapComponent baseUrl={baseUrl} url={url} controls={['search', 'locate']} label={false} />
  )
}
