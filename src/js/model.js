// Imports
import L from 'leaflet';
import { API_KEY, API_URL } from './config';

// For reverse geocode
import Nominatim from 'nominatim-client';

// All page data are managed here
export const state = {
  data: {},
  map: {},
  mapEvent: {},
  mapZoomLevel: 13,
  editingMode: false,
  drawingMode: false,
  index: 0,
  workouts: [],
  markers: [],
  htmlContent: [],
  drawingUpdater: [],
  currentDrawing: '',
  polylinesGroup: [],
  allDrawings: [],
};
////////////////////////////////////////////////////////////////////////////////////////////////
//CHECKPOINT://////////////////////////////////////////////////////////////////////////////////

// Classes Declaration
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription(type) {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${type[0].toUpperCase()}${type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  async _setLocationAdress(lat, lng) {
    this.adress = this.adress ?? (await reverseGeocode(lat, lng));
  }

  async _getLocationWeather(lat, lng) {
    this.weather = this.weather ?? (await weatherData(lat, lng));
  }
}

export class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription(this.type);
    this._setLocationAdress(...this.coords);
    this._getLocationWeather(...this.coords);
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

export class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription(this.type);
    this._setLocationAdress(...this.coords);
    this._getLocationWeather(...this.coords);
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
//CHECKPOINT:///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

// Get current location of user
export const getUserLocation = function (succesFunction) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(succesFunction, function () {
      alert('Cannot acces your position!');
    });
  }
};

// enable/disable editing mode of workout
export const toggleEditingMode = function (bool, input) {
  state.editingMode = bool;
  input.disabled = bool;
};

// Getting index of clicked workout from workouts list
export const setStateIndex = function (index) {
  state.index = index;
};

// when pressing 'enter' button, save drawed lines and exit from drawing mode
export const exitDrawingMode = function () {
  state.polylinesGroup.push(L.polyline(state.drawingUpdater, { color: 'red', opacity: 0.5 }));
  state.drawingMode = false;
};

// when deleting workout, remove from storage and view
export const removingWorkoutData = function (index) {
  // remove marker from map and array
  state.map.removeLayer(state.markers[index]);
  state.markers.splice(index, 1);
  state.polylinesGroup[index].remove();
  state.polylinesGroup.splice(index, 1);
  state.allDrawings.splice(index, 1);

  // remove from local storage
  setLocalStorage(state.workouts, 'workouts');
  setLocalStorage(state.allDrawings, 'drawings');
};

// Translating a location [lattitude, longitude] on the map into address
export const reverseGeocode = async function (latitude, longitude) {
  try {
    const client = Nominatim.createClient({ useragent: 'mapty-app' });

    const results = await client.reverse({
      lat: latitude,
      lon: longitude,
    });

    const adressFormat = `${results.address.road ? results.address.road + ', ' : ''}${
      results.address.city ? results.address.city + ', ' : ''
    }${results.address.country}`;

    return adressFormat;
  } catch (error) {
    console.error(error);
  }
};

// Requesting current weather data based on map location
export const weatherData = async function (lat, lng) {
  try {
    const fetchPro = fetch(`${API_URL}weather?units=metric&lat=${lat}&lon=${lng}&appid=${API_KEY}`);

    const res = await fetchPro;
    const data = await res.json();

    const weatherData = {
      temp: data.main.temp,
      wind: data.wind.speed,
      humidity: data.main.humidity,
    };
    return weatherData;
  } catch (error) {
    console.log(error);
  }
};

// Save data in local storage
export const setLocalStorage = function (data, storageItem) {
  localStorage.setItem(storageItem, JSON.stringify(data));
};

// Get workouts data stored in local storge
const controlWorkoutStorage = function () {
  state.data = JSON.parse(localStorage.getItem('workouts'));
  if (!state.data) return;

  state.data.map(data => {
    if (!data) return;

    if (data.type === 'running') Object.setPrototypeOf(data, Running.prototype);
    if (data.type === 'cycling') Object.setPrototypeOf(data, Cycling.prototype);
  });

  state.workouts = state.data;
};

// Get drawings data stored in local storge
export const controlDrawingsStorage = function () {
  const data = JSON.parse(localStorage.getItem('drawings'));
  const workoutsData = state.data;

  if (!data) return;

  data.forEach((coords, i) => {
    if (!workoutsData[i]) return;
    const polyline = L.polyline(coords, {
      color: `${workoutsData[i].type === 'running' ? '#00c46a' : '#ffb545'} `,
    }).addTo(state.map);
    state.allDrawings.push(coords);
    state.polylinesGroup.push(polyline);
  });
};

// Initialization function
const init = function () {
  controlWorkoutStorage();
};
init();
