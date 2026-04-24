// Salah Reminder background service worker.
// It checks prayer times every minute, sends a 10-minute warning, sends the exact-time
// notification, and plays an Adhan sound when prayer time starts.

const PRAYER_API_URL = "https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5";
const TIME_ZONE = "Africa/Cairo";
const CHECK_ALARM_NAME = "check-prayer-times";
const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const AZKAR_INTERVAL_MS = 5 * 60 * 1000;
const NOTIFICATION_ICON_FILE = "icon.png";
const AZKAR_LIST = ["سبحان الله", "الحمد لله", "الله أكبر", "لا إله إلا الله", "أستغفر الله"];
const STORAGE_KEYS = {
  prayerTimes: "prayerTimes",
  prayerTimesDate: "prayerTimesDate",
  prayerSchedule: "prayerSchedule",
  prayerScheduleDate: "prayerScheduleDate",
  azkarLastIndex: "azkarLastIndex", 
};
let azkarIntervalId = null;

chrome.runtime.onInstalled.addListener(() => {
  initializeScheduler();
});

chrome.runtime.onStartup.addListener(() => {
  initializeScheduler();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM_NAME) {
    checkPrayerTimes();
  }
});

async function initializeScheduler() {
  await createAlarm(CHECK_ALARM_NAME, { periodInMinutes: 1 });
  startAzkarReminder();
  await checkPrayerTimes();
}

// Starts a repeating Azkar reminder every 5 minutes.
// We keep one active interval to avoid duplicate timers.
function startAzkarReminder() {
  if (azkarIntervalId) {
    return;
  }

  azkarIntervalId = setInterval(() => {
    maybeSendAzkarReminder();
  }, AZKAR_INTERVAL_MS);
}

// Sends one random zekr notification unless we're in an exact prayer minute.
async function maybeSendAzkarReminder() {
  try {
    const now = new Date();
    const schedule = await getPrayerScheduleForToday(now);

    if (isPrayerTimeNow(now, schedule)) {
      return;
    }

    const stored = await storageGet(STORAGE_KEYS.azkarLastIndex);
    const lastIndex = Number.isInteger(stored[STORAGE_KEYS.azkarLastIndex])
      ? stored[STORAGE_KEYS.azkarLastIndex]
      : -1;
    const selectedIndex = pickRandomIndex(lastIndex, AZKAR_LIST.length);
    const zekrText = AZKAR_LIST[selectedIndex];

    await createNotification(`azkar-${Date.now()}`, {
      type: "basic",
      iconUrl: getNotificationIcon(),
      title: "Azkar Reminder",
      message: zekrText,
      priority: 1,
    });

    await storageSet({ [STORAGE_KEYS.azkarLastIndex]: selectedIndex });
  } catch (error) {
    console.warn("Azkar reminder failed:", error);
  }
}

// Returns true when the current minute is exactly a prayer time minute.
function isPrayerTimeNow(now, schedule) {
  for (const prayerName of PRAYER_NAMES) {
    if (isWithinMinuteWindow(now, schedule[prayerName])) {
      return true;
    }
  }

  return false;
}

// Picks a random index and avoids repeating the same item consecutively.
function pickRandomIndex(previousIndex, length) {
  if (length <= 1) {
    return 0;
  }

  let nextIndex = Math.floor(Math.random() * length);
  while (nextIndex === previousIndex) {
    nextIndex = Math.floor(Math.random() * length);
  }

  return nextIndex;
}

async function checkPrayerTimes() {
  try {
    const now = new Date();
    const schedule = await getPrayerScheduleForToday(now);
    const todayKey = getCairoDateKey(now);

    for (const prayerName of PRAYER_NAMES) {
      const prayerDate = schedule[prayerName];

      await maybeNotify({
        now,
        prayerName,
        prayerDate,
        todayKey,
        type: "before",
        offsetMinutes: -10,
        title: `${prayerName} in 10 minutes`,
        message: `Prepare for ${prayerName}. It begins at ${formatPrayerTime(prayerDate)}.`,
        playAdhan: false,
      });

      await maybeNotify({
        now,
        prayerName,
        prayerDate,
        todayKey,
        type: "exact",
        offsetMinutes: 0,
        title: `${prayerName} time`,
        message: `${prayerName} time has started in Cairo.`,
        playAdhan: true,
      });
    }
  } catch (error) {
    console.error("Salah Reminder check failed:", error);
  }
}

async function maybeNotify({
  now,
  prayerName,
  prayerDate,
  todayKey,
  type,
  offsetMinutes,
  title,
  message,
  playAdhan,
}) {
  const target = new Date(prayerDate.getTime() + offsetMinutes * 60000);

  if (!isWithinMinuteWindow(now, target)) {
    return;
  }

  const storageKey = `${todayKey}:${prayerName}:${type}`;
  const stored = await storageGet(storageKey);

  if (stored[storageKey]) {
    return;
  }

  await createNotification(storageKey, {
    type: "basic",
    iconUrl: getNotificationIcon(),
    title,
    message,
    priority: 2,
  });

  if (playAdhan) {
    await playAdhanSound();
  }

  await storageSet({ [storageKey]: true });
}

