// Imports
import * as model from './model.js';
import sidebarView from './views/sidebarView';
import mapView from './views/mapView';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Set custom options for the default icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

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
const buttonsContainer = document.querySelector('.buttons__container');
const messagesContainer = document.querySelector('.messages__container');
const buttonZoomOut = document.querySelector('.btn__zoom-out');

// CHECKPOINT:
// APPLICATION ARHITECTURE
class App {
  constructor() {
    this._getLocalStorage();

    model.getUserLocation(this._loadMap.bind(this));

    sidebarView.showButtons(model.state.workouts);
    form.addEventListener('submit', this._creatingNewWorkout.bind(this));
    inputType.addEventListener('change', sidebarView.toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMap.bind(this));
    workoutsList.addEventListener('click', this._deleteWorkout.bind(this));
    workoutsList.addEventListener('click', this._editWorkout.bind(this));
    clearAll.addEventListener('click', sidebarView.clearWorkouts.bind(this));
    buttonsContainer.addEventListener('click', this._addHandlerWorkoutsSort.bind(this));
    buttonZoomOut.addEventListener('click', this._mapZoomOut.bind(this));
    document.addEventListener('keydown', this._exitDrawingMode.bind(this));

    model.controlStateIndex(workoutsList);
  }

  // CHECKPOINT:

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    // Leaflet library
    model.state.map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(model.state.map);

    model.state.map.on('click', this._drawingPath.bind(this));
    model.state.map.on('click', model.toggleEditingMode.bind(this, false, inputType));
    model.state.map.on('click', sidebarView.clearAllSelected);

    model.state.currentDrawing = L.polyline([], { color: 'red', opacity: 0.4 }).addTo(model.state.map);

    model.state.workouts.forEach(work => this._renderWorkoutMarker(work));

