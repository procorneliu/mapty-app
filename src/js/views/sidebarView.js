import mapView from './mapView';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const workoutsList = document.querySelector('.workouts__list');
const clearAll = document.querySelector('.clear__all');
const buttonsContainer = document.querySelector('.buttons__container');
const messagesContainer = document.querySelector('.messages__container');

class SidebarView {
  _data;

  _parentElement = document.querySelector('.sidebar');
  _errorMessage = 'Wrong data format!';
  _message = 'Workout succesfully added.';

  constructor() {
    // Initialization functions
    this.addHandlerClearAll();
    this.addHandlerInputType();
  }

  getData(data) {
    this._data = data;
  }

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

  newWorkout(runningHandler, cyclingHandler) {
    // Check for form activity
    if (form.classList.contains('hidden')) return;

    const isInputValid = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every(inp => inp >= 1);

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
      if (!isInputValid(distance, duration, cadence) || !isPositive(distance, duration, cadence))
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
      if (!isInputValid(distance, duration, elevation) || !isPositive(distance, duration))
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
    workout.classList.add('editing__active');

    this.showForm();

    this.toggleEditingMode(true, this._data);

    const content = this._data.htmlContent[this._data.index];

    const parse = new DOMParser();

    const html = parse.parseFromString(content, 'text/html').querySelector('.workout');

    if (html.classList.contains('workout--running')) {
      inputType.value = 'running';
      inputDistance.value = this._data.workouts[this._data.index].distance;
      inputDuration.value = this._data.workouts[this._data.index].duration;
      inputCadence.value = this._data.workouts[this._data.index].cadence;
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
    } else {
      inputType.value = 'cycling';
      inputDistance.value = this._data.workouts[this._data.index].distance;
      inputDuration.value = this._data.workouts[this._data.index].duration;
      inputElevation.value = this._data.workouts[this._data.index].elevationGain;
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation.closest('.form__row').classList.remove('form__row--hidden');
    }
  }

  submitWorkoutEdit() {
    const content = this._data.htmlContent[this._data.index];
    const work = this._data.workouts[this._data.index];

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

    this._data.htmlContent[this._data.index] = html.outerHTML;

    workoutsList.innerHTML = '';
    this._data.htmlContent.slice().forEach(html => {
      workoutsList.insertAdjacentHTML('afterbegin', html);
    });

    this.hideForm();

    this.toggleEditingMode(false, this._data);
  }

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
      this._data.workouts.forEach(work => handler(work));
    }
  }

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

    // guard clause
    if (!workoutEl || e.target.closest('.edit__btn')) return;

    const workout = this._data.workouts.find(work => work.id === workoutEl.dataset.id);

    if (!workout) return;
    this._data.map.setView(workout.coords, this._data.mapZoomLevel, {
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

    message.addEventListener('click', function (e) {
      const closeBtn = e.target.closest('.close__btn-message');
      if (!closeBtn) return;

      message.classList.add('hidden');
    });

    const timer = seconds => new Promise(response => setTimeout(response, seconds));

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

  showForm() {
    form.classList.remove('hidden');
  }

  hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  showButtons(data) {
    data.length >= 1 ? buttonsContainer.classList.remove('hidden') : buttonsContainer.classList.add('hidden');
  }

  // Switching from running to cycling
  toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  toggleEditingMode(bool) {
    this._data.editingMode = bool;
    inputType.disabled = bool;
  }

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

  // Adding event handlers CHECKPOINT:////////////////////////////////////////////////////////////////////
  addHandlerWorkoutsSort(handler) {
    buttonsContainer.addEventListener('click', handler);
  }

  addHandlerWorkoutsList(handler) {
    workoutsList.addEventListener('click', handler);
  }

  addHandlerContainerWorkouts(handler) {
    containerWorkouts.addEventListener('click', handler);
  }

  addHandlerFormSubmit(handler) {
    form.addEventListener('submit', handler);
  }

  addHandlerInputType() {
    inputType.addEventListener('change', this.toggleElevationField);
  }

  addHandlerClearAll() {
    clearAll.addEventListener('click', this.clearWorkouts);
  }
}

export default new SidebarView();
