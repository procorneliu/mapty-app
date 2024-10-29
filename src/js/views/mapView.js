import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Set custom options for the default icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const buttonZoomOut = document.querySelector('.btn__zoom-out');

class MapView {
  _data;

  getData(data) {
    this._data = data;
  }

  loadMap(position, renderMarkerHandler, clickHandler) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    // Leaflet library
    this._data.map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._data.map);

    this._data.map.on('click', clickHandler);

    this._data.currentDrawing = L.polyline([], { color: 'red', opacity: 0.4 }).addTo(this._data.map);

    this._data.workouts.forEach(work => renderMarkerHandler(work));
  }

  // Zoom out map view to see all markers
  showAllMarkers(markersData) {
    if (!markersData) return;

    // New array with position of all markers
    const latLngs = markersData.map(marker => marker.getLatLng());
    // Creates a LatLngBounds object defined by the geographical points it contains.
    const bounds = L.latLngBounds(latLngs);

    return bounds;
  }

  updateDrawings(stateData, color) {
    const coords = stateData.polylinesGroup.slice(-1)[0];

    stateData.currentDrawing.setLatLngs([]);
    stateData.allDrawings.push(stateData.drawingUpdater);

    coords.options.color = color;
    coords.options.opacity = '1';

    coords.addTo(stateData.map);
  }
}

export default new MapView();
