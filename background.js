// Salah Reminder background service worker.
// Keeps prayer notifications, Azkar reminders, and Adhan playback scheduled for the saved location.

const DEFAULT_LOCATION = { country: "Egypt", city: "Cairo" };
const DEFAULT_TIME_ZONE = "Africa/Cairo";
const CHECK_ALARM_NAME = "check-prayer-times";
const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const NOTIFICATION_ICON_FILE = "icon.png";
const STORAGE_KEYS = {
  prayerTimes: "prayerTimes",
  prayerTimesDate: "prayerTimesDate",
  prayerSchedule: "prayerSchedule",
  prayerScheduleDate: "prayerScheduleDate",
  location: "location",
  timeZone: "timeZone",
  notificationsEnabled: "notificationsEnabled",
};

const AZKAR_ALARM_NAME = "azkar-supplications";
const AZKAR_LIST = [
  "سبحان الله وبحمده، سبحان الله العظيم",
  "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير",
  "أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه",
  "اللهم صل وسلم وبارك على نبينا محمد",
  "لا حول ولا قوة إلا بالله العلي العظيم",
  "حسبي الله لا إله إلا هو، عليه توكلت وهو رب العرش العظيم",
  "رضيت بالله رباً، وبالإسلام ديناً، وبمحمد صلى الله عليه وسلم نبياً",
  "يا حي يا قيوم برحمتك أستغيث، أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين",
  "اللهم إنك عفو تحب العفو فاعف عني",
  "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر"
];

chrome.runtime.onInstalled.addListener(() => {
  initializeScheduler();
});

chrome.runtime.onStartup.addListener(() => {
  initializeScheduler();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (["LOCATION_UPDATED", "PRAYER_TIMES_UPDATED", "NOTIFICATION_PREFS_UPDATED"].includes(message?.type)) {
    initializeScheduler()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.action === "playRadio") {
    ensureOffscreenDocument()
      .then(() => {
        return sendRuntimeMessage({ action: "playRadioOffscreen", url: message.url });
      })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.action === "stopAudio") {
    sendRuntimeMessage({ action: "stopAudioOffscreen" })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === CHECK_ALARM_NAME) {
    checkReminders();
  } else if (alarm.name === AZKAR_ALARM_NAME) {
    const notificationsEnabled = await areNotificationsEnabled();
    if (notificationsEnabled) {
      showRandomZikr();
    }
  }
});

async function initializeScheduler() {
  await createAlarm(CHECK_ALARM_NAME, { periodInMinutes: 1 });
  await createAlarm(AZKAR_ALARM_NAME, { periodInMinutes: 3 });

  const stored = await storageGet(STORAGE_KEYS.notificationsEnabled);
  if (typeof stored[STORAGE_KEYS.notificationsEnabled] === "undefined") {
    await storageSet({ [STORAGE_KEYS.notificationsEnabled]: true });
  }

  await checkReminders();
}

async function checkReminders() {
  try {
    const now = new Date();
    const { schedule, timeZone, location } = await getPrayerScheduleForToday(now);
    const todayKey = getDateKey(now, timeZone);
    const notificationsEnabled = await areNotificationsEnabled();

    for (const prayerName of PRAYER_NAMES) {
      const prayerDate = schedule[prayerName];

      await maybeHandlePrayerReminder({
        now,
        prayerName,
        prayerDate,
        todayKey,
        location,
        notificationsEnabled,
        type: "before",
        offsetMinutes: -10,
        title: `${prayerName} in 10 minutes`,
        message: `Prepare for ${prayerName}. It begins at ${formatPrayerTime(prayerDate, timeZone)}.`,
        playAdhan: false,
      });

      await maybeHandlePrayerReminder({
        now,
        prayerName,
        prayerDate,
        todayKey,
        location,
        notificationsEnabled,
        type: "exact",
        offsetMinutes: 0,
        title: `${prayerName} time`,
        message: `${prayerName} time has started in ${location.city}.`,
        playAdhan: true,
      });
    }

    if (notificationsEnabled) {
      await maybeSendAzkarReminder(now, todayKey, timeZone);
    }
  } catch (error) {
    console.error("Salah Reminder check failed:", error);
  }
}

