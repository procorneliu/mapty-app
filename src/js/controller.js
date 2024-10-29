// Imports
import * as model from './model.js';
import sidebarView from './views/sidebarView';
import mapView from './views/mapView';

////////////////////////////////////////////////////////////
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
    sidebarView.hideForm();
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
  if (!workout) return;

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

// Show workout on list after completing form
const renderWorkout = function (workout) {
  const html = sidebarView.generateWorkoutMarkup(workout);

  model.state.htmlContent.push(html);

  sidebarView.adjacentHTMLControler([html]);

  sidebarView.controlStateIndex(model.setStateIndex);
};

// Delete workout by 'x' button
const controlDeleteWorkout = function (event) {
  const index = sidebarView.deleteWorkout(event);

  // remove workout from list
  model.state.workouts.splice(index, 1);
  model.state.htmlContent.splice(index, 1);

  // insert updated workout to view
  sidebarView.adjacentHTMLControler(model.state.htmlContent);

  // setting id number for each workout
  sidebarView.controlStateIndex(model.setStateIndex);

  // remove marker from map and storage
  model.removingWorkoutData(index);

  // hide from
  sidebarView.hideForm();

  // Check for clear all
  sidebarView.showButtons(model.state.workouts);
};

// Edit existing workout on list
const controlEditWorkout = function (event) {
  sidebarView.editWorkout(event);
};

const editSubmit = function () {
  sidebarView.submitWorkoutEdit();

  sidebarView.controlStateIndex(model.setStateIndex);

  model.setLocalStorage(model.state.workouts, 'workouts');
};

const controlWorkoutsSorting = function (event) {
  sidebarView.workoutsSort(event, renderWorkout);
};

// Show workout marker on map
const renderWorkoutMarker = function (workout) {
  const mark = sidebarView.generateWorkoutMarker(workout);
  model.state.markers.push(mark);
};

// // Move to map marker when clicking workout from list
const controlMoveToMap = function (event) {
  sidebarView.moveToMarker(event);
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

  model.getUserLocation(controlMap);
  sidebarView.controlStateIndex(model.setStateIndex);
  sidebarView.getData(model.state);
  mapView.getData(model.state);

  sidebarView.showButtons(model.state.workouts);
  sidebarView.addHandlerFormSubmit(creatingNewWorkout);
  sidebarView.addHandlerContainerWorkouts(controlMoveToMap);
  sidebarView.addHandlerWorkoutsList(controlDeleteWorkout);
  sidebarView.addHandlerWorkoutsList(controlEditWorkout);
  sidebarView.addHandlerWorkoutsSort(controlWorkoutsSorting);
  mapView.addHandlerZoomAll(controlMapZoomOut);
  mapView.addHandlerDrawingMode(controlDrawingMode);
};
init();
