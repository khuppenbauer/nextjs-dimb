import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query: { code } } = req;
  if (method === 'GET') {
    return res.status(200).json(code);
  }
}
