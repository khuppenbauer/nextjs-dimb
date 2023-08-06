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
  const url = `${baseUrl}/api/areas?ig=${slug}&simplify=0.001`;
  const { data }: Result = await axios.get(url)
  return {
    props: {
      data,
    },
  }
}

export async function getStaticPaths() {
  const url = `${baseUrl}/api/paths?property=dimb_ig`;
  const { data }: any = await axios.get(url);
  const paths: any = [];
  data.forEach((item: any) => {
    const { dimb_ig } = item;
    if (!dimb_ig.endsWith(" ")) {
      paths.push({
        params: {
          slug: dimb_ig
        }
      });
    }
  })
  return {
    paths,
    fallback: false,
  }
}

export default Maps