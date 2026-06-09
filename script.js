// ===== DOM ELEMENTS =====
const cityInput   = document.getElementById('cityInput');
const searchBtn   = document.getElementById('searchBtn');
const weatherCard = document.getElementById('weatherCard');
const errorBox    = document.getElementById('errorBox');
const errorMsg    = document.getElementById('errorMsg');
const loader      = document.getElementById('loader');

// ===== WEATHER CODE MAP =====
const weatherCodes = {
  0:  { desc: 'Clear Sky',           icon: '01d' },
  1:  { desc: 'Mainly Clear',        icon: '01d' },
  2:  { desc: 'Partly Cloudy',       icon: '02d' },
  3:  { desc: 'Overcast',            icon: '04d' },
  45: { desc: 'Foggy',               icon: '50d' },
  48: { desc: 'Icy Fog',             icon: '50d' },
  51: { desc: 'Light Drizzle',       icon: '09d' },
  53: { desc: 'Moderate Drizzle',    icon: '09d' },
  55: { desc: 'Heavy Drizzle',       icon: '09d' },
  61: { desc: 'Light Rain',          icon: '10d' },
  63: { desc: 'Moderate Rain',       icon: '10d' },
  65: { desc: 'Heavy Rain',          icon: '10d' },
  71: { desc: 'Light Snow',          icon: '13d' },
  73: { desc: 'Moderate Snow',       icon: '13d' },
  75: { desc: 'Heavy Snow',          icon: '13d' },
  80: { desc: 'Rain Showers',        icon: '09d' },
  81: { desc: 'Moderate Showers',    icon: '09d' },
  82: { desc: 'Violent Showers',     icon: '09d' },
  95: { desc: 'Thunderstorm',        icon: '11d' },
  99: { desc: 'Thunderstorm + Hail', icon: '11d' },
};

// ===== HELPER: Format Date =====
function getFormattedDate() {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric',
    month: 'long',   day: 'numeric'
  });
}

// ===== HELPER: Show/Hide UI States =====
function showLoader() {
  loader.classList.add('show');
  weatherCard.classList.remove('show');
  errorBox.classList.remove('show');
}
function hideLoader() {
  loader.classList.remove('show');
}
function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.classList.add('show');
  hideLoader();
}
function showCard() {
  weatherCard.classList.add('show');
  hideLoader();
}

// ===== MAIN: Fetch Weather =====
async function fetchWeather(city) {
  city = city.trim(); // auto-remove leading/trailing spaces
  if (!city) {
    showError('Please enter a city name.');
    return;
  }

  showLoader();

  try {
    // STEP 1: Geocoding — convert city name to lat/lon
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes  = await fetch(geoURL);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      showError(`City "${city}" not found. Please check the spelling.`);
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // STEP 2: Fetch current weather using lat/lon
    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,surface_pressure,visibility&wind_speed_unit=kmh&timezone=auto`;
    const weatherRes  = await fetch(weatherURL);
    const weatherData = await weatherRes.json();

    const c = weatherData.current;

    // STEP 3: Resolve weather description and icon
    const code   = c.weather_code;
    const wInfo  = weatherCodes[code] || { desc: 'Unknown', icon: '01d' };
    const iconURL = `https://openweathermap.org/img/wn/${wInfo.icon}@2x.png`;

    // STEP 4: Update DOM with weather data
    document.getElementById('cityName').textContent    = `${name}, ${country}`;
    document.getElementById('dateTime').textContent    = getFormattedDate();
    document.getElementById('temperature').textContent = `${Math.round(c.temperature_2m)}°C`;
    document.getElementById('feelsLike').textContent   = Math.round(c.apparent_temperature);
    document.getElementById('weatherDesc').textContent = wInfo.desc;
    document.getElementById('humidity').textContent    = `${c.relative_humidity_2m}%`;
    document.getElementById('windSpeed').textContent   = `${Math.round(c.wind_speed_10m)} km/h`;
    document.getElementById('pressure').textContent    = `${Math.round(c.surface_pressure)} hPa`;

    // Visibility is in meters — convert to km
    const visKm = c.visibility ? (c.visibility / 1000).toFixed(1) : 'N/A';
    document.getElementById('visibility').textContent = visKm !== 'N/A' ? `${visKm} km` : 'N/A';

    // Set weather icon
    const iconEl = document.getElementById('weatherIcon');
    iconEl.src = iconURL;
    iconEl.alt = wInfo.desc;

    showCard();

  } catch (err) {
    showError('Something went wrong. Please check your internet connection.');
    console.error(err);
  }
}

// ===== EVENT LISTENERS =====
searchBtn.addEventListener('click', () => fetchWeather(cityInput.value));

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchWeather(cityInput.value);
});