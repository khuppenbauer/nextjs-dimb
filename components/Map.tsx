import React, { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Select } from 'ol/interaction';
import { defaults as defaultInteractions } from 'ol/interaction';
import { transformExtent } from 'ol/proj';
import { Circle, Style, Fill, Stroke } from 'ol/style';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import Geolocation from 'ol/Geolocation';
import { Control } from 'ol/control';
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

      const positionFeature = new Feature();
      positionFeature.setStyle(
        new Style({
          image: new Circle({
            radius: 6,
            fill: new Fill({
              color: '#005ea9',
            }),
            stroke: new Stroke({
              color: '#fff',
              width: 2,
            }),
          }),
        })
      );

      const features = new GeoJSON({ featureProjection: 'EPSG:3857' }).readFeatures(data);
      features.push(positionFeature);
      
      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features,
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

      class GeolocationControl extends Control {
        constructor() {
          const button = document.createElement('button');
          button.innerHTML = `
            <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.39209 12C6.39257 9.40281 8.18171 7.16765 10.6654 6.66142C13.149 6.15518 15.6355 7.51885 16.6042 9.91847C17.5728 12.3181 16.7539 15.0854 14.6483 16.528C12.5426 17.9706 9.73656 17.6867 7.94624 15.85C6.95088 14.8288 6.39183 13.4439 6.39209 12V12Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.42535 12C9.42565 10.887 10.1925 9.92922 11.2568 9.71236C12.3212 9.4955 13.3867 10.08 13.8018 11.1084C14.2168 12.1367 13.8658 13.3226 12.9634 13.9407C12.0609 14.5589 10.8585 14.4372 10.0913 13.65C9.66473 13.2124 9.42519 12.6188 9.42535 12V12Z" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17.0079 11.25C16.5937 11.25 16.2579 11.5858 16.2579 12C16.2579 12.4142 16.5937 12.75 17.0079 12.75V11.25ZM18.525 12.75C18.9392 12.75 19.275 12.4142 19.275 12C19.275 11.5858 18.9392 11.25 18.525 11.25V12.75ZM4.875 11.25C4.46079 11.25 4.125 11.5858 4.125 12C4.125 12.4142 4.46079 12.75 4.875 12.75V11.25ZM6.3921 12.75C6.80631 12.75 7.1421 12.4142 7.1421 12C7.1421 11.5858 6.80631 11.25 6.3921 11.25V12.75ZM10.95 6.556C10.95 6.97021 11.2858 7.306 11.7 7.306C12.1142 7.306 12.45 6.97021 12.45 6.556H10.95ZM12.45 5C12.45 4.58579 12.1142 4.25 11.7 4.25C11.2858 4.25 10.95 4.58579 10.95 5H12.45ZM10.95 19C10.95 19.4142 11.2858 19.75 11.7 19.75C12.1142 19.75 12.45 19.4142 12.45 19H10.95ZM12.45 17.444C12.45 17.0298 12.1142 16.694 11.7 16.694C11.2858 16.694 10.95 17.0298 10.95 17.444H12.45ZM17.0079 12.75H18.525V11.25H17.0079V12.75ZM4.875 12.75H6.3921V11.25H4.875V12.75ZM12.45 6.556V5H10.95V6.556H12.45ZM12.45 19V17.444H10.95V19H12.45Z" fill="#000000"/>
            </svg>
          `;
      
          const element = document.createElement('div');
          element.className = 'ol-unselectable ol-control';
          element.style.left = '0.5em';
          element.style.top = '4em';
          element.appendChild(button);
      
          super({
            element: element,
          });
      
          button.addEventListener('click', this.handleGeolocation.bind(this), false);
        }

        handleGeolocation = () => {
          const geolocation = new Geolocation({
            tracking: true,
            trackingOptions: {
              enableHighAccuracy: true,
            },
            projection: newMap.getView().getProjection(),
          });
          geolocation.on('change:position', () => {
            const coordinates = geolocation.getPosition();
            if (coordinates) {
              const pixel = newMap.getPixelFromCoordinate(coordinates);
              const feature = newMap.forEachFeatureAtPixel(pixel, (feature) => {
                return feature;
              });
              newMap.getView().setCenter(coordinates);
              newMap.getView().setZoom(9);
              positionFeature.setGeometry(new Point(coordinates));
            }
          });
          geolocation.setTracking(true);
        };
      }
      newMap.addControl(new GeolocationControl());
    
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
