import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Set custom options for the default icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

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
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription(this.type);
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription(this.type);
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

////////////////////////////////////////////////////////////
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const formInputs = document.querySelectorAll('.form__input');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const workoutsList = document.querySelector('.workouts__list');
const clearAll = document.querySelector('.clear__all');
// const editBtn = document.querySelector('.edit__btn');

// CHECKPOINT:
// APPLICATION ARHITECTURE
class App {
  #data;
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];
  #markers = [];
  #htmlContent = [];
  #isEditing = false;
  #index;
  constructor() {
    this._getLocalStorage();

    this._getPosition();
    this._showClearAll();
    form.addEventListener('submit', this._creatingNewWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMap.bind(this));
    workoutsList.addEventListener('click', this._deleteWorkout.bind(this));
    workoutsList.addEventListener('click', this._editWorkout.bind(this));
    clearAll.addEventListener('click', this._clearWorkouts.bind(this));

    this._indexDelegation();

    // document.querySelector('.show__all').addEventListener('click', this._showAllMarkers.bind(this));
  }

  // CHECKPOINT:

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
        alert('Cannot acces your position!');
      });
    }
  }

  _indexDelegation() {
    workoutsList.querySelectorAll('.edit__btn').forEach((btn, i) =>
      btn.addEventListener(
        'click',
        function () {
          // invert index
          this.#index = Math.abs(i - (this.#htmlContent.length - 1));
        }.bind(this)
      )
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    // Leaflet library
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#map.on('click', this._toggleEditing.bind(this, false));
    this.#map.on('click', this._clearAllSelected);

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  // _showAllMarkers() {
  //   const bounds = new L.LatLngBounds();

  //   bounds.extend(this.#markers.getLatLng());

  //   this.#map.fitBounds(bounds);
  // }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // Switching from running to cycling
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _clearAllSelected() {
    document.querySelectorAll('.workout').forEach(work => {
      work.classList.remove('editing__active');
      work.classList.remove('selected__active');
    });

    inputType.value = 'running';
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    inputCadence.closest('.form__row').classList.remove('form__row--hidden');
    inputElevation.closest('.form__row').classList.add('form__row--hidden');
  }

  _toggleEditing(bool) {
    this.#isEditing = bool;
    inputType.disabled = bool;
  }

  _creatingNewWorkout(e) {
    e.preventDefault();

    if (!this.#isEditing) {
      this._newWorkout();
    } else {
      this._editSubmit();
    }
  }

  _newWorkout() {
    // Check for form activity
    if (form.classList.contains('hidden')) return;

    const isInputValid = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every(inp => inp >= 1);

    // Get data from input
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If type running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check is data is valid
      if (!isInputValid(distance, duration, cadence) || !isPositive(distance, duration, cadence))
        return alert('Data needs to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If type cycling, create cyclying object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check is data is valid
      if (!isInputValid(distance, duration, elevation) || !isPositive(distance, duration))
        return alert('Data needs to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Push workout to workouts array
    this.#workouts.push(workout);

    // Display marker on map
    this._renderWorkoutMarker(workout);

    // Display workout on list
    this._renderWorkout(workout);

    // Check for clear all
    this._showClearAll();

    // Data local storage
    this._setLocalStorage();

    // Clear form + input fields
    this._hideForm();
    console.log(this.#workouts);
  }

  // Show workout marker on map
  _renderWorkoutMarker(workout) {
    let mark = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();
    this.#markers.push(mark);
  }

  // Show workout on list after completing form
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <span class="close__btn">&times;</span>
    <span class="edit__btn">&#9998;</span>
      <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
        
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value distance__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
          
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value duration__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
          `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value cadence__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value pace__value">${Math.trunc(workout.pace)}</span>
        <span class="workout__unit">min/km</span>
      </div>
    </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value elevationGain__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value speed__value">${Math.trunc(workout.speed)}</span>
        <span class="workout__unit">km/h</span>
      </div>
        
    </li>
      `;
    }
    this.#htmlContent.push(html);
    workoutsList.insertAdjacentHTML('afterbegin', html);

    this._indexDelegation();
  }

  // Move to map marker when clicking workout from list
  _moveToMap(e) {
    const workoutEl = e.target.closest('.workout');

    // guard clause
    if (!workoutEl || e.target.closest('.edit__btn')) return;

    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

    if (!workout) return;
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // Clear form + input fields
    this._hideForm();

    // clear all workouts in editing and selected mode
    this._clearAllSelected();
    workoutEl.classList.add('selected__active');
  }

  // Delete workout by 'x' button
  _deleteWorkout(e) {
    const workoutEl = e.target.closest('.close__btn');

    if (!workoutEl) return;

    const workout = this.#workouts.find(work => work.id === workoutEl.closest('.workout').dataset.id);

    if (!workout) return;

    const index = this.#workouts.findIndex(work => work.id === workout.id);

    // remove workout from list
    this.#workouts.splice(index, 1);
    this.#htmlContent.splice(index, 1);

    workoutsList.innerHTML = '';

    this.#htmlContent.slice().forEach(html => {
      workoutsList.insertAdjacentHTML('afterbegin', html);
    });

    // remove marker from map and array
    this.#map.removeLayer(this.#markers[index]);
    this.#markers.splice(index, 1);

    // Check for clear all
    this._showClearAll();

    // hide from
    this._hideForm();

    this._indexDelegation();

    // remove from local storage
    this._setLocalStorage();
  }

  // Edit existing workout on list
  _editWorkout(e) {
    const editEl = e.target.closest('.edit__btn');

    if (!editEl) return;

    // clear all workouts in editing mode
    this._clearAllSelected();
    const workout = e.target.closest('.workout');
    workout.classList.add('editing__active');

    this._showForm();

    this._toggleEditing(true);

    const content = this.#htmlContent[this.#index];
    const parse = new DOMParser();
    const html = parse.parseFromString(content, 'text/html').querySelector('.workout');

    if (html.classList.contains('workout--running')) {
      inputType.value = 'running';
      inputDistance.value = this.#workouts[this.#index].distance;
      inputDuration.value = this.#workouts[this.#index].duration;
      inputCadence.value = this.#workouts[this.#index].cadence;
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
    } else {
      inputType.value = 'cycling';
      inputDistance.value = this.#workouts[this.#index].distance;
      inputDuration.value = this.#workouts[this.#index].duration;
      inputElevation.value = this.#workouts[this.#index].elevationGain;
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation.closest('.form__row').classList.remove('form__row--hidden');
    }
  }

  _editSubmit() {
    const content = this.#htmlContent[this.#index];
    const work = this.#workouts[this.#index];

    // Convert text to html, for accesing data by class
    const parse = new DOMParser();
    const html = parse.parseFromString(content, 'text/html').querySelector('.workout');

    const isInputValid = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every(inp => inp >= 1);

    html.querySelector('.distance__value').textContent = inputDistance.value;
    html.querySelector('.duration__value').textContent = inputDuration.value;

    if (html.classList.contains('workout--running')) {
      if (
        !isInputValid(+inputDistance.value, +inputDuration.value, +inputCadence.value) ||
        !isPositive(+inputDistance.value, +inputDuration.value, +inputCadence.value)
      )
        return alert('Data needs to be positive numbers!');
      work.distance = +inputDistance.value;
      work.duration = +inputDuration.value;
      work.cadence = +inputCadence.value;
      const calcPace = Math.trunc(inputDuration.value / inputDistance.value);
      work.pace = calcPace;

      html.querySelector('.cadence__value').textContent = inputCadence.value;
      html.querySelector('.pace__value').textContent = calcPace;
    } else {
      if (
        !isInputValid(+inputDistance.value, +inputDuration.value, +inputElevation.value) ||
        !isPositive(+inputDistance.value, +inputDuration.value)
      )
        return alert('Data needs to be positive numbers!');
      work.distance = +inputDistance.value;
      work.duration = +inputDuration.value;
      work.elevationGain = +inputElevation.value;
      const calcSpeed = Math.trunc(inputDistance.value / (inputDuration.value / 60));
      work.speed = calcSpeed;
      html.querySelector('.elevationGain__value').textContent = inputElevation.value;
      html.querySelector('.speed__value').textContent = calcSpeed;
    }

    this.#htmlContent[this.#index] = html.outerHTML;

    workoutsList.innerHTML = '';
    this.#htmlContent.slice().forEach(html => {
      workoutsList.insertAdjacentHTML('afterbegin', html);
    });

    this._hideForm();

    this._toggleEditing(false);

    this._indexDelegation();

    this._setLocalStorage();
  }

  // Local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    this.#data = JSON.parse(localStorage.getItem('workouts'));

    if (!this.#data) return;

    this.#data.map(data => {
      if (data.type === 'running') Object.setPrototypeOf(data, Running.prototype);
      if (data.type === 'cycling') Object.setPrototypeOf(data, Cycling.prototype);
    });

    this.#workouts = this.#data;
    console.log(this.#workouts);

    this.#workouts.forEach(work => this._renderWorkout(work));
  }

  _showClearAll() {
    this.#workouts.length >= 1
      ? clearAll.classList.remove('clear__all--hidden')
      : clearAll.classList.add('clear__all--hidden');
  }

  // Clear local storage data
  _clearWorkouts() {
    localStorage.clear();
    location.reload();
  }
}

const app = new App();
