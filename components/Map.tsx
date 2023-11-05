import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';
import { Map, View } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Select } from 'ol/interaction';
import { defaults as defaultInteractions } from 'ol/interaction';
import { transformExtent, fromLonLat } from 'ol/proj';
import { Circle, Style, Fill, Stroke, Text } from 'ol/style';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import Geolocation from 'ol/Geolocation';
import { Control } from 'ol/control';
import "ol/ol.css";
import MapProps from '../interfaces/mapProps';

interface PopupContent {
  name?: string;
  url?: string;
  description?: string;
  logo?: string;
  email?: string;
  website?: string;
  activities?: string[];
}

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();

function MapComponent({ url, properties, controls, label }: MapProps) {
  const [ popupContent, setPopupContent ] = useState<PopupContent>({});

  useEffect(() => {

    const labelStyle = new Style({
      text: new Text({
        font: '11px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(0, 94, 169)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 94, 169)',
          width: 1,
        }),
      }),
    });

    const polygonStyle = new Style({
      fill: new Fill({
        color: 'rgba(0, 94, 169, 0.2)',
      }),
      stroke: new Stroke({
        color: 'rgba(0, 94, 169, 0.7)',
        width: 2,
      }),
    });

    const style = label ? [polygonStyle, labelStyle] : [polygonStyle];
  
    const selectStyle = new Style({
      fill: new Fill({
        color: 'rgba(0, 94, 169, 0.4)',
      }),
      stroke: new Stroke({
        color: 'rgba(0, 94, 169, 0.7)',
        width: 2,
      }),
    });

    const source = new VectorSource({
      format: new GeoJSON,
      url,
    });
    
    const vectorLayer = new VectorLayer({
      source,
      style: function (feature) {
        const label = feature.get('name').split(' ').join('\n');
        labelStyle.getText().setText(label);
        return style;
      },
    });

    const selectInteraction = new Select({
      style: selectStyle,
    });

    const locationStyle = new Style({
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
    });
    const locationFeature = new Feature();
    locationFeature.setStyle(locationStyle);

    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
      interactions: label ? defaultInteractions() : defaultInteractions().extend([selectInteraction]),
    });

    if (properties) {
      const view: View = map.getView();
      const { bbox } = properties;
      const bboxTransformed = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
      view.fit(bboxTransformed, {
        size: map.getSize()!,
        padding: [50, 50, 50, 50],
      });

    }

    source.once('change', () => {
      if (source.getState() === 'ready') {
        const extent = source.getExtent();

        if (!extent || extent[0] === Infinity) {
          return;
        }
        map.getView().fit(extent, { padding: [50, 50, 50, 50] });
        source.addFeature(locationFeature);
      }
    });

    map.on('click', (event: any): void => {
      if (label) {
        return;
      }
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
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
    });

    if (controls.includes('locate')) {
      class GeolocationControl extends Control {
        constructor() {
          const button = document.createElement('button');
          button.innerHTML = '◎';
      
          const element = document.createElement('div');
          element.className = 'ol-unselectable ol-control locate';
          element.style.left = '0.5em';
          element.style.top = '5.5em';
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
            projection: map.getView().getProjection(),
          });
          geolocation.on('change:position', () => {
            const coordinate = geolocation.getPosition();
            if (coordinate) {
              map.getView().setCenter(coordinate);
              map.getView().setZoom(9);
              locationFeature.setGeometry(new Point(coordinate));
            }
          });
        };
      }
      map.addControl(new GeolocationControl());
    }

    if (controls.includes('search')) {
      class SearchControl extends Control {
        constructor() {
          const button = document.createElement('button');
          button.innerHTML = '&#128269;';
          const input = document.createElement('input');
          input.id = 'search-box';
          input.value = '';
          input.placeholder = 'PLZ';
          input.style.float = 'left';
          input.style.margin = '1px';
          input.style.width = '75px';
          input.style.height = '2.05em';
          input.style.padding = '5px';
      
          const element = document.createElement('div');
          element.className = 'ol-unselectable ol-control search';
          element.style.left = '3.5em';
          element.style.top = '0.5em';
          element.appendChild(input);
          element.appendChild(button);
      
          super({
            element: element,
          });
          input.addEventListener('keydown', this.handleSearch.bind(this), false);    
          button.addEventListener('click', this.handleSearch.bind(this), false);
        }
  
        handleSearch = (e: any) => {
          if (e.key === 'Enter' || e.type === 'click') {
            const pcode = (document.getElementById('search-box') as HTMLInputElement).value;
            fetch(`${baseUrl}/api/pcodes/${pcode}`)
              .then(function (response) {
                return response.json();
              })
              .then((json) => {
                const { lat, lon } = json;
                const coordinate = fromLonLat([lon, lat], 'EPSG:3857');
                map.getView().setCenter(coordinate);
                map.getView().setZoom(9);
                (document.getElementById('search-box') as HTMLInputElement).value = '';
                locationFeature.setGeometry(new Point(coordinate));
              });
          }
        };
      }
      map.addControl(new SearchControl());
    }
  
    return () => {
      map.setTarget('');
    };
  }, [url, properties, controls, label]);

  return (
    <div>
      <div id="map" style={{ height: '100vh' }} />
      <div id="popup" className="ol-popup absolute m-6 right-0 top-0">
        {popupContent.name && (
          <div className="border border-gray-200 p-6 rounded-lg bg-white">
            <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 cursor-pointer" onClick={() => setPopupContent({})}>&times;</button>
            {popupContent.logo && (
              <div className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 mb-4">
                <img src={popupContent.logo} width={40} height={40} alt={popupContent.name} />
              </div>
            )}
            <h2 className="text-lg text-gray-900 font-medium title-font mb-2">{popupContent.name}</h2>
            {popupContent.description && (<div dangerouslySetInnerHTML={{ __html: popupContent.description }} />)}
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
