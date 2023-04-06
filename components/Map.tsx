import React, { useEffect, useRef } from 'react';
import { Map } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { transformExtent } from "ol/proj";
import { Style, Fill, Stroke } from 'ol/style';
import "ol/ol.css";
import GeoJsonFeatureCollectionType from '../interfaces/geoJsonFeatureCollection';

interface Result {
  data: GeoJsonFeatureCollectionType;
};

function MapComponent({ data }: Result) {
  const mapRef = useRef(null);
  useEffect(() => {
    if (!mapRef.current) return;

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: new GeoJSON({ featureProjection: 'EPSG:3857' }).readFeatures(data),
      }),
      style: new Style({
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: 'blue',
          width: 2,
        }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
    });
    const view = map.getView();
    const { properties: { bbox } } = data;
    const bboxTransformed = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
    view.fit(bboxTransformed, {
      size: map.getSize(),
      padding: [50, 50, 50, 50],
    });
  }, [data]);
  return (
    <div ref={mapRef} style={{ height: '100vH', width: '100%' }} />
  );
}

export default MapComponent;
