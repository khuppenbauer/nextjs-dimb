import React from 'react';
import getConfig from 'next/config';
import axios from 'axios';
import MapComponent from '../../../components/Map'
import GeoJsonFeatureCollectionType from '../../../interfaces/geoJsonFeatureCollection';

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

const Maps = ({ data }: Result) => {
  if (!data) {
    return null;
  }
  return (
    <MapComponent data={data} />
  )
}

export async function getStaticProps({ params }: Params) {
  const { slug } = params;
  const url = `${baseUrl}/api/bl/${slug}`;
  const { data }: Result = await axios.get(url)
  return {
    props: {
      data,
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