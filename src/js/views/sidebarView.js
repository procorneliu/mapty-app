// Imports
import mapView from './mapView';

const form = document.querySelector('.form');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const containerWorkouts = document.querySelector('.workouts');
const workoutsList = document.querySelector('.workouts__list');
const clearAll = document.querySelector('.clear__all');
const buttonsContainer = document.querySelector('.buttons__container');
const messagesContainer = document.querySelector('.messages__container');

class SidebarView {
  _data;
  _parentElement = document.querySelector('.sidebar');

  constructor() {
    // Initialization functions
    this.addHandlerClearAll();
    this.addHandlerInputType();
  }

  // getting path to app state
  getData(data) {
    this._data = data;
  }

  // generating html content for each workout based on workout type
  generateWorkoutMarkup(workout) {
    if (!workout) return;

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
    return html;
  }

  // Creating new workout
  newWorkout(runningHandler, cyclingHandler) {
    // Check for form activity
    if (form.classList.contains('hidden')) return;

    // Get data from input
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this._data.mapEvent.latlng;
    let workout;

    // If type running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (!this.isInputValid(distance, duration, cadence) || !this.isPositive(distance, duration, cadence))
        return this.renderMessage('.message__error');

      this.renderMessage();

      // Render drawed lines
      mapView.updateDrawings(this._data, '#00c46a');

      workout = runningHandler([lat, lng], distance, duration, cadence);
    }

    // If type cycling, create cyclying object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check is data is valid
      if (!this.isInputValid(distance, duration, elevation) || !this.isPositive(distance, duration))
        return this.renderMessage('.message__error');

      this.renderMessage();

      // Render drawed lines
      mapView.updateDrawings(this._data, '#ffb545');

      workout = cyclingHandler([lat, lng], distance, duration, elevation);
    }
    return workout;
  }

  // Edit existing workout on list
  editWorkout(e) {
    const editEl = e.target.closest('.edit__btn');
    if (!editEl) return;

    // clear all workouts in editing mode
    this.clearAllSelected();

    const workout = e.target.closest('.workout');
    if (!workout) return;

    workout.classList.add('editing__active');
    this.showForm();

    const { htmlContent, index, workouts } = this._data;
    const currentWorkout = workouts[index];
    this.toggleEditingMode(true, this._data);

    // const content = this._data.htmlContent[this._data.index];

    const parser = new DOMParser();
    const parsedWorkout = parser.parseFromString(htmlContent[index], 'text/html').querySelector('.workout');

    // Check workout type and update form inputs accordingly
    const isRunning = parsedWorkout.classList.contains('workout--running');
    inputType.value = isRunning ? 'running' : 'cycling';
    inputDistance.value = currentWorkout.distance;
    inputDuration.value = currentWorkout.duration;

    // Toggle form rows based on workout type
    const cadenceRow = inputCadence.closest('.form__row');
    const elevationRow = inputElevation.closest('.form__row');
    if (isRunning) {
      inputCadence.value = currentWorkout.cadence;
      cadenceRow.classList.remove('form__row--hidden');
      elevationRow.classList.add('form__row--hidden');
    } else {
      inputElevation.value = currentWorkout.elevationGain;
      cadenceRow.classList.add('form__row--hidden');
      elevationRow.classList.remove('form__row--hidden');
    }
  }

  // when submiting an edited workout
  submitWorkoutEdit() {
    const { htmlContent, index, workouts } = this._data;
    const currentWorkout = workouts[index];

    // Convert text to html, for accesing data by class
    const parser = new DOMParser();
    const parsedWorkout = parser.parseFromString(htmlContent[index], 'text/html').querySelector('.workout');

    const isRunning = parsedWorkout.classList.contains('workout--running');

    parsedWorkout.querySelector('.distance__value').textContent = inputDistance.value;
    parsedWorkout.querySelector('.duration__value').textContent = inputDuration.value;
    currentWorkout.distance = +inputDistance.value;
    currentWorkout.duration = +inputDuration.value;

    if (isRunning) {
      // checking if all inputs are valid
      if (
        !this.isInputValid(+inputDistance.value, +inputDuration.value, +inputCadence.value) ||
        !this.isPositive(+inputDistance.value, +inputDuration.value, +inputCadence.value)
      )
        return alert('Data needs to be positive numbers!');

      currentWorkout.cadence = +inputCadence.value;
      const calcPace = Math.trunc(inputDuration.value / inputDistance.value);
      currentWorkout.pace = calcPace;

      parsedWorkout.querySelector('.cadence__value').textContent = inputCadence.value;
      parsedWorkout.querySelector('.pace__value').textContent = calcPace;
    } else {
      // checking if all inputs are valid
      if (
        !this.isInputValid(+inputDistance.value, +inputDuration.value, +inputElevation.value) ||
        !this.isPositive(+inputDistance.value, +inputDuration.value)
      )
        return alert('Data needs to be positive numbers!');

      currentWorkout.elevationGain = +inputElevation.value;
      const calcSpeed = Math.trunc(inputDistance.value / (inputDuration.value / 60));
      currentWorkout.speed = calcSpeed;
      parsedWorkout.querySelector('.elevationGain__value').textContent = inputElevation.value;
      parsedWorkout.querySelector('.speed__value').textContent = calcSpeed;
    }

    this._data.htmlContent[index] = parsedWorkout.outerHTML;

    workoutsList.innerHTML = '';
    this._data.htmlContent.slice().forEach(html => {
      workoutsList.insertAdjacentHTML('afterbegin', html);
    });

    this.hideForm();

    this.toggleEditingMode(false, this._data);
  }

  // Sort workouts when one of the sorts button are clicked
  workoutsSort(event, handler) {
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
      const newArray = this._data.workouts.slice().sort((a, b) => {
        // Sort by duration or distance
        return sortingByDuration ? b.duration - a.duration : b.distance - a.distance;
      });
      newArray.forEach(work => handler(work));
    } else {
      // render workout to default sort
      this._data.workouts.forEach(work => handler(work));
    }
  }

  // get delete workout index and clear all list for re-rendering
  deleteWorkout(e) {
    const workoutEl = e.target.closest('.close__btn');
    if (!workoutEl) return;

    const workout = this._data.workouts.find(work => work.id === workoutEl.closest('.workout').dataset.id);
    if (!workout) return;

    const index = this._data.workouts.findIndex(work => work.id === workout.id);

    workoutsList.innerHTML = '';

    return index;
  }

  adjacentHTMLControler(htmlElements) {
    htmlElements.forEach(html => {
      workoutsList.insertAdjacentHTML('afterbegin', html);
    });
  }

  // setting indexes for all edit button
  controlStateIndex(handler) {
    workoutsList.querySelectorAll('.edit__btn').forEach((btn, i) =>
      btn.addEventListener(
        'click',
        function () {
          // invert index
          const index = Math.abs(i - (this._data.htmlContent.length - 1));
          handler(index);
        }.bind(this)
      )
    );
  }

  // Move to map marker when clicking workout from list
  moveToMarker(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl || e.target.closest('.edit__btn')) return;

    const workout = this._data.workouts.find(work => work.id === workoutEl.dataset.id);
    if (!workout) return;

    // set map view to map marker
    this._data.map.setView(workout.coords, this._data.mapZoomLevel, {
      // move smoothly
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // Clear form + input fields
    this.hideForm();

    // clear all workouts in editing and selected mode
    this.clearAllSelected();
    workoutEl.classList.add('selected__active');
  }

  // Render succes or error message when submiting form
  renderMessage(messageBox = '.message__succes') {
    const message = messagesContainer.querySelector(messageBox);

    if (!message) return;

    message.classList.remove('hidden');
    message.classList.add('show');

    // if clicking 'x' button on message
    message.addEventListener('click', function (e) {
      const closeBtn = e.target.closest('.close__btn-message');
      if (!closeBtn) return;

      message.classList.add('hidden');
    });

    // setting timer
    const timer = seconds => new Promise(response => setTimeout(response, seconds));

    // after 1s start hidding message
    timer(1000)
      .then(() => {
        message.classList.remove('show');
        message.classList.add('hide');
        return timer(1000);
      })
      .then(() => {
        message.classList.remove('hide');
        message.classList.add('hidden');
      });
  }

  // show form
  showForm = () => form.classList.remove('hidden');

  // hide form
  hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // when there is workouts on list show buttons
  showButtons(data) {
    data.length >= 1 ? buttonsContainer.classList.remove('hidden') : buttonsContainer.classList.add('hidden');
  }

  // Switching from running to cycling input type
  toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // switching from editing to creating new workout mode
  toggleEditingMode(bool) {
    this._data.editingMode = bool;
    inputType.disabled = bool;
  }

  // remove all workouts
  clearAllSelected() {
    document.querySelectorAll('.workout').forEach(work => {
      work.classList.remove('editing__active');
      work.classList.remove('selected__active');
    });

    inputType.value = 'running';
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    inputCadence.closest('.form__row').classList.remove('form__row--hidden');
    inputElevation.closest('.form__row').classList.add('form__row--hidden');
  }

  // Clear local storage data
  clearWorkouts() {
    localStorage.clear();
    location.reload();
  }

  // checking if all input values are valid and positive
  isInputValid = (...inputs) => inputs.every(inp => Number.isFinite(inp));
  isPositive = (...inputs) => inputs.every(inp => inp >= 1);

  // Adding event handlers CHECKPOINT:////////////////////////////////////////////////////////////////////
  // when sort button is clicked
  addHandlerWorkoutsSort = handler => buttonsContainer.addEventListener('click', handler);

  // when something from workouts list is clicked
  addHandlerWorkoutsList = handler => workoutsList.addEventListener('click', handler);

  // when workouts container is clicked
  addHandlerContainerWorkouts = handler => containerWorkouts.addEventListener('click', handler);

  // when form is submited
  addHandlerFormSubmit = handler => form.addEventListener('submit', handler);

  // when input type (running/cycling) is changed
  addHandlerInputType = () => inputType.addEventListener('change', this.toggleElevationField);

  // when 'clear all' button is clicked
  addHandlerClearAll = () => clearAll.addEventListener('click', this.clearWorkouts);
}

export default new SidebarView();
