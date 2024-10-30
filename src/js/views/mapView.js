// Imports
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

  // getting path to app state
  getData(data) {
    this._data = data;
  }

  // Loading map
  loadMap(position, renderMarkerHandler, clickHandler) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    // Leaflet library
    this._data.map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._data.map);

    // when clicking on map
    this._data.map.on('click', clickHandler);

    this._data.currentDrawing = L.polyline([], { color: 'red', opacity: 0.4 }).addTo(this._data.map);

    this._data.workouts.forEach(work => renderMarkerHandler(work));
  }

  // Show workout marker on map
  generateWorkoutMarker(workout) {
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
      // only if popup is open
      if (!isPopupOpen) return;
      const weatherString = String(
        `${workout.weather.temp} &#8451;, ${workout.weather.wind}m/s &#127811;, ${workout.weather.humidity}% &#128167;`
      );
      // show weather data
      mark.setPopupContent(weatherString).openPopup();
    });
    mark.on('mouseout', function () {
      // only if popup is open
      if (!isPopupOpen) return;
      // show old popup content
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

  /**
   * After adding workout, update with according color
   * @param {{Object}} stateData - path to state, where are app data are stored
   * @param {String} color - new color
   */
  updateDrawings(stateData, color) {
    // get last drawed lines
    const coords = stateData.polylinesGroup.slice(-1)[0];

    stateData.currentDrawing.setLatLngs([]);
    stateData.allDrawings.push(stateData.drawingUpdater);

    // color and opacity options
    coords.options.color = color;
    coords.options.opacity = '1';

    // show drawing on map
    coords.addTo(stateData.map);
  }

  // Adding event handlers ////////////////////////////////////////////////////////////////////////
  // When clicking show all markers button
  addHandlerZoomAll(handler) {
    buttonZoomOut.addEventListener('click', function (e) {
      e.stopPropagation();

      handler();
    });
  }

  // When clicking 'enter' key change drawing mode
  addHandlerDrawingMode(handler) {
    document.addEventListener('keydown', handler);
  }
}

export default new MapView();
