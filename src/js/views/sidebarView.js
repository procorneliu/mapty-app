import mapView from './mapView';

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

class SidebarView {
  _parentElement = document.querySelector('.sidebar');
  _errorMessage = 'Wrong data format!';
  _message = 'Workout succesfully added.';

  generateWorkoutMarkup(workout) {
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
}

export default new SidebarView();
