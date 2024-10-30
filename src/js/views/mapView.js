import L, { popup } from 'leaflet';
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

  generateWeather() {
    return `<div class="weather__container hidden">
        <h4>Weather at workout time:</h4>
        <div class="weather_dates__container">
          <div class="temperature__data">
            <p>+13 <span>&#8451;</span></p>
          </div>
          <div class="wind__speed__data">
            <p>1 m/s <span>&#127811;</span></p>
          </div>
          <div class="humidity__data">
            <p>72% <span>&#128167;</span></p>
          </div>
        </div>
      </div>`;
  }

  // Show workout marker on map
  async generateWorkoutMarker(workout) {
    if (!workout) return;

    // when popup is close, hover doesn't work. Open as default
    let isPopupOpen = true;

    // creating marker and adding to map
    let mark = L.marker(workout.coords)
      .addTo(this._data.map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.adress ?? 'loading...')
      .openPopup();

    mark.on('popupopen', function () {
      isPopupOpen = true;
    });

    mark.on('popupclose', function () {
      isPopupOpen = false;
    });

    // Show weather data at workout time when hovering over marker
    mark.on('mouseover', function () {
      if (!isPopupOpen) return;
      const weatherString = String(
        `${workout.weather.temp} &#8451;, ${workout.weather.wind}m/s &#127811;, ${workout.weather.humidity}% &#128167;`
      );
      mark.setPopupContent(weatherString).openPopup();
    });
    mark.on('mouseout', function () {
      if (!isPopupOpen) return;
      mark.setPopupContent(workout.adress).openPopup();
    });

    return mark;
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

  // Adding event handlers ////////////////////////////////////////////////////////////////////////
  addHandlerZoomAll(handler) {
    buttonZoomOut.addEventListener('click', handler);
  }

  addHandlerDrawingMode(handler) {
    document.addEventListener('keydown', handler);
  }
}

export default new MapView();