async function maybeHandlePrayerReminder({
  now,
  prayerName,
  prayerDate,
  todayKey,
  type,
  offsetMinutes,
  title,
  message,
  playAdhan,
  notificationsEnabled,
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

  if (notificationsEnabled) {
    await createNotification(storageKey, {
      type: "basic",
      iconUrl: getNotificationIcon(),
      title,
      message,
      priority: type === "exact" ? 2 : 1,
    });
  }

  if (playAdhan) {
    await playAdhanSound();
  }

  await storageSet({ [storageKey]: true });
}

async function maybeSendAzkarReminder(now, todayKey, timeZone) {
  const reminders = [
    { type: "morning", hour: 8, title: "Morning Azkar", message: "Take a quiet moment for morning Azkar." },
    { type: "evening", hour: 18, title: "Evening Azkar", message: "Take a quiet moment for evening Azkar." },
  ];

  for (const reminder of reminders) {
    const target = createZonedDate({
      ...getTimeZoneParts(now, timeZone),
      hour: reminder.hour,
      minute: 0,
      second: 0,
      timeZone,
    });

    if (!isWithinMinuteWindow(now, target)) {
      continue;
    }

    const storageKey = `${todayKey}:azkar:${reminder.type}`;
    const stored = await storageGet(storageKey);
    if (stored[storageKey]) {
      continue;
    }

    await createNotification(storageKey, {
      type: "basic",
      iconUrl: getNotificationIcon(),
      title: reminder.title,
      message: reminder.message,
      priority: 1,
    });
    await storageSet({ [storageKey]: true });
  }
}

async function showRandomZikr() {
  const randomZikr = AZKAR_LIST[Math.floor(Math.random() * AZKAR_LIST.length)];
  const notificationId = `azkar-random-${Date.now()}`;
  
  await createNotification(notificationId, {
    type: "basic",
    iconUrl: getNotificationIcon(),
    title: "ذكر - Zikr",
    message: randomZikr,
    priority: 1,
  });
}

function isWithinMinuteWindow(now, target) {
  const start = target.getTime();
  const end = start + 60000;
  const currentTime = now.getTime();
  return currentTime >= start && currentTime < end;
}

async function getPrayerScheduleForToday(referenceDate) {
  const location = await getStoredLocation();
  const stored = await storageGet([
    STORAGE_KEYS.prayerTimes,
    STORAGE_KEYS.prayerTimesDate,
    STORAGE_KEYS.prayerSchedule,
    STORAGE_KEYS.prayerScheduleDate,
    STORAGE_KEYS.timeZone,
    STORAGE_KEYS.location,
  ]);
  const timeZone = stored[STORAGE_KEYS.timeZone] || DEFAULT_TIME_ZONE;
  const todayKey = getDateKey(referenceDate, timeZone);

  if (stored[STORAGE_KEYS.prayerScheduleDate] === todayKey && stored[STORAGE_KEYS.prayerSchedule]) {
    return {
      schedule: deserializePrayerSchedule(stored[STORAGE_KEYS.prayerSchedule]),
      timeZone,
      location,
    };
  }

  const result = await fetchPrayerTimes(location);
  const schedule = buildPrayerSchedule(result.prayerTimes, referenceDate, result.timeZone);
  const resultTodayKey = getDateKey(referenceDate, result.timeZone);

  await storageSet({
    [STORAGE_KEYS.prayerTimes]: result.prayerTimes,
    [STORAGE_KEYS.prayerTimesDate]: resultTodayKey,
    [STORAGE_KEYS.prayerSchedule]: serializePrayerSchedule(schedule),
    [STORAGE_KEYS.prayerScheduleDate]: resultTodayKey,
    [STORAGE_KEYS.timeZone]: result.timeZone,
  });

  return {
    schedule,
    timeZone: result.timeZone,
    location,
  };
}

async function fetchPrayerTimes(location) {
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(location.city)}&country=${encodeURIComponent(location.country)}&method=5`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const timings = data?.data?.timings;

  if (!timings) {
    throw new Error("Prayer times were not found in the API response.");
  }

  return {
    prayerTimes: normalizePrayerTimes(timings),
    timeZone: data?.data?.meta?.timezone || DEFAULT_TIME_ZONE,
  };
}

function normalizePrayerTimes(timings) {
  const prayerTimes = {};

  for (const prayerName of PRAYER_NAMES) {
    prayerTimes[prayerName] = normalizeTime(timings[prayerName]);
  }

  return prayerTimes;
}

function buildPrayerSchedule(prayerTimes, referenceDate, timeZone) {
  const { year, month, day } = getTimeZoneParts(referenceDate, timeZone);
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
      timeZone,
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

function getDateKey(referenceDate, timeZone) {
  const { year, month, day } = getTimeZoneParts(referenceDate, timeZone);
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

function formatPrayerTime(date, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
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

async function getStoredLocation() {
  const stored = await storageGet(STORAGE_KEYS.location);
  const location = stored[STORAGE_KEYS.location] || DEFAULT_LOCATION;
  return {
    country: location.country || DEFAULT_LOCATION.country,
    city: location.city || DEFAULT_LOCATION.city,
  };
}

async function areNotificationsEnabled() {
  const stored = await storageGet(STORAGE_KEYS.notificationsEnabled);
  return stored[STORAGE_KEYS.notificationsEnabled] !== false;
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
      justification: "Play audio for Adhan and Quran Radio.",
    });
  } catch (error) {
    const message = String(error?.message || error);
    if (!message.includes("Only a single offscreen document")) {
      throw error;
    }
  }
}

function getNotificationIcon() {
  return chrome.runtime.getURL(NOTIFICATION_ICON_FILE);
}

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
