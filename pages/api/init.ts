import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from 'next/config';
import sql from '../../lib/db';

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();

async function insertCache(name: string, meta: any, geometry: any) {  
  const cache = await sql`
    INSERT INTO dimb_ig
      (name, meta, geometry)
    VALUES
      (${name}, ${meta}, ${geometry})
    ON CONFLICT (name)
    DO UPDATE
    SET geometry = ${geometry}
  `
  return cache
}

async function cacheAll() {
  const property = 'dimb_ig';
  const data = await sql`
    SELECT ${ sql(property) } FROM dimb_ig_plz GROUP BY ${ sql(property) } ORDER BY dimb_ig
  `;
  return data.reduce(async (lastPromise, item) => {
    const accum: any = await lastPromise;
    const { dimb_ig } = item;
    const url = `${baseUrl}/api/areas?ig=${dimb_ig}`;
    const { data } = await axios.get(url);
    const { features } = data;
    await insertCache(dimb_ig, features[0].properties, features[0]);
    return [...accum, {}];
  }, Promise.resolve([]));
}

async function cleanData() {  
  await sql`
    UPDATE dimb_ig_plz SET dimb_ig = TRIM(dimb_ig);
  `
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method } = req;

  if (method === 'GET') {
    await cleanData();
    await cacheAll();
    return res.status(200).send('Ok');
  }
  return res.status(500);
}
