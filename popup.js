// Popup script for Salah Reminder.
// This loads prayer times, applies the saved theme, and highlights the next prayer.

const PRAYER_API_URL = "https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5";
const TIME_ZONE = "Africa/Cairo";
const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const STORAGE_KEYS = {
  prayerTimes: "prayerTimes",
  prayerTimesDate: "prayerTimesDate",
  theme: "theme",
};

document.addEventListener("DOMContentLoaded", () => {
  initializePopup();
});

async function initializePopup() {
  try {
    bindThemeToggle();
    await applyStoredTheme();
  } catch (error) {
    console.warn("Theme setup failed:", error);
    applyTheme("light");
    updateThemeButton("light");
  }

  await loadPrayerTimes();
}

function bindThemeToggle() {
  const toggleButton = document.getElementById("themeToggle");

  toggleButton.addEventListener("click", async () => {
    const nextTheme = document.body.classList.contains("theme-dark") ? "light" : "dark";
    await storageSet({ [STORAGE_KEYS.theme]: nextTheme });
    applyTheme(nextTheme);
    updateThemeButton(nextTheme);
  });
}

async function applyStoredTheme() {
  const stored = await storageGet(STORAGE_KEYS.theme);
  const theme = stored[STORAGE_KEYS.theme] || "light";
  applyTheme(theme);
  updateThemeButton(theme);
}

function applyTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-light", theme !== "dark");
}