function isWithinMinuteWindow(now, target) {
  const start = target.getTime();
  const end = start + 60000;
  const currentTime = now.getTime();
  return currentTime >= start && currentTime < end;
}

async function getPrayerScheduleForToday(referenceDate) {
  const todayKey = getCairoDateKey(referenceDate);
  const stored = await storageGet([
    STORAGE_KEYS.prayerTimes,
    STORAGE_KEYS.prayerTimesDate,
    STORAGE_KEYS.prayerSchedule,
    STORAGE_KEYS.prayerScheduleDate,
  ]);

  if (stored[STORAGE_KEYS.prayerScheduleDate] === todayKey && stored[STORAGE_KEYS.prayerSchedule]) {
    return deserializePrayerSchedule(stored[STORAGE_KEYS.prayerSchedule]);
  }

  const response = await fetch(PRAYER_API_URL);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const timings = data?.data?.timings;

  if (!timings) {
    throw new Error("Prayer times were not found in the API response.");
  }

  const prayerTimes = normalizePrayerTimes(timings);
  const schedule = buildPrayerSchedule(prayerTimes, referenceDate);

  await storageSet({
    [STORAGE_KEYS.prayerTimes]: prayerTimes,
    [STORAGE_KEYS.prayerTimesDate]: todayKey,
    [STORAGE_KEYS.prayerSchedule]: serializePrayerSchedule(schedule),
    [STORAGE_KEYS.prayerScheduleDate]: todayKey,
  });

  return schedule;
}

function normalizePrayerTimes(timings) {
  return {
    Fajr: normalizeTime(timings.Fajr),
    Dhuhr: normalizeTime(timings.Dhuhr),
    Asr: normalizeTime(timings.Asr),
    Maghrib: normalizeTime(timings.Maghrib),
    Isha: normalizeTime(timings.Isha),
  };
}

function buildPrayerSchedule(prayerTimes, referenceDate) {
  const { year, month, day } = getCairoDateParts(referenceDate);
  const schedule = {};

  for (const prayerName of PRAYER_NAMES) {
    const timeParts = parseHourMinute(prayerTimes[prayerName]);
    schedule[prayerName] = createZonedDate({
      year,
      month,
      day,
      hour: timeParts.hour,
      minute: timeParts.minute,
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

function parseHourMinute(timeValue) {
  const normalized = normalizeTime(timeValue);
  const [hour, minute] = normalized.split(":").map(Number);
  return { hour, minute };
}

function normalizeTime(timeValue) {
  if (!timeValue) {
    return "";
  }

  return String(timeValue).slice(0, 5);
}

function formatPrayerTime(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function serializePrayerSchedule(schedule) {
  const serialized = {};

  for (const prayerName of PRAYER_NAMES) {
    serialized[prayerName] = schedule[prayerName].getTime();
  }

  return serialized;
}

function deserializePrayerSchedule(serializedSchedule) {
  const schedule = {};

  for (const prayerName of PRAYER_NAMES) {
    schedule[prayerName] = new Date(serializedSchedule[prayerName]);
  }

  return schedule;
}

async function playAdhanSound() {
  try {
    await ensureOffscreenDocument();
    const response = await sendRuntimeMessage({ type: "PLAY_ADHAN_SOUND" });

    if (response && response.ok === false) {
      throw new Error(response.error || "Unable to play Adhan sound.");
    }
  } catch (error) {
    console.warn("Adhan playback failed:", error);
  }
}

async function ensureOffscreenDocument() {
  if (!chrome.offscreen) {
    return;
  }

  if (typeof chrome.offscreen.hasDocument === "function") {
    const hasDocument = await hasOffscreenDocument();
    if (hasDocument) {
      return;
    }
  }

  try {
    await createOffscreenDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play Adhan audio when a prayer time starts.",
    });
  } catch (error) {
    const message = String(error?.message || error);
    if (!message.includes("Only a single offscreen document")) {
      throw error;
    }
  }
}

function getNotificationIcon() {
  // Use a packaged file icon because some systems reject SVG/data URL notification icons.
  return chrome.runtime.getURL(NOTIFICATION_ICON_FILE);
}

// Wrapper helpers for callback-style APIs.
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

function createAlarm(name, alarmInfo) {
  return new Promise((resolve, reject) => {
    try {
      chrome.alarms.create(name, alarmInfo);
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function createNotification(id, options) {
  return new Promise((resolve, reject) => {
    try {
      chrome.notifications.create(id, options, (notificationId) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve(notificationId);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function sendRuntimeMessage(payload) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(payload, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function hasOffscreenDocument() {
  return new Promise((resolve, reject) => {
    try {
      chrome.offscreen.hasDocument((exists) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        resolve(Boolean(exists));
      });
    } catch (error) {
      reject(error);
    }
  });
}

function createOffscreenDocument(options) {
  return new Promise((resolve, reject) => {
    try {
      chrome.offscreen.createDocument(options, () => {
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