import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from 'next/config';
import sql from '../../../lib/db';
import featureCollection from '../../../lib/geojson';
import GeoJsonFeatureType from '../../../interfaces/geoJsonFeature';

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();

interface Result {
  meta: any;
  geometry: GeoJsonFeatureType;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query: { slug } } = req;
  if (method === 'GET') {
    if (slug) {
      let feature: GeoJsonFeatureType;
      const data = await sql<Result[]>`
        SELECT meta, geometry FROM dimb_ig WHERE name = ${slug}
      `;
      if (data && data.length > 0) {
        const { meta, geometry } = data[0];
        geometry.properties = meta;
        feature = geometry;

        const features = [feature];
        const geoJson = featureCollection(features);
  
        return res.status(200).send(geoJson);
      } else {
        return res.status(404).send('Not found');
      }
    }
  }
  return res.status(500);
}