    // Draw workout path after map is loaded
    model.controlDrawingsStorage();
  }

  _drawingPath(mapEvent) {
    model.state.mapEvent = mapEvent;

    if (!model.state.drawingMode) {
      form.classList.add('hidden');
      model.state.drawingUpdater = [];
      model.state.drawingMode = true;
    }

    model.state.drawingUpdater.push(Object.values(mapEvent.latlng));

    model.state.currentDrawing.setLatLngs(model.state.drawingUpdater);
  }

  _exitDrawingMode(e) {
    if (e.key === 'Enter' && model.state.drawingMode) {
      model.state.polylinesGroup.push(L.polyline(model.state.drawingUpdater, { color: 'red', opacity: 0.5 }));
      model.state.drawingMode = false;
      sidebarView.showForm();
    }
  }

  _creatingNewWorkout(e) {
    e.preventDefault();

    if (!model.state.editingMode) {
      this._newWorkout();
    } else {
      sidebarView.renderMessage('.message__edit');
      this._editSubmit();
    }
  }

  // Zoom out map view to see all markers
  _mapZoomOut() {
    mapView.mapZoomOut(model.state.markers, model.state.map);
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
    const { lat, lng } = model.state.mapEvent.latlng;
    let workout;

    // If type running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (!isInputValid(distance, duration, cadence) || !isPositive(distance, duration, cadence))
        return sidebarView.renderMessage('.message__error');

      sidebarView.renderMessage();

      // Render drawed lines
      mapView.updateDrawings(model.state, '#00c46a');

      // workout = new Running([lat, lng], distance, duration, cadence);
      workout = new model.Running([lat, lng], distance, duration, cadence);
    }

    // If type cycling, create cyclying object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check is data is valid
      if (!isInputValid(distance, duration, elevation) || !isPositive(distance, duration))
        return sidebarView.renderMessage('.message__error');

      sidebarView.renderMessage();

      // Render drawed lines
      mapView.updateDrawings(model.state, '#ffb545');

      // workout = new Cycling([lat, lng], distance, duration, elevation);
      workout = new model.Cycling([lat, lng], distance, duration, elevation);
    }

    // Push workout to workouts array
    model.state.workouts.push(workout);

    // Display marker on map
    this._renderWorkoutMarker(workout);

    // Display workout on list
    this._renderWorkout(workout);

    // Check for clear all
    sidebarView.showButtons(model.state.workouts);

    // Data local storage
    model.setLocalStorage(model.state.workouts, 'workouts');
    model.setLocalStorage(model.state.allDrawings, 'drawings');

    // Clear form + input fields
    sidebarView.hideForm();
  }

  // Show workout marker on map
  _renderWorkoutMarker(workout) {
    let mark = L.marker(workout.coords)
      .addTo(model.state.map)
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
    model.state.markers.push(mark);
  }

  // Show workout on list after completing form
  _renderWorkout(workout) {
    const html = sidebarView.generateWorkoutMarkup(workout);

    model.state.htmlContent.push(html);
    workoutsList.insertAdjacentHTML('afterbegin', html);

    model.controlStateIndex(workoutsList);
  }

  // Move to map marker when clicking workout from list
  _moveToMap(e) {
    const workoutEl = e.target.closest('.workout');

    // guard clause
    if (!workoutEl || e.target.closest('.edit__btn')) return;

    const workout = model.state.workouts.find(work => work.id === workoutEl.dataset.id);

    if (!workout) return;
    model.state.map.setView(workout.coords, model.state.mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // Clear form + input fields
    sidebarView.hideForm();

    // clear all workouts in editing and selected mode
    sidebarView.clearAllSelected();
    workoutEl.classList.add('selected__active');
  }

  // Delete workout by 'x' button
  _deleteWorkout(e) {
    const workoutEl = e.target.closest('.close__btn');

    if (!workoutEl) return;

    const workout = model.state.workouts.find(work => work.id === workoutEl.closest('.workout').dataset.id);

    if (!workout) return;

    const index = model.state.workouts.findIndex(work => work.id === workout.id);

    // remove workout from list
    model.state.workouts.splice(index, 1);
    model.state.htmlContent.splice(index, 1);

    workoutsList.innerHTML = '';

    model.state.htmlContent.slice().forEach(html => {
      workoutsList.insertAdjacentHTML('afterbegin', html);
    });

    // remove marker from map and array
    model.state.map.removeLayer(model.state.markers[index]);
    model.state.markers.splice(index, 1);

    // Check for clear all
    sidebarView.showButtons(model.state.workouts);

    // hide from
    sidebarView.hideForm();

    model.controlStateIndex(workoutsList);

    model.state.polylinesGroup[index].remove();
    model.state.polylinesGroup.splice(index, 1);
    model.state.allDrawings.splice(index, 1);

    // remove from local storage
    model.setLocalStorage(model.state.workouts, 'workouts');
    model.setLocalStorage(model.state.allDrawings, 'drawings');
  }

  // Edit existing workout on list
  _editWorkout(e) {
    const editEl = e.target.closest('.edit__btn');

    if (!editEl) return;

    // clear all workouts in editing mode
    sidebarView.clearAllSelected();
    const workout = e.target.closest('.workout');
    workout.classList.add('editing__active');

    sidebarView.showForm();

    model.toggleEditingMode(true, inputType);

    const content = model.state.htmlContent[model.state.index];

    const parse = new DOMParser();

    const html = parse.parseFromString(content, 'text/html').querySelector('.workout');

    if (html.classList.contains('workout--running')) {
      inputType.value = 'running';
      inputDistance.value = model.state.workouts[model.state.index].distance;
      inputDuration.value = model.state.workouts[model.state.index].duration;
      inputCadence.value = model.state.workouts[model.state.index].cadence;
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
    } else {
      inputType.value = 'cycling';
      inputDistance.value = model.state.workouts[model.state.index].distance;
      inputDuration.value = model.state.workouts[model.state.index].duration;
      inputElevation.value = model.state.workouts[model.state.index].elevationGain;
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation.closest('.form__row').classList.remove('form__row--hidden');
    }
  }

  _editSubmit() {
    const content = model.state.htmlContent[model.state.index];
    const work = model.state.workouts[model.state.index];

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

    model.state.htmlContent[model.state.index] = html.outerHTML;

    workoutsList.innerHTML = '';
    model.state.htmlContent.slice().forEach(html => {
      workoutsList.insertAdjacentHTML('afterbegin', html);
    });

    sidebarView.hideForm();

    model.toggleEditingMode(false, inputType);

    model.controlStateIndex(workoutsList);

    model.setLocalStorage(model.state.workouts, 'workouts');
  }

  _getLocalStorage() {
    model.state.workouts.forEach(work => this._renderWorkout(work));
  }

  _addHandlerWorkoutsSort(event) {
    const btn = event.target.closest('.btn__sort');
    if (!btn) return;
    btn.classList.toggle('active__sort');

    // Checking if button is already sorting list
    const isActive = btn.classList.contains('active__sort');
    // Checking if clicked button is for duration or distance sort
    const sortingByDuration = [btn.classList].join('').includes('duration');

    // If other buttons are active when clicking other button, throw them to default
    buttonsContainer.querySelectorAll('button').forEach(button => {
      if (button.classList.contains('active__sort') && button !== btn) {
        button.classList.remove('active__sort');
        button.children[0].innerHTML = '&#8595;';
      }
    });

    // Button arrow direction, UP or DOWN
    const arrowDirection = isActive ? '&#8593;' : '&#8595;';
    btn.children[0].innerHTML = arrowDirection;

    // Clearing view
    workoutsList.innerHTML = '';

    // If sort by value or render default
    if (isActive) {
      const newArray = model.state.workouts.slice().sort((a, b) => {
        // Sort by duration or distance
        return sortingByDuration ? b.duration - a.duration : b.distance - a.distance;
      });
      newArray.forEach(work => this._renderWorkout(work));
    } else {
      model.state.workouts.forEach(work => this._renderWorkout(work));
    }
  }
}

// Initialization function
const init = function () {};
init();

const app = new App();
