import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from 'next/config';
import geobuf from 'geobuf';
import Pbf from 'pbf';
import axios from 'axios';
import sql from '../../lib/db';

interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
};

interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
};

interface GeoJsonFeature {
  type: 'Feature';
  geometry: GeoJsonPolygon | GeoJsonMultiPolygon;
  properties: {
    name: string;
  };
};

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};

interface Result {
  dimb_ig: string;
  geometry: string;
}

const {
  publicRuntimeConfig: { metaDataUrl },
} = getConfig();

async function getAreas() {
  const { data: metaData } = await axios({
    url: metaDataUrl,
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const areas: {[key: string]: any} = {};
  metaData.areas.forEach((area: any) => {
    const { name } = area;
    const areaName = `DIMB ${name}`;
    areas[areaName] = area;
  });
  return areas;
}

async function parseData(data: Result[]) {
  const areas = await getAreas();
  return data.map((item) => {
    const { dimb_ig, geometry } = item;
    const geoJson = JSON.parse(geometry);
    const { type, coordinates } = geoJson;
    const coords: number[][][] = [];

    if (type === 'Polygon') {
      coordinates.forEach((coordinate: number[][]) => {
        if (coordinate.length > 10) {
          coords.push(coordinate);
        }
      });
    } else if (type === 'MultiPolygon') {
      coordinates.forEach((coordinate: number[][][]) => {
        coordinate.forEach((coordinateItem: number[][]) => {
          if (coordinateItem.length > 10) {
            coords.push(coordinateItem);
          }
        });
      });
    }

    const properties = areas[dimb_ig] || { name: dimb_ig };
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: coords,
      },
      properties,
    } as GeoJsonFeature;
  });
}

async function insertCache(key: string, value: any) {
  const cache = await sql`
    insert into dimb_cache
      (key, value)
    values
      (${key}, ${value})
    returning key, value
  `
  return cache
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query } = req;

  if (method === 'GET') {
    let features = [];
    const simplify = query.simplify || 0;
    const format = query.format || 'json';
    
    const cacheKeys: any[] = [];
    Object.keys(query).forEach((item) => {
      if (item !== 'format') {
        const cacheItem = item === 'simplify' ? query[item] : `${item}_${query[item]}`;
        cacheKeys.push(cacheItem);
      }
    });
    const cacheKey = cacheKeys.length > 0 ? cacheKeys.join('-') : 'all';
    const cacheData = await sql`
      SELECT value FROM dimb_cache WHERE key = ${cacheKey}
    `;
    if (cacheData && cacheData.length > 0) {
      features = cacheData[0]['value'];
    } else {
      const data = await sql<Result[]>`
        SELECT dimb_ig, ST_AsGeoJSON(ST_Union(ST_Simplify(geometry, ${simplify}))) AS geometry
        FROM dimb_ig_plz AS dimb
        JOIN dimb_opendatasoft_plz_germany AS geodata
        ON geodata.plz_code = dimb.plz
        WHERE dimb_ig != 'N.N.'
        ${
          query.bl
            ? sql`AND bundesland = ${query.bl}`
            : sql``
        }
        ${
          query.ig
            ? sql`AND dimb_ig = ${query.ig}`
            : sql``
        }
        GROUP BY dimb_ig
      `;
      features = await parseData(data);
      await insertCache(cacheKey, features);
    }

    const featureCollection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
    }

    switch (format) {
      case 'geobuf':
        let result = '';
        const buffer = geobuf.encode(featureCollection, new Pbf());
        const bufView = new Uint16Array(buffer);
        for (let i = 0; i < bufView.length; i++) {
          result += String.fromCharCode(bufView[i]);
        }
        return res.status(200).send(result);
      default:
        return res.status(200).json(featureCollection);
    }
  }
}
