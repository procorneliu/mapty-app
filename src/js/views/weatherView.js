import { API_URL, API_KEY } from '../config';

export const weatherData = async function () {
  try {
    const fetchPro = fetch(
      // `https://api.openweathermap.org/energy/1.0/solar/data?lat=47.0148&lon=28.8566&date=2024-10-30&appid=3d2b97b2403217a44c7042f8104beedd`
      `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=47.0148&lon=28.8566&appid=3d2b97b2403217a44c7042f8104beedd`
    );

    const res = await fetchPro;
    const data = await res.json();

    console.log(data);
    // return data;
  } catch (error) {
    console.log(error);
  }
};
weatherData();
