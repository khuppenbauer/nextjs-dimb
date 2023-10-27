import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../../lib/db';
import featureCollection from '../../../lib/geojson';
import GeoJsonFeatureType from '../../../interfaces/geoJsonFeature';

interface Result {
  meta: any;
  geometry: GeoJsonFeatureType;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method } = req;
  if (method === 'GET') {
    let data = await sql<Result[]>`
      SELECT meta, geometry FROM dimb_ig
    `;
    const features: GeoJsonFeatureType[] = data.map((item) => {
      const { meta, geometry } = item;
      geometry.properties = meta;
      return geometry;
    })
    
    const geoJson = featureCollection(features);

    return res.status(200).send(geoJson);
  }
  return res.status(500);
}
