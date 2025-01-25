import cors from '@/lib/cors';
import sql from '@/lib/db';
import parseFeature from '@/lib/feature';

interface Result {
  geometry: string,
  name: string,
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug
  if (slug) {
    const data = await sql<Result[]>`
      SELECT ST_AsGeoJSON(ST_UNION(geometry)) as geometry FROM dimb_opendatasoft_plz_germany WHERE name = ${slug}
    `;
    if (data && data.length > 0) {
      const geoJson = {
        ...parseFeature(data[0]),
        properties: {
          name: slug
        }
      }

      return cors(
        request,
        Response.json(geoJson)
      )
    }
  }  
}
