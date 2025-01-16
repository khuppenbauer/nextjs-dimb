import axios from 'axios';
import crypto from 'crypto';
import getConfig from 'next/config';
import { type NextRequest } from 'next/server'
import cors from '@/lib/cors';
import sql from '@/lib/db';
import parseFeature from '@/lib/feature';

interface Result {
  name: string;
  postcodes?: string;
  geometry: string;
}

interface Postcode { 
  postcode: string;
  [key: string]: any 
};

const {
  publicRuntimeConfig: { metaDataUrl },
} = getConfig();

const cache = async(name: string, meta: any, geometry: any, simplified: any, postcodes: any) => {  
  await sql`
    INSERT INTO dimb_ig
      (id, name, meta, geometry, simplified, postcodes)
    VALUES
      (${crypto.randomUUID()}, ${name}, ${meta}, ${geometry}, ${simplified}, ${postcodes})
    ON CONFLICT (name, simplified)
    DO UPDATE
    SET geometry = ${geometry}, meta = ${meta}, postcodes = ${postcodes}
  `
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const searchParams = request.nextUrl.searchParams
  const simplified = searchParams.get('simplified') || 0.005
  const slug = (await params).slug
  const result = await axios({
    url: `${metaDataUrl}/${slug}`,
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const { data: { area, status } } = result

  if (status === 404) {
    return Response.json({})
  }

  const { name, postcodes } = area
  delete area.postcodes
  const codes = postcodes.map((postcode: Postcode) => postcode.postcode);
  if (codes.length === 0) {
    return Response.json({})
  }

  if (name !== slug) {
    return Response.json({})
  }

  const data = await sql<Result[]>`
    SELECT ST_AsGeoJSON(ST_Simplify(ST_UNION(geometry), ${simplified})) AS geometry
    FROM dimb_opendatasoft_plz_germany
    WHERE name = ANY(${codes})
  `;

  const feature = parseFeature(data[0])

  cache(name, area, feature, simplified, postcodes)

  const item = {
    name,
    meta: area,
    postcodes,
    geometry: feature,
    simplified
  }

  return Response.json(item)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const searchParams = request.nextUrl.searchParams
  const simplified = searchParams.get('simplified') || 0.005
  const slug = (await params).slug

  const data = await sql<Result[]>`
    SELECT name, meta, postcodes, geometry FROM dimb_ig WHERE name = ${slug} AND simplified = ${simplified}
  `;
  if (data.length === 0) {
    return new Response('Not Found', {
      status: 404,
    })
  }
  return cors(
    request,
    Response.json(data[0])
  )
}
