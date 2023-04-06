import React from 'react';
import getConfig from 'next/config';
import axios from 'axios';
import MapComponent from '../components/Map'
import GeoJsonFeatureCollectionType from '../interfaces/geoJsonFeatureCollection';

interface Result {
  data: GeoJsonFeatureCollectionType;
};

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();

const Maps = ({ data }: Result) => {
  return (
    <MapComponent data={data} />
  )
}

export async function getServerSideProps() {
  const url = `${baseUrl}/api/areas?simplify=0.001`;
  const { data }: Result = await axios.get(url)
  return {
    props: {
      data,
    },
  }
}

export default Maps