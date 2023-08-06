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
  const url = `${baseUrl}/api/areas?pcode=${slug}&simplify=0.001`;
  const { data }: Result = await axios.get(url)
  return {
    props: {
      data,
    },
  }
}

export async function getStaticPaths() {
  const url = `${baseUrl}/api/paths?property=plz`;
  const { data }: any = await axios.get(url);
  const paths: any = [];
  data.forEach((item: any) => {
  const { plz } = item;
    paths.push({
      params: {
        slug: plz
      }
    });
  })
  return {
    paths,
    fallback: false,
  }
}

export default Maps