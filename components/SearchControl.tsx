import getConfig from 'next/config';
import { Feature } from 'ol';
import { Control } from 'ol/control';
import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';

const {
  publicRuntimeConfig: { apiBaseUrl },
} = getConfig();

class SearchControl extends Control {

  private locationFeature: Feature;

    constructor(locationFeature: Feature) {
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

      this.locationFeature = locationFeature; // Store the reference to the map

      input.addEventListener('keydown', this.handleSearch.bind(this), false);    
      button.addEventListener('click', this.handleSearch.bind(this), false);
    }

    handleSearch = (e: any) => {
      if (e.key === 'Enter' || e.type === 'click') {
        const pcode = (document.getElementById('search-box') as HTMLInputElement).value;
        fetch(`${apiBaseUrl}/api/postcodes/${pcode}`)
          .then(function (response) {
            return response.json();
          })
          .then((json) => {
            const { geo_point_2d: { lat, lon } } = json;
            const coordinate = fromLonLat([lon, lat], 'EPSG:3857');
            this.getMap()?.getView().setCenter(coordinate);
            this.getMap()?.getView().setZoom(9);
            (document.getElementById('search-box') as HTMLInputElement).value = '';
            this.locationFeature.setGeometry(new Point(coordinate));
          });
      }
    };
  }

  export default SearchControl;
