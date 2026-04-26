import re
import os

file_path = r"d:\Projects-Django\ExtentionChrome\popup.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

translations_dict = """
const TRANSLATIONS = {
  en: {
    salahReminder: "Salah Reminder",
    nextPrayer: "Next Prayer",
    prayerTimes: "Prayer Times",
    fetchingTimes: "Fetching latest times...",
    locationSettings: "Location Settings",
    notifications: "Notifications",
    country: "Country",
    city: "City",
    saveLocation: "Save Location",
    quranRadio: "Quran Radio",
    noStationPlaying: "No station playing",
    play: "Play",
    stop: "Stop",
    azkar: "Azkar",
    morning: "Morning",
    evening: "Evening",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    langToggle: "عربي",
    loading: "Loading...",
    loadingDate: "Loading date...",
    loadingStations: "Loading stations...",
    chooseStation: "Choose a station first",
    unableToPlay: "Unable to play this stream",
    playing: "Playing: ",
    apiUnavailable: "API unavailable. Showing cached prayer times.",
    cachedDataUsed: "Cached data used because the API request failed.",
    unableToLoad: "Unable to load prayer times.",
    checkLocation: "Please check the location and try again.",
    unableToLoadRightNow: "Unable to load prayer times right now.",
    noCachedData: "No cached data available.",
    liveData: "Live data from Aladhan API.",
    prayerTimesLoaded: "Prayer times loaded successfully.",
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
    next: "Next",
    upcomingPrayer: "Upcoming prayer",
    tomorrow: "tomorrow",
    nextPrayerTomorrow: "Next prayer starts tomorrow",
    markAsDone: "Mark as Done",
    done: "Done",
    repeat: "Repeat",
    enterLocation: "Please enter both country and city.",
    unavailable: "Unavailable"
  },
  ar: {
    salahReminder: "مذكر الصلاة",
    nextPrayer: "الصلاة القادمة",
    prayerTimes: "مواقيت الصلاة",
    fetchingTimes: "جاري جلب المواقيت...",
    locationSettings: "إعدادات الموقع",
    notifications: "الإشعارات",
    country: "الدولة",
    city: "المدينة",
    saveLocation: "حفظ الموقع",
    quranRadio: "إذاعة القرآن",
    noStationPlaying: "لا توجد إذاعة تعمل",
    play: "تشغيل",
    stop: "إيقاف",
    azkar: "الأذكار",
    morning: "الصباح",
    evening: "المساء",
    darkMode: "الوضع المظلم",
    lightMode: "الوضع الفاتح",
    langToggle: "English",
    loading: "جاري التحميل...",
    loadingDate: "جاري تحميل التاريخ...",
    loadingStations: "جاري تحميل الإذاعات...",
    chooseStation: "اختر إذاعة أولاً",
    unableToPlay: "لا يمكن تشغيل هذا البث",
    playing: "يعمل الآن: ",
    apiUnavailable: "الخادم غير متوفر. يتم عرض المواقيت المحفوظة.",
    cachedDataUsed: "تم استخدام البيانات المحفوظة لعدم توفر الاتصال.",
    unableToLoad: "تعذر تحميل مواقيت الصلاة.",
    checkLocation: "يرجى التحقق من الموقع والمحاولة مرة أخرى.",
    unableToLoadRightNow: "تعذر تحميل مواقيت الصلاة الآن.",
    noCachedData: "لا توجد بيانات محفوظة.",
    liveData: "بيانات حية من خادم الأذان.",
    prayerTimesLoaded: "تم تحميل مواقيت الصلاة بنجاح.",
    fajr: "الفجر",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
    next: "التالية",
    upcomingPrayer: "الصلاة القادمة",
    tomorrow: "غداً",
    nextPrayerTomorrow: "الصلاة القادمة غداً",
    markAsDone: "تحديد كمنجز",
    done: "تم",
    repeat: "تكرار",
    enterLocation: "يرجى إدخال الدولة والمدينة.",
    unavailable: "غير متوفر"
  }
};

let currentLang = "en";

function t(key) {
  return TRANSLATIONS[currentLang][key] || key;
}

function applyLanguage(lang) {
  currentLang = lang;
  document.body.classList.toggle("lang-ar", lang === "ar");
  document.querySelector(".lang-toggle__label").textContent = t("langToggle");
  
  document.getElementById("salahReminderLabel").textContent = t("salahReminder");
  document.getElementById("nextPrayerLabel").textContent = t("nextPrayer");
  document.getElementById("prayerTimesLabel").textContent = t("prayerTimes");
  document.getElementById("locationSettingsLabel").textContent = t("locationSettings");
  document.getElementById("notificationsLabel").textContent = t("notifications");
  document.getElementById("countryLabel").textContent = t("country");
  document.getElementById("cityLabel").textContent = t("city");
  document.getElementById("saveLocationBtn").textContent = t("saveLocation");
  document.getElementById("quranRadioLabel").textContent = t("quranRadio");
  document.getElementById("radioPlay").textContent = t("play");
  document.getElementById("radioStop").textContent = t("stop");
  document.getElementById("azkarLabel").textContent = t("azkar");
  document.getElementById("morningAzkarTab").textContent = t("morning");
  document.getElementById("eveningAzkarTab").textContent = t("evening");
  
  const theme = document.body.classList.contains("theme-dark") ? "dark" : "light";
  updateThemeButton(theme);
  
  const radioSelect = document.getElementById("radioSelect");
  if (radioSelect && radioSelect.options.length > 0 && !radioStations.length) {
     if (radioSelect.options[0].textContent.includes("Loading")) {
         radioSelect.options[0].textContent = t("loadingStations");
     } else if (radioSelect.options[0].textContent.includes("No ")) {
         radioSelect.options[0].textContent = t("unavailable");
     }
  }

  const statusEl = document.getElementById("status");
  if (statusEl && statusEl.textContent.includes("Loading")) {
    updateStatus(t("fetchingTimes"));
  }
}

async function bindLangToggle() {
  document.getElementById("langToggle").addEventListener("click", async () => {
    const nextLang = currentLang === "en" ? "ar" : "en";
    await storageSet({ language: nextLang });
    applyLanguage(nextLang);
    await loadPrayerTimes();
    await loadRadioStations();
    renderAzkar();
  });
}
"""

