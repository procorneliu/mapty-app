// Imports
import * as model from './model.js';
import sidebarView from './views/sidebarView';
import mapView from './views/mapView';

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

// APPLICATION CHECKPOINT:

const controlMap = function (position) {
  mapView.loadMap(position, renderWorkoutMarker, mapHandler);

  // Draw workout path after map is loaded
  model.controlDrawingsStorage();
};

// On map click
const mapHandler = function (mapEvent) {
  drawingPath(mapEvent);
  sidebarView.toggleEditingMode(false);
  sidebarView.clearAllSelected();
};

const drawingPath = function (mapEvent) {
  model.state.mapEvent = mapEvent;

  if (!model.state.drawingMode) {
    form.classList.add('hidden');
    model.state.drawingUpdater = [];
    model.state.drawingMode = true;
  }

  model.state.drawingUpdater.push(Object.values(mapEvent.latlng));

  model.state.currentDrawing.setLatLngs(model.state.drawingUpdater);
};

const controlDrawingMode = function (e) {
  if (e.key === 'Enter' && model.state.drawingMode) {
    model.exitDrawingMode();
    sidebarView.showForm();
  }
};

const creatingNewWorkout = function (e) {
  e.preventDefault();

  if (!model.state.editingMode) {
    controlWorkouts();
  } else {
    sidebarView.renderMessage('.message__edit');
    editSubmit();
  }
};

// Zoom out map view to see all markers
const controlMapZoomOut = function () {
  const bounds = mapView.showAllMarkers(model.state.markers);

  // Set map view to bounds
  model.state.map.fitBounds(bounds);
};

const controlWorkouts = function () {
  const workout = sidebarView.newWorkout(createRunningObject, createCyclingObject);

  // Push workout to workouts array
  model.state.workouts.push(workout);

  // Display marker on map
  renderWorkoutMarker(workout);

  // Display workout on list
  renderWorkout(workout);

  // Check for clear all
  sidebarView.showButtons(model.state.workouts);

  // Data local storage
  model.setLocalStorage(model.state.workouts, 'workouts');
  model.setLocalStorage(model.state.allDrawings, 'drawings');

  // Clear form + input fields
  sidebarView.hideForm();
};

// Show workout marker on map
const renderWorkoutMarker = function (workout) {
  const mark = sidebarView.generateWorkoutMarker(workout);
  model.state.markers.push(mark);
};

// Show workout on list after completing form
const renderWorkout = function (workout) {
  const html = sidebarView.generateWorkoutMarkup(workout);

  model.state.htmlContent.push(html);
  workoutsList.insertAdjacentHTML('afterbegin', html);

  model.controlStateIndex(workoutsList);
};

// // Move to map marker when clicking workout from list
const controlMoveToMap = function (event) {
  sidebarView.moveToMarker(event);
};

// Delete workout by 'x' button
const controlDeleteWorkout = function (e) {
  const workoutEl = e.target.closest('.close__btn');
  if (!workoutEl) return;

  const workout = model.state.workouts.find(work => work.id === workoutEl.closest('.workout').dataset.id);
  if (!workout) return;

  const index = model.state.workouts.findIndex(work => work.id === workout.id);

  workoutsList.innerHTML = '';

  // Check for clear all
  sidebarView.showButtons(model.state.workouts);

  // hide from
  sidebarView.hideForm();

  // remove workout from list
  model.state.workouts.splice(index, 1);
  model.state.htmlContent.splice(index, 1);

  model.state.htmlContent.slice().forEach(html => {
    workoutsList.insertAdjacentHTML('afterbegin', html);
  });

  // remove marker from map and array
  model.state.map.removeLayer(model.state.markers[index]);
  model.state.markers.splice(index, 1);

  // // Check for clear all
  // sidebarView.showButtons(model.state.workouts);

  // // hide from
  // sidebarView.hideForm();

  model.controlStateIndex(workoutsList);

  model.state.polylinesGroup[index].remove();
  model.state.polylinesGroup.splice(index, 1);
  model.state.allDrawings.splice(index, 1);

  // remove from local storage
  model.setLocalStorage(model.state.workouts, 'workouts');
  model.setLocalStorage(model.state.allDrawings, 'drawings');
};

// Edit existing workout on list
const controlEditWorkout = function (event) {
  sidebarView.editWorkout(event);
};

const editSubmit = function () {
  sidebarView.subtmitWorkoutEdit();

  model.controlStateIndex(workoutsList);

  model.setLocalStorage(model.state.workouts, 'workouts');
};

const controlWorkoutsSorting = function (event) {
  sidebarView.workoutsSort(event, renderWorkout);
};

// Acces RUNNING class from model
const createRunningObject = function (...values) {
  return new model.Running(...values);
};

// Acces Cycling class from model
const createCyclingObject = function (...values) {
  return new model.Cycling(...values);
};

// Render all data store in local storage on page load
const controlLocalStorage = function () {
  model.state.workouts.forEach(work => renderWorkout(work));
};

// Initialization function
const init = function () {
  controlLocalStorage();

  model.controlStateIndex(workoutsList);
  sidebarView.getData(model.state);
  mapView.getData(model.state);
  model.getUserLocation(controlMap);
  sidebarView.showButtons(model.state.workouts);

  form.addEventListener('submit', creatingNewWorkout);
  inputType.addEventListener('change', sidebarView.toggleElevationField);
  containerWorkouts.addEventListener('click', controlMoveToMap);
  workoutsList.addEventListener('click', controlDeleteWorkout);
  workoutsList.addEventListener('click', controlEditWorkout);
  clearAll.addEventListener('click', sidebarView.clearWorkouts);
  buttonsContainer.addEventListener('click', controlWorkoutsSorting);
  buttonZoomOut.addEventListener('click', controlMapZoomOut);
  document.addEventListener('keydown', controlDrawingMode);
};
init();
