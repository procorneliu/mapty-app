import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const buttonZoomOut = document.querySelector('.btn__zoom-out');

class MapView {
  // Zoom out map view to see all markers
  mapZoomOut(data, map) {
    if (data) return;

    // New array with position of all markers
    const latLngs = data.map(marker => marker.getLatLng());
    // Creates a LatLngBounds object defined by the geographical points it contains.
    const bounds = L.latLngBounds(latLngs);

    // Set map view to bounds
    map.fitBounds(bounds);
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
