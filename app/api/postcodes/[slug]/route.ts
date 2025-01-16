import cors from '@/lib/cors';
import sql from '@/lib/db';

interface Result {
  geo_point_2d: {
    lat: number;
    lon: number;
  }
  geometry: string
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug
  if (slug) {
    const data = await sql<Result[]>`
      SELECT name, plz_code, plz_name, plz_name_long, krs_code, krs_name, lan_code, lan_name, geo_point_2d, ST_AsGeoJSON(geometry) as geometry FROM dimb_opendatasoft_plz_germany WHERE name = ${slug}
    `;
    if (data && data.length > 0) {
      const item = data[0];
      const { geometry } = data[0];
      const geoJson = JSON.parse(geometry);
      return cors(
        request,
        Response.json({...item, geometry: geoJson})
      )
    }
  }  
}
