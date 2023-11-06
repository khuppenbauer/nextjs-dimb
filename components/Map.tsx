import React, { useEffect, useState } from 'react';
import { Map, View, Feature } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Select, defaults as defaultInteractions } from 'ol/interaction';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { transformExtent } from 'ol/proj';
import { OSM, Vector as VectorSource } from 'ol/source';
import "ol/ol.css";
import MapProps from '../interfaces/mapProps';
import MapStyles from './MapStyles';
import GeolocationControl from './GeolocationControl';
import SearchControl from './SearchControl';

interface PopupContent {
  name?: string;
  url?: string;
  description?: string;
  logo?: string;
  email?: string;
  website?: string;
  activities?: string[];
}

function MapComponent({ url, properties, controls, label }: MapProps) {
  const [ popupContent, setPopupContent ] = useState<PopupContent>({});

  useEffect(() => {
    const { labelStyle, polygonStyle, selectStyle, locationStyle } = MapStyles;
    const style = label ? [polygonStyle, labelStyle] : [polygonStyle];

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
      map.addControl(new GeolocationControl(locationFeature));
    }

    if (controls.includes('search')) {
      map.addControl(new SearchControl(locationFeature));
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
