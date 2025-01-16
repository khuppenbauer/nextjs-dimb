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
      SELECT name, plz_code, plz_name, plz_name_long, krs_code, krs_name, lan_code, lan_name FROM dimb_opendatasoft_plz_germany WHERE name = ${slug}
    `;
    if (data && data.length > 0) {
      const item = data[0];
      return cors(
        request,
        Response.json(item)
      )
    }
  }  
}
