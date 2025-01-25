import { type NextRequest } from 'next/server'
import cors from '@/lib/cors';
import sql from '@/lib/db';
import featureCollection from '@/lib/featureCollection';
import GeoJsonFeatureType from '@/interfaces/geoJsonFeature';

interface Result {
  name: string;
  geometry: string;
  plz: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug
  const searchParams = request.nextUrl.searchParams
  const simplified = searchParams.get('simplified') || 0.005
  const type = searchParams.get('type') || 'combined' 

  let data = [];
  if (type === 'combined') {
    data = await sql<Result[]>`
      SELECT ST_AsGeoJSON(ST_Simplify(ST_UNION(geometry), ${simplified})) AS geometry
      FROM dimb_ig_plz AS dimb
      JOIN dimb_opendatasoft_plz_germany AS geodata
      ON geodata.plz_code = dimb.plz
      WHERE dimb_ig = ${slug}
    `;
  } else {
    data = await sql<Result[]>`
      SELECT plz, ST_AsGeoJSON(geometry) AS geometry
      FROM dimb_ig_plz AS dimb
      JOIN dimb_opendatasoft_plz_germany AS geodata
      ON geodata.plz_code = dimb.plz
      WHERE dimb_ig = ${slug}
    `;
  }

  if (data.length === 0) {
    return new Response('Not Found', {
      status: 404,
    })
  }

  const features: GeoJsonFeatureType[] = data.map((item) => {
    const { geometry, plz } = item;
    return {
      type: 'Feature',
      geometry: JSON.parse(geometry),
      properties: {
        name: plz || slug,
      }
    }
  })

  const geoJson = featureCollection(features);

  return cors(
    request,
    Response.json(geoJson)
  )
}