function updateThemeButton(theme) {
  document.querySelector(".theme-toggle__label").textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

async function loadPrayerTimes() {
  const statusElement = document.getElementById("status");
  const prayerListElement = document.getElementById("prayerTimes");
  const nextPrayerNameElement = document.getElementById("nextPrayerName");
  const nextPrayerTimeElement = document.getElementById("nextPrayerTime");
  const dateElement = document.getElementById("currentDate");
  const loadingHintElement = document.getElementById("loadingHint");

  dateElement.textContent = formatCairoDate(new Date());
  statusElement.textContent = "Loading prayer times...";
  loadingHintElement.textContent = "Fetching latest times...";

  try {
    const prayerTimes = await fetchPrayerTimes();
    await storageSet({
      [STORAGE_KEYS.prayerTimes]: prayerTimes,
      [STORAGE_KEYS.prayerTimesDate]: getCairoDateKey(new Date()),
    });

    renderPrayerTimes(prayerTimes, prayerListElement);
    const nextPrayer = getNextPrayer(prayerTimes, new Date());

    nextPrayerNameElement.textContent = nextPrayer.label;
    nextPrayerTimeElement.textContent = nextPrayer.time;
    statusElement.textContent = "Prayer times loaded successfully.";
    loadingHintElement.textContent = "Live data from Aladhan API.";
  } catch (error) {
    console.error("Failed to load prayer times:", error);

    const cached = await storageGet([STORAGE_KEYS.prayerTimes, STORAGE_KEYS.prayerTimesDate]);

    if (cached[STORAGE_KEYS.prayerTimes]) {
      renderPrayerTimes(cached[STORAGE_KEYS.prayerTimes], prayerListElement);
      const nextPrayer = getNextPrayer(cached[STORAGE_KEYS.prayerTimes], new Date());

      nextPrayerNameElement.textContent = nextPrayer.label;
      nextPrayerTimeElement.textContent = nextPrayer.time;
      statusElement.textContent = "API unavailable. Showing cached prayer times.";
      loadingHintElement.textContent = "Cached data used because the API request failed.";
    } else {
      prayerListElement.innerHTML = `
        <div class="empty-state">
          <strong>Unable to load prayer times.</strong>
          <span>Please try again later.</span>
        </div>
      `;
      nextPrayerNameElement.textContent = "Unavailable";
      nextPrayerTimeElement.textContent = "--:--";
      statusElement.textContent = "Unable to load prayer times right now.";
      loadingHintElement.textContent = "No cached data available.";
    }
  }
}

async function fetchPrayerTimes() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(PRAYER_API_URL, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const timings = data?.data?.timings;

  if (!timings) {
    throw new Error("Prayer times were not found in the API response.");
  }

  return normalizePrayerTimes(timings);
}

function normalizePrayerTimes(timings) {
  const prayerTimes = {};

  for (const prayerName of PRAYER_NAMES) {
    prayerTimes[prayerName] = normalizeTime(timings[prayerName]);
  }

  return prayerTimes;
}

function renderPrayerTimes(prayerTimes, prayerListElement) {
  const now = new Date();
  const nextPrayer = getNextPrayer(prayerTimes, now);

  prayerListElement.innerHTML = "";

  for (const prayerName of PRAYER_NAMES) {
    const prayerTime = formatTimeForDisplay(prayerTimes[prayerName]);
    const card = document.createElement("article");
    const isNext = nextPrayer.name === prayerName;

    card.className = `prayer-card${isNext ? " prayer-card--next" : ""}`;
    card.innerHTML = `
      <div class="prayer-card__top">
        <span class="prayer-card__name">${prayerName}</span>
        ${isNext ? '<span class="prayer-card__badge">Next</span>' : ""}
      </div>
      <div class="prayer-card__time">${prayerTime}</div>
      <div class="prayer-card__note">${isNext ? nextPrayer.note : ""}</div>
    `;

    prayerListElement.appendChild(card);
  }
}

function getNextPrayer(prayerTimes, referenceDate) {
  const schedule = buildPrayerSchedule(prayerTimes, referenceDate);
  const now = new Date(referenceDate.getTime());

  for (const prayerName of PRAYER_NAMES) {
    if (now.getTime() < schedule[prayerName].getTime()) {
      return {
        name: prayerName,
        label: prayerName,
        time: formatPrayerTime(schedule[prayerName]),
        note: "Upcoming prayer",
      };
    }
  }

  return {
    name: "Fajr",
    label: "Fajr",
    time: `${formatTimeForDisplay(prayerTimes.Fajr)} tomorrow`,
    note: "Next prayer starts tomorrow",
  };
}

function buildPrayerSchedule(prayerTimes, referenceDate) {
  const { year, month, day } = getCairoDateParts(referenceDate);
  const schedule = {};

  for (const prayerName of PRAYER_NAMES) {
    const { hour, minute } = parseHourMinute(prayerTimes[prayerName]);
    schedule[prayerName] = createZonedDate({
      year,
      month,
      day,
      hour,
      minute,
      second: 0,
      timeZone: TIME_ZONE,
    });
  }

  return schedule;
}

function createZonedDate({ year, month, day, hour, minute, second, timeZone }) {
  let utcMillis = Date.UTC(year, month - 1, day, hour, minute, second);
  const desiredMillis = utcMillis;

  for (let i = 0; i < 2; i += 1) {
    const parts = getTimeZoneParts(new Date(utcMillis), timeZone);
    const zonedMillis = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const delta = zonedMillis - desiredMillis;

    if (delta === 0) {
      break;
    }

    utcMillis -= delta;
  }

  return new Date(utcMillis);
}

function getTimeZoneParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  return values;
}

function getCairoDateParts(referenceDate) {
  return getTimeZoneParts(referenceDate, TIME_ZONE);
}

function getCairoDateKey(referenceDate) {
  const { year, month, day } = getCairoDateParts(referenceDate);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatCairoDate(referenceDate) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(referenceDate);
}

function parseHourMinute(timeValue) {
  const normalized = normalizeTime(timeValue);
  const [hour, minute] = normalized.split(":").map(Number);
  return { hour, minute };
}

function normalizeTime(timeValue) {
  if (!timeValue) {
    return "--:--";
  }

  return String(timeValue).slice(0, 5);
}

function formatPrayerTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatTimeForDisplay(timeValue) {
  const normalized = normalizeTime(timeValue);
  if (normalized === "--:--") {
    return normalized;
  }

  const [hour, minute] = normalized.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return normalized;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

// Storage wrappers that support both callback-style and Promise-style extension APIs.
function storageGet(keys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve(result || {});
      });
    } catch (error) {
      reject(error);
    }
  });
}

function storageSet(items) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(items, () => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}