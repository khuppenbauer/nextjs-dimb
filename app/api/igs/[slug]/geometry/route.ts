import { type NextRequest } from 'next/server'
import cors from '@/lib/cors';
import sql from '@/lib/db';

interface Result {
  geometry: any;
  meta: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const searchParams = request.nextUrl.searchParams
  const simplified = searchParams.get('simplified') || 0.005
  const slug = (await params).slug

  const data = await sql<Result[]>`
    SELECT meta, geometry FROM dimb_ig WHERE name = ${slug} AND simplified = ${simplified}
  `;
  if (data.length === 0) {
    return new Response('Not Found', {
      status: 404,
    })
  }
  const { meta, geometry } = data[0];
  geometry.properties = meta;

  return cors(
    request,
    Response.json(geometry)
  )
}
