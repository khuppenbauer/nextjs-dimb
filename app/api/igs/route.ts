import axios from 'axios';
import getConfig from 'next/config';
import { type NextRequest } from 'next/server'
import GeoJsonFeatureType from '@/interfaces/geoJsonFeature';
import cors from '@/lib/cors';
import sql from '@/lib/db';
import featureCollection from '@/lib/featureCollection';

const {
  publicRuntimeConfig: { metaDataUrl, baseUrl },
} = getConfig();

interface Result {
  meta: any;
  geometry: GeoJsonFeatureType;
};

export async function POST(
  request: NextRequest
) {
  const searchParams = request.nextUrl.searchParams
  const simplified = searchParams.get('simplified') || 0.005
  const result = await axios({
    url: metaDataUrl,
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const { data: { areas } } = result

  areas.reduce(async (lastPromise: any, area: any) => {
    const accum: any = await lastPromise;
    const { name, active } = area;
    const url = `${baseUrl}/api/igs/${name}?simplified=${simplified}`;
    if (active) {
      await axios({
        url,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      await sql<Result[]>`
        DELETE FROM dimb_ig WHERE name = ${name}
      `;
    }
    return [...accum, {}];
  }, Promise.resolve([]));
  return Response.json({ result: "Ok" });
}

export async function GET(
  request: NextRequest
) {
  const searchParams = request.nextUrl.searchParams
  const simplified = searchParams.get('simplified') || 0.005
  const data = await sql<Result[]>`
    SELECT meta, geometry FROM dimb_ig WHERE simplified = ${simplified}
  `;
  const features: GeoJsonFeatureType[] = data.map((item) => {
    const { meta, geometry } = item;
    geometry.properties = meta;
    return geometry;
  })

  const geoJson = featureCollection(features);
  return cors(
    request,
    Response.json(geoJson)
  )
}
