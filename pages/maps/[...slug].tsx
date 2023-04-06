import React from 'react';
import getConfig from 'next/config';
import axios from 'axios';
import MapComponent from '../../components/Map'
import GeoJsonFeatureCollectionType from '../../interfaces/geoJsonFeatureCollection';

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

export async function getServerSideProps({ params }: Params) {
  const { slug } = params;
  const property = slug[0];
  const name = slug[1];
  const url = `${baseUrl}/api/areas?${property}=${name}&simplify=0.001`;
  const { data }: Result = await axios.get(url)
  return {
    props: {
      data,
    },
  }
}

export default Maps