import { Feature } from 'ol';
import { Control } from 'ol/control';
import Geolocation from 'ol/Geolocation';
import { Point } from 'ol/geom';

class GeolocationControl extends Control {

  private locationFeature: Feature;

  constructor(locationFeature: Feature) {
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

    this.locationFeature = locationFeature; // Store the reference to the map

    button.addEventListener('click', this.handleGeolocation.bind(this), false);
  }

  handleGeolocation = () => {
    const geolocation = new Geolocation({
      tracking: true,
      trackingOptions: {
        enableHighAccuracy: true,
      },
      projection: this.getMap()?.getView().getProjection(),
    });
    geolocation.on('change:position', () => {
      const coordinate = geolocation.getPosition();
      if (coordinate) {
        this.getMap()?.getView()?.setCenter(coordinate);
        this.getMap()?.getView().setZoom(9);
        this.locationFeature.setGeometry(new Point(coordinate));
      }
    });
  };
}

export default GeolocationControl;
