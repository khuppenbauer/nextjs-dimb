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
    <MapComponent url={url} properties={properties} controls={['search', 'locate']} label={false} />
  )
}

export async function getStaticProps() {
  const url = `${baseUrl}/api/igs?simplify=0.005`;
  const { data: { properties } }: Result = await axios.get(url)
  return {
    props: {
      url,
      properties,
    },
  }
}

export default Maps