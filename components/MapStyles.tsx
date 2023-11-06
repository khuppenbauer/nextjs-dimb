import { Circle, Style, Fill, Stroke, Text } from 'ol/style';

const MapStyles = {
  labelStyle: new Style({
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
  }),

  polygonStyle: new Style({
    fill: new Fill({
      color: 'rgba(0, 94, 169, 0.2)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 94, 169, 0.7)',
      width: 2,
    }),
  }),

  selectStyle: new Style({
    fill: new Fill({
      color: 'rgba(0, 94, 169, 0.4)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 94, 169, 0.7)',
      width: 2,
    }),
  }),

  locationStyle: new Style({
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
  }),
}

export default MapStyles;
