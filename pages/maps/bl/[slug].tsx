import React from 'react';
import getConfig from 'next/config';
import axios from 'axios';
import MapComponent from '../../../components/Map'
import GeoJsonFeatureCollectionType from '../../../interfaces/geoJsonFeatureCollection';
import MapProps from '../../../interfaces/mapProps';

interface Result {
  data: GeoJsonFeatureCollectionType;
};

interface Params {
  params: {
    slug: string[];
  }
};

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();

const Maps = ({ url, properties }: MapProps) => {
  return (
    <MapComponent url={url} properties={properties} controls={[]} label={false} />
  )
}

export async function getStaticProps({ params }: Params) {
  const { slug } = params;
  const url = `${baseUrl}/api/bl/${slug}?simplify=0.005`;
  const { data: { properties } }: Result = await axios.get(url)
  return {
    props: {
      url,
      properties,
    },
  }
}

export async function getStaticPaths() {
  const url = `${baseUrl}/api/paths?property=bundesland`;
  const { data }: any = await axios.get(url);
  return {
    paths: data.map((item: any) => ({ params: { slug: item.bundesland } })),
    fallback: false,
  }
}

export default Maps