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

export async function getStaticProps() {
  const url = `${baseUrl}/api/igs`;
  const { data }: Result = await axios.get(url)
  return {
    props: {
      data,
    },
  }
}

export default Maps