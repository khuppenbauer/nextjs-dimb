import React, { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Select } from 'ol/interaction';
import { defaults as defaultInteractions } from 'ol/interaction';
import { transformExtent } from 'ol/proj';
import { Style, Fill, Stroke } from 'ol/style';
import "ol/ol.css";
import GeoJsonFeatureCollectionType from '../interfaces/geoJsonFeatureCollection';

interface Result {
  data: GeoJsonFeatureCollectionType;
}

interface PopupContent {
  name?: string;
  url?: string;
  description?: string;
  logo?: string;
  email?: string;
  website?: string;
  activities?: string[];
}

function MapComponent({ data }: Result) {
  const [ map, setMap ] = useState<Map>();
  const [ popupContent, setPopupContent ] = useState<PopupContent>({});

  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map>();
  mapRef.current = map;

  useEffect(() => {
    if (mapElement.current) {
      const style = new Style({
        fill: new Fill({
          color: 'rgba(0, 94, 169, 0.2)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 94, 169, 0.7)',
          width: 2,
        }),
      });
    
      const selectStyle = new Style({
        fill: new Fill({
          color: 'rgba(0, 94, 169, 0.4)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 94, 169, 0.7)',
          width: 2,
        }),
      });
      
      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: new GeoJSON({ featureProjection: 'EPSG:3857' }).readFeatures(data),
        }),
        style,
      });

      const selectInteraction = new Select({
        style: selectStyle,
      });

      const newMap = new Map({
        target: mapElement.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          vectorLayer,
        ],
        interactions: defaultInteractions().extend([selectInteraction]),
      });

      const view: View = newMap.getView();
      const { bbox } = data.properties;
      const bboxTransformed = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
      view.fit(bboxTransformed, {
        size: newMap.getSize()!,
        padding: [50, 50, 50, 50],
      });
      newMap.on('click', handleMapClick);
      setMap(newMap);

      return () => {
        newMap.setTarget('');
      };
    }
  }, [data]);

  const handleMapClick = (event: any): void => {
    if (mapRef.current) {
      const feature = mapRef.current.forEachFeatureAtPixel(event.pixel, (feature) => {
        return feature;
      });
      if (feature) {
        const properties = feature.getProperties();
        const { 
          name,
          url,
          activities, 
          'logo-url': logo, 
          contact: email, 
          description, 
          'site-url': website  
        } = properties;
        const popupContent = {
          name,
          url,
          description,
          logo: logo?.thumb || logo || '',
          activities,
          email,
          website,
        }
        setPopupContent(popupContent);
      } else {
        setPopupContent({});
      }
    }
  };
  return (
    <div>
      <div id="map" ref={mapElement} style={{ height: '100vh' }} />
      <div id="popup" className="ol-popup absolute m-6 right-0 bottom-0">
        {popupContent.name && (
          <div className="border border-gray-200 p-6 rounded-lg bg-white">
            {popupContent.logo && (
              <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 mb-4">
                <img src={popupContent.logo} width={40} height={40} alt={popupContent.name} />
              </div>
            )}
            <h2 className="text-lg text-gray-900 font-medium title-font mb-2">{popupContent.name}</h2>
            {popupContent.description && (<p className="leading-relaxed text-base"><div dangerouslySetInnerHTML={{ __html: popupContent.description }} /></p>)}
            {popupContent.activities && (
              <p className="leading-relaxed text-base">{popupContent.activities.join(', ')}</p>
            )}
            {(popupContent.email || popupContent.website) && (
              <div className="text-center leading-none flex w-full">
                <span className="text-gray-400 mr-3 inline-flex items-center leading-none text-base pr-3 py-1 border-r-2 border-gray-200">
                  {popupContent.email}
                </span>
                <span className="text-gray-400 inline-flex items-center leading-none text-base">
                  <a href={popupContent.website} target="_blank">{popupContent.website}</a>
                </span>
              </div>
            )}
            {(popupContent.url) && (
              <div className="text-center leading-none flex w-full">
                <span className="text-gray-400 mr-3 inline-flex items-center leading-none text-base pr-3 py-1 border-gray-200">
                  <a href={popupContent.url} target="_top">DIMB Website</a>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MapComponent;
