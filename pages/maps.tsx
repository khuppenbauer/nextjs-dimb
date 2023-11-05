import React from 'react';
import getConfig from 'next/config';
import axios from 'axios';
import MapComponent from '../components/Map'
import GeoJsonFeatureCollectionType from '../interfaces/geoJsonFeatureCollection';
import MapProps from '../interfaces/mapProps';

interface Result {
  data: GeoJsonFeatureCollectionType;
};

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();

const Maps = ({ url, properties }: MapProps) => {
  return (
    <MapComponent url={url} properties={properties} />
  )
}

export async function getStaticProps() {
  const url = `${baseUrl}/api/igs`;
  const { data: { properties } }: Result = await axios.get(url)
  return {
    props: {
      url,
      properties,
    },
  }
}

export default Maps