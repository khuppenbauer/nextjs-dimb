import sql from '@/lib/db';
import cors from '@/lib/cors';

interface Result {
  geo_point_2d: {
    lat: number;
    lon: number;
  }
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug
  if (slug) {
    const data = await sql<Result[]>`
      SELECT geo_point_2d FROM dimb_opendatasoft_plz_germany WHERE name = ${slug}
    `;
    if (data && data.length > 0) {
      const { geo_point_2d } = data[0];
      return cors(
        request,
        Response.json(geo_point_2d)
      )
    }
  }  
}