content = content.replace('let currentTimeZone = DEFAULT_TIME_ZONE;', 'let currentTimeZone = DEFAULT_TIME_ZONE;\n' + translations_dict)

content = content.replace('bindThemeToggle();', 'bindThemeToggle();\n  bindLangToggle();')

content = content.replace('await applyStoredTheme();', 'await applyStoredLanguage();\n  await applyStoredTheme();')

apply_lang_func = """
async function applyStoredLanguage() {
  try {
    const stored = await storageGet("language");
    const lang = stored.language || "en";
    applyLanguage(lang);
  } catch (error) {
    applyLanguage("en");
  }
}
"""
content = content.replace('async function loadPreferences()', apply_lang_func + '\nasync function loadPreferences()')

content = content.replace('document.querySelector(".theme-toggle__label").textContent = theme === "dark" ? "Light mode" : "Dark mode";', 'document.querySelector(".theme-toggle__label").textContent = theme === "dark" ? t("lightMode") : t("darkMode");')

content = content.replace('updateStatus("Please enter both country and city.", true);', 'updateStatus(t("enterLocation"), true);')

content = content.replace('updateStatus("Loading prayer times...");', 'updateStatus(t("loading"));')
content = content.replace('loadingHintElement.textContent = "Fetching latest times...";', 'loadingHintElement.textContent = t("fetchingTimes");')

content = content.replace('updateStatus("Prayer times loaded successfully.");', 'updateStatus(t("prayerTimesLoaded"));')
content = content.replace('loadingHintElement.textContent = "Live data from Aladhan API.";', 'loadingHintElement.textContent = t("liveData");')

content = content.replace('updateStatus("API unavailable. Showing cached prayer times.");', 'updateStatus(t("apiUnavailable"));')
content = content.replace('loadingHintElement.textContent = "Cached data used because the API request failed.";', 'loadingHintElement.textContent = t("cachedDataUsed");')

content = content.replace('<strong>Unable to load prayer times.</strong>', '<strong>${t("unableToLoad")}</strong>')
content = content.replace('<span>Please check the location and try again.</span>', '<span>${t("checkLocation")}</span>')
content = content.replace('document.getElementById("nextPrayerName").textContent = "Unavailable";', 'document.getElementById("nextPrayerName").textContent = t("unavailable");')
content = content.replace('updateStatus("Unable to load prayer times right now.", true);', 'updateStatus(t("unableToLoadRightNow"), true);')
content = content.replace('loadingHintElement.textContent = "No cached data available.";', 'loadingHintElement.textContent = t("noCachedData");')

content = content.replace('<span class="prayer-card__name">${prayerName}</span>', '<span class="prayer-card__name">${t(prayerName.toLowerCase())}</span>')
content = content.replace('<span class="prayer-card__badge">Next</span>', '<span class="prayer-card__badge">${t("next")}</span>')

content = content.replace('<option value="">Loading stations...</option>', '<option value="">${t("loadingStations")}</option>')
content = content.replace('<option value="">No stations available</option>', '<option value="">${t("unavailable")}</option>')
content = content.replace('document.getElementById("radioStatus").textContent = "Radio list unavailable";', 'document.getElementById("radioStatus").textContent = t("unavailable");')

content = content.replace('document.getElementById("radioStatus").textContent = "Choose a station first";', 'document.getElementById("radioStatus").textContent = t("chooseStation");')
content = content.replace('document.getElementById("radioStatus").textContent = `Playing: ${station.title}`;', 'document.getElementById("radioStatus").textContent = `${t("playing")}${station.title}`;')
content = content.replace('document.getElementById("radioStatus").textContent = "Unable to play this stream";', 'document.getElementById("radioStatus").textContent = t("unableToPlay");')
content = content.replace('document.getElementById("radioStatus").textContent = "No station playing";', 'document.getElementById("radioStatus").textContent = t("noStationPlaying");')

content = content.replace('<span>Repeat ${item.count}</span>', '<span>${t("repeat")} ${item.count}</span>')
content = content.replace('${isDone ? "Done" : "Mark as Done"}', '${isDone ? t("done") : t("markAsDone")}')
content = content.replace('button.textContent = "Done";', 'button.textContent = t("done");')

content = content.replace('label: prayerName,', 'label: t(prayerName.toLowerCase()),')
content = content.replace('note: "Upcoming prayer",', 'note: t("upcomingPrayer"),')
content = content.replace('label: "Fajr",', 'label: t("fajr"),')
content = content.replace('${formatTimeForDisplay(prayerTimes.Fajr)} tomorrow', '${formatTimeForDisplay(prayerTimes.Fajr)} ${t("tomorrow")}')
content = content.replace('note: "Next prayer starts tomorrow",', 'note: t("nextPrayerTomorrow"),')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated popup.js with translations.")
