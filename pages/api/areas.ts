import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from 'next/config';
import geobuf from 'geobuf';
import Pbf from 'pbf';
import * as turf from '@turf/turf'
import axios from 'axios';
import sql from '../../lib/db';
import GeoJsonFeatureCollectionType from '../../interfaces/geoJsonFeatureCollection';
import GeoJsonFeatureType from '../../interfaces/geoJsonFeature';

interface Result {
  dimb_ig: string;
  plz?: string;
  geometry: string;
}

const {
  publicRuntimeConfig: { metaDataUrl },
} = getConfig();

async function getAreas() {
  let metaData = null;
  const areas: {[key: string]: any} = {};
  try {
    const result = await axios({
      url: metaDataUrl,
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    metaData = result.data;
  } catch (error) {
    console.log(error);
  } finally {
    metaData?.areas.forEach((area: any) => {
      const { name } = area;
      const areaName = `DIMB ${name}`;
      areas[areaName] = area;
    });
  }
  return areas;
}

async function parseData(data: Result[]) {
  const areas = await getAreas();
  return data.map((item) => {
    const { dimb_ig, plz, geometry } = item;
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
    const properties = areas[dimb_ig] || { name: dimb_ig, plz: plz?.split(',') };
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: coords,
      },
      properties,
    } as GeoJsonFeatureType;
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
    
    if (query.pcode) {
      const data = await sql<Result[]>`
        SELECT dimb_ig
        FROM dimb_ig_plz
        ${
          query.pcode
            ? sql`WHERE plz = ${query.pcode}`
            : sql``
        }
      `;
      if (data && data.length > 0) {
        const { dimb_ig } = data[0];
        query.ig = dimb_ig;
        delete query.pcode;
      }
    }
    const cacheKeys: any[] = [];
    Object.keys(query).sort().forEach((item) => {
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
        SELECT dimb_ig, string_agg(dimb.plz, ',') as plz, ST_AsGeoJSON(ST_Union(ST_Simplify(geometry, ${simplify}))) AS geometry
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
      if (data.length > 0) {
        features = await parseData(data);
        if (features.length > 0) {
          await insertCache(cacheKey, features);
        }
      } else {
        return res.status(404).send('Not Found');
      }
    }

    const featureCollection: GeoJsonFeatureCollectionType = {
      type: 'FeatureCollection',
      features,
    }

    const bbox = turf.bbox(featureCollection);
    const center = turf.center(featureCollection);

    const geoJsonFeatureCollection: GeoJsonFeatureCollectionType = {
      ...featureCollection,
      properties: {
        center: center.geometry.coordinates,
        bbox,
      }
    }

    switch (format) {
      case 'geobuf':
        let result = '';
        const buffer = geobuf.encode(geoJsonFeatureCollection, new Pbf());
        const bufView = new Uint16Array(buffer);
        for (let i = 0; i < bufView.length; i++) {
          result += String.fromCharCode(bufView[i]);
        }
        return res.status(200).send(result);
      default:
        return res.status(200).json(geoJsonFeatureCollection);
    }
  }
}
