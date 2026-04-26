// Popup script for prayer times, location settings, Quran radio, Azkar, and preferences.

const DEFAULT_LOCATION = { country: "Egypt", city: "Cairo" };
const DEFAULT_TIME_ZONE = "Africa/Cairo";
const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const STORAGE_KEYS = {
  prayerTimes: "prayerTimes",
  prayerTimesDate: "prayerTimesDate",
  prayerSchedule: "prayerSchedule",
  prayerScheduleDate: "prayerScheduleDate",
  location: "location",
  timeZone: "timeZone",
  theme: "theme",
  notificationsEnabled: "notificationsEnabled",
  lastRadioStation: "lastRadioStation",
  azkarDone: "azkarDone",
};

const AZKAR = {
  morning: [
    { text: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له.", count: 1 },
    { text: "اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور.", count: 1 },
    { text: "رضيت بالله ربا، وبالإسلام دينا، وبمحمد صلى الله عليه وسلم نبيا.", count: 3 },
    { text: "سبحان الله وبحمده.", count: 100 },
  ],
  evening: [
    { text: "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له.", count: 1 },
    { text: "اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير.", count: 1 },
    { text: "أعوذ بكلمات الله التامات من شر ما خلق.", count: 3 },
    { text: "اللهم صل وسلم على نبينا محمد.", count: 10 },
  ],
};

let radioStations = [];
let selectedAzkarType = "morning";
let currentTimeZone = DEFAULT_TIME_ZONE;

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
    unavailable: "Unavailable",
    "Egypt": "Egypt",
    "Saudi Arabia": "Saudi Arabia",
    "United Arab Emirates": "United Arab Emirates",
    "Kuwait": "Kuwait",
    "Qatar": "Qatar",
    "Bahrain": "Bahrain",
    "Oman": "Oman",
    "Jordan": "Jordan",
    "Lebanon": "Lebanon",
    "Syria": "Syria",
    "Iraq": "Iraq",
    "Palestine": "Palestine",
    "Morocco": "Morocco",
    "Algeria": "Algeria",
    "Tunisia": "Tunisia",
    "Libya": "Libya",
    "Sudan": "Sudan",
    "Yemen": "Yemen",
    "United States": "United States",
    "United Kingdom": "United Kingdom",
    "Canada": "Canada",
    "Australia": "Australia",
    "Germany": "Germany",
    "France": "France",
    "Italy": "Italy",
    "Spain": "Spain",
    "Turkey": "Turkey",
    "Malaysia": "Malaysia",
    "Indonesia": "Indonesia",
    "Pakistan": "Pakistan",
    "India": "India",
    "Bangladesh": "Bangladesh",
    "Cairo": "Cairo",
    "Alexandria": "Alexandria",
    "Giza": "Giza",
    "Port Said": "Port Said",
    "Suez": "Suez",
    "Luxor": "Luxor",
    "Aswan": "Aswan",
    "Riyadh": "Riyadh",
    "Jeddah": "Jeddah",
    "Mecca": "Mecca",
    "Medina": "Medina",
    "Dammam": "Dammam",
    "Khobar": "Khobar",
    "Abha": "Abha",
    "Dubai": "Dubai",
    "Abu Dhabi": "Abu Dhabi",
    "Sharjah": "Sharjah",
    "Ajman": "Ajman",
    "Al Ain": "Al Ain",
    "Kuwait City": "Kuwait City",
    "Al Ahmadi": "Al Ahmadi",
    "Hawalli": "Hawalli",
    "Salmiya": "Salmiya",
    "Doha": "Doha",
    "Al Rayyan": "Al Rayyan",
    "Al Khor": "Al Khor",
    "Al Wakrah": "Al Wakrah",
    "Manama": "Manama",
    "Riffa": "Riffa",
    "Muharraq": "Muharraq",
    "Hamad Town": "Hamad Town",
    "Muscat": "Muscat",
    "Salalah": "Salalah",
    "Sohar": "Sohar",
    "Nizwa": "Nizwa",
    "Amman": "Amman",
    "Zarqa": "Zarqa",
    "Irbid": "Irbid",
    "Aqaba": "Aqaba",
    "Beirut": "Beirut",
    "Tripoli": "Tripoli",
    "Sidon": "Sidon",
    "Tyre": "Tyre",
    "Damascus": "Damascus",
    "Aleppo": "Aleppo",
    "Homs": "Homs",
    "Latakia": "Latakia",
    "Baghdad": "Baghdad",
    "Basra": "Basra",
    "Mosul": "Mosul",
    "Erbil": "Erbil",
    "Jerusalem": "Jerusalem",
    "Gaza": "Gaza",
    "Hebron": "Hebron",
    "Nablus": "Nablus",
    "Ramallah": "Ramallah",
    "Casablanca": "Casablanca",
    "Rabat": "Rabat",
    "Fes": "Fes",
    "Marrakech": "Marrakech",
    "Tangier": "Tangier",
    "Algiers": "Algiers",
    "Oran": "Oran",
    "Constantine": "Constantine",
    "Annaba": "Annaba",
    "Tunis": "Tunis",
    "Sfax": "Sfax",
    "Sousse": "Sousse",
    "Kairouan": "Kairouan",
    "Benghazi": "Benghazi",
    "Misrata": "Misrata",
    "Tarhuna": "Tarhuna",
    "Khartoum": "Khartoum",
    "Omdurman": "Omdurman",
    "Port Sudan": "Port Sudan",
    "Nyala": "Nyala",
    "Sanaa": "Sanaa",
    "Aden": "Aden",
    "Taiz": "Taiz",
    "Al Hudaydah": "Al Hudaydah",
    "New York": "New York",
    "Los Angeles": "Los Angeles",
    "Chicago": "Chicago",
    "Houston": "Houston",
    "Phoenix": "Phoenix",
    "London": "London",
    "Birmingham": "Birmingham",
    "Manchester": "Manchester",
    "Glasgow": "Glasgow",
    "Liverpool": "Liverpool",
    "Toronto": "Toronto",
    "Montreal": "Montreal",
    "Vancouver": "Vancouver",
    "Calgary": "Calgary",
    "Ottawa": "Ottawa",
    "Sydney": "Sydney",
    "Melbourne": "Melbourne",
    "Brisbane": "Brisbane",
    "Perth": "Perth",
    "Adelaide": "Adelaide",
    "Berlin": "Berlin",
    "Munich": "Munich",
    "Frankfurt": "Frankfurt",
    "Hamburg": "Hamburg",
    "Cologne": "Cologne",
    "Paris": "Paris",
    "Marseille": "Marseille",
    "Lyon": "Lyon",
    "Toulouse": "Toulouse",
    "Nice": "Nice",
    "Rome": "Rome",
    "Milan": "Milan",
    "Naples": "Naples",
    "Turin": "Turin",
    "Palermo": "Palermo",
    "Madrid": "Madrid",
    "Barcelona": "Barcelona",
    "Valencia": "Valencia",
    "Seville": "Seville",
    "Zaragoza": "Zaragoza",
    "Istanbul": "Istanbul",
    "Ankara": "Ankara",
    "Izmir": "Izmir",
    "Bursa": "Bursa",
    "Antalya": "Antalya",
    "Kuala Lumpur": "Kuala Lumpur",
    "George Town": "George Town",
    "Ipoh": "Ipoh",
    "Shah Alam": "Shah Alam",
    "Jakarta": "Jakarta",
    "Surabaya": "Surabaya",
    "Bandung": "Bandung",
    "Medan": "Medan",
    "Bali": "Bali",
    "Karachi": "Karachi",
    "Lahore": "Lahore",
    "Islamabad": "Islamabad",
    "Rawalpindi": "Rawalpindi",
    "Faisalabad": "Faisalabad",
    "Mumbai": "Mumbai",
    "Delhi": "Delhi",
    "Bangalore": "Bangalore",
    "Hyderabad": "Hyderabad",
    "Chennai": "Chennai",
    "Dhaka": "Dhaka",
    "Chittagong": "Chittagong",
    "Khulna": "Khulna",
    "Sylhet": "Sylhet",
    "Rajshahi": "Rajshahi"
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
    unavailable: "غير متوفر",
    "Egypt": "مصر",
    "Saudi Arabia": "السعودية",
    "United Arab Emirates": "الإمارات العربية المتحدة",
    "Kuwait": "الكويت",
    "Qatar": "قطر",
    "Bahrain": "البحرين",
    "Oman": "عمان",
    "Jordan": "الأردن",
    "Lebanon": "لبنان",
    "Syria": "سوريا",
    "Iraq": "العراق",
    "Palestine": "فلسطين",
    "Morocco": "المغرب",
    "Algeria": "الجزائر",
    "Tunisia": "تونس",
    "Libya": "ليبيا",
    "Sudan": "السودان",
    "Yemen": "اليمن",
    "United States": "الولايات المتحدة",
    "United Kingdom": "المملكة المتحدة",
    "Canada": "كندا",
    "Australia": "أستراليا",
    "Germany": "ألمانيا",
    "France": "فرنسا",
    "Italy": "إيطاليا",
    "Spain": "إسبانيا",
    "Turkey": "تركيا",
    "Malaysia": "ماليزيا",
    "Indonesia": "إندونيسيا",
    "Pakistan": "باكستان",
    "India": "الهند",
    "Bangladesh": "بنغلاديش",
    "Cairo": "القاهرة",
    "Alexandria": "الإسكندرية",
    "Giza": "الجيزة",
    "Port Said": "بورسعيد",
    "Suez": "السويس",
    "Luxor": "الأقصر",
    "Aswan": "أسوان",
    "Riyadh": "الرياض",
    "Jeddah": "جدة",
    "Mecca": "مكة المكرمة",
    "Medina": "المدينة المنورة",
    "Dammam": "الدمام",
    "Khobar": "الخبر",
    "Abha": "أبها",
    "Dubai": "دبي",
    "Abu Dhabi": "أبو ظبي",
    "Sharjah": "الشارقة",
    "Ajman": "عجمان",
    "Al Ain": "العين",
    "Kuwait City": "مدينة الكويت",
    "Al Ahmadi": "الأحمدي",
    "Hawalli": "حولي",
    "Salmiya": "السالمية",
    "Doha": "الدوحة",
    "Al Rayyan": "الريان",
    "Al Khor": "الخور",
    "Al Wakrah": "الوكرة",
    "Manama": "المنامة",
    "Riffa": "الرفاع",
    "Muharraq": "المحرق",
    "Hamad Town": "مدينة حمد",
    "Muscat": "مسقط",
    "Salalah": "صلالة",
    "Sohar": "صحار",
    "Nizwa": "نزوى",
    "Amman": "عمان",
    "Zarqa": "الزرقاء",
    "Irbid": "إربد",
    "Aqaba": "العقبة",
    "Beirut": "بيروت",
    "Tripoli": "طرابلس",
    "Sidon": "صيدا",
    "Tyre": "صور",
    "Damascus": "دمشق",
    "Aleppo": "حلب",
    "Homs": "حمص",
    "Latakia": "اللاذقية",
    "Baghdad": "بغداد",
    "Basra": "البصرة",
    "Mosul": "الموصل",
    "Erbil": "أربيل",
    "Jerusalem": "القدس",
    "Gaza": "غزة",
    "Hebron": "الخليل",
    "Nablus": "نابلس",
    "Ramallah": "رام الله",
    "Casablanca": "الدار البيضاء",
    "Rabat": "الرباط",
    "Fes": "فاس",
    "Marrakech": "مراكش",
    "Tangier": "طنجة",
    "Algiers": "الجزائر العاصمة",
    "Oran": "وهران",
    "Constantine": "قسنطينة",
    "Annaba": "عنابة",
    "Tunis": "تونس العاصمة",
    "Sfax": "صفاقس",
    "Sousse": "سوسة",
    "Kairouan": "القيروان",
    "Benghazi": "بنغازي",
    "Misrata": "مصراتة",
    "Tarhuna": "ترهونة",
    "Khartoum": "الخرطوم",
    "Omdurman": "أم درمان",
    "Port Sudan": "بورتسودان",
    "Nyala": "نيالا",
    "Sanaa": "صنعاء",
    "Aden": "عدن",
    "Taiz": "تعز",
    "Al Hudaydah": "الحديدة",
    "New York": "نيويورك",
    "Los Angeles": "لوس أنجلوس",
    "Chicago": "شيكاغو",
    "Houston": "هيوستن",
    "Phoenix": "فينيكس",
    "London": "لندن",
    "Birmingham": "برمنغهام",
    "Manchester": "مانشستر",
    "Glasgow": "غلاسكو",
    "Liverpool": "ليفربول",
    "Toronto": "تورونتو",
    "Montreal": "مونتريال",
    "Vancouver": "فانكوفر",
    "Calgary": "كالجاري",
    "Ottawa": "أوتاوا",
    "Sydney": "سيدني",
    "Melbourne": "ملبورن",
    "Brisbane": "بريزبان",
    "Perth": "بيرث",
    "Adelaide": "أديلايد",
    "Berlin": "برلين",
    "Munich": "ميونخ",
    "Frankfurt": "فرانكفورت",
    "Hamburg": "هامبورغ",
    "Cologne": "كولونيا",
    "Paris": "باريس",
    "Marseille": "مارسيليا",
    "Lyon": "ليون",
    "Toulouse": "تولوز",
    "Nice": "نيس",
    "Rome": "روما",
    "Milan": "ميلانو",
    "Naples": "نابولي",
    "Turin": "تورينو",
    "Palermo": "باليرمو",
    "Madrid": "مدريد",
    "Barcelona": "برشلونة",
    "Valencia": "فالنسيا",
    "Seville": "إشبيلية",
    "Zaragoza": "سرقسطة",
    "Istanbul": "إسطنبول",
    "Ankara": "أنقرة",
    "Izmir": "إزمير",
    "Bursa": "بورصة",
    "Antalya": "أنطاليا",
    "Kuala Lumpur": "كوالالمبور",
    "George Town": "جورج تاون",
    "Ipoh": "ايبوه",
    "Shah Alam": "شاه عالم",
    "Jakarta": "جاكرتا",
    "Surabaya": "سورابايا",
    "Bandung": "باندونغ",
    "Medan": "ميدان",
    "Bali": "بالي",
    "Karachi": "كراتشي",
    "Lahore": "لاهور",
    "Islamabad": "إسلام آباد",
    "Rawalpindi": "روالبندي",
    "Faisalabad": "فيصل آباد",
    "Mumbai": "مومباي",
    "Delhi": "دلهي",
    "Bangalore": "بنغالور",
    "Hyderabad": "حيدر أباد",
    "Chennai": "تشيناي",
    "Dhaka": "دكا",
    "Chittagong": "شيتاجونج",
    "Khulna": "خولنا",
    "Sylhet": "سيلهيت",
    "Rajshahi": "راجشاهي"
  }
};

let currentLang = "en";

const CITY_MAP = {
  "Egypt": ["Cairo", "Alexandria", "Giza", "Port Said", "Suez", "Luxor", "Aswan"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Abha"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain"],
  "Kuwait": ["Kuwait City", "Al Ahmadi", "Hawalli", "Salmiya"],
  "Qatar": ["Doha", "Al Rayyan", "Al Khor", "Al Wakrah"],
  "Bahrain": ["Manama", "Riffa", "Muharraq", "Hamad Town"],
  "Oman": ["Muscat", "Salalah", "Sohar", "Nizwa"],
  "Jordan": ["Amman", "Zarqa", "Irbid", "Aqaba"],
  "Lebanon": ["Beirut", "Tripoli", "Sidon", "Tyre"],
  "Syria": ["Damascus", "Aleppo", "Homs", "Latakia"],
  "Iraq": ["Baghdad", "Basra", "Mosul", "Erbil"],
  "Palestine": ["Jerusalem", "Gaza", "Hebron", "Nablus", "Ramallah"],
  "Morocco": ["Casablanca", "Rabat", "Fes", "Marrakech", "Tangier"],
  "Algeria": ["Algiers", "Oran", "Constantine", "Annaba"],
  "Tunisia": ["Tunis", "Sfax", "Sousse", "Kairouan"],
  "Libya": ["Tripoli", "Benghazi", "Misrata", "Tarhuna"],
  "Sudan": ["Khartoum", "Omdurman", "Port Sudan", "Nyala"],
  "Yemen": ["Sanaa", "Aden", "Taiz", "Al Hudaydah"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Palermo"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"],
  "Malaysia": ["Kuala Lumpur", "George Town", "Ipoh", "Shah Alam"],
  "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan", "Bali"],
  "Pakistan": ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"],
  "Bangladesh": ["Dhaka", "Chittagong", "Khulna", "Sylhet", "Rajshahi"]
};

function populateCities(country, selectedCity = "") {
  const citySelect = document.getElementById("cityInput");
  if (!citySelect) return;
  citySelect.innerHTML = "";
  const cities = CITY_MAP[country] || [selectedCity || "Capital City"];
  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = t(city);
    if (city === selectedCity) {
      option.selected = true;
    }
    citySelect.appendChild(option);
  });
}


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
  
  if (document.getElementById("navPrayerLabel")) {
    document.getElementById("navPrayerLabel").textContent = currentLang === "ar" ? "الصلاة" : "Prayer";
    document.getElementById("navAzkarLabel").textContent = t("azkar");
    document.getElementById("navRadioLabel").textContent = t("quranRadio");
    document.getElementById("navSettingsLabel").textContent = currentLang === "ar" ? "الإعدادات" : "Settings";
  }
  
  const theme = document.body.classList.contains("theme-dark") ? "dark" : "light";
  updateThemeButton(theme);

  const countrySelect = document.getElementById("countryInput");
  if (countrySelect) {
    for (const option of countrySelect.options) {
      option.textContent = t(option.value);
    }
    const currentCity = document.getElementById("cityInput").value;
    populateCities(countrySelect.value, currentCity);
  }

  
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


document.addEventListener("DOMContentLoaded", () => {
  initializePopup();
});

async function initializePopup() {
  bindTabs();
  bindThemeToggle();
  bindLangToggle();
  bindLocationForm();
  bindNotificationsToggle();
  bindRadioControls();
  bindAzkarTabs();

  await applyStoredLanguage();
  await applyStoredTheme();
  await loadPreferences();
  renderAzkar();
  await loadRadioStations();
  await loadPrayerTimes();
}

function bindTabs() {
  const tabs = document.querySelectorAll(".nav-item");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("nav-item--active"));
      contents.forEach((c) => c.classList.remove("tab-content--active"));

      tab.classList.add("nav-item--active");
      const targetId = tab.getAttribute("data-target");
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.classList.add("tab-content--active");
      }
    });
  });
}

function bindThemeToggle() {
  document.getElementById("themeToggle").addEventListener("click", async () => {
    const nextTheme = document.body.classList.contains("theme-dark") ? "light" : "dark";
    await storageSet({ [STORAGE_KEYS.theme]: nextTheme });
    applyTheme(nextTheme);
    updateThemeButton(nextTheme);
  });
}

function bindLocationForm() {
  
  document.getElementById("countryInput").addEventListener("change", (event) => {
    populateCities(event.target.value);
  });

  document.getElementById("locationForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const country = document.getElementById("countryInput").value.trim();
    const city = document.getElementById("cityInput").value.trim();

    if (!country || !city) {
      updateStatus(t("enterLocation"), true);
      return;
    }

    await storageSet({
      [STORAGE_KEYS.location]: { country, city },
      [STORAGE_KEYS.prayerScheduleDate]: "",
      [STORAGE_KEYS.prayerTimesDate]: "",
    });
    await sendRuntimeMessage({ type: "LOCATION_UPDATED" });
    await loadPrayerTimes();
  });
}

function bindNotificationsToggle() {
  document.getElementById("notificationsToggle").addEventListener("change", async (event) => {
    const enabled = event.target.checked;
    await storageSet({ [STORAGE_KEYS.notificationsEnabled]: enabled });
    await sendRuntimeMessage({ type: "NOTIFICATION_PREFS_UPDATED" });
  });
}

function bindRadioControls() {
  document.getElementById("radioPlay").addEventListener("click", playSelectedRadio);
  document.getElementById("radioStop").addEventListener("click", stopRadio);
  document.getElementById("radioSelect").addEventListener("change", async (event) => {
    await storageSet({ [STORAGE_KEYS.lastRadioStation]: event.target.value });
  });
}

function bindAzkarTabs() {
  document.getElementById("morningAzkarTab").addEventListener("click", () => switchAzkarType("morning"));
  document.getElementById("eveningAzkarTab").addEventListener("click", () => switchAzkarType("evening"));
}

async function applyStoredTheme() {
  try {
    const stored = await storageGet(STORAGE_KEYS.theme);
    const theme = stored[STORAGE_KEYS.theme] || "light";
    applyTheme(theme);
    updateThemeButton(theme);

  const countrySelect = document.getElementById("countryInput");
  if (countrySelect) {
    for (const option of countrySelect.options) {
      option.textContent = t(option.value);
    }
    const currentCity = document.getElementById("cityInput").value;
    populateCities(countrySelect.value, currentCity);
  }

  } catch (error) {
    console.warn("Theme setup failed:", error);
    applyTheme("light");
    updateThemeButton("light");
  }
}


async function applyStoredLanguage() {
  try {
    const stored = await storageGet("language");
    const lang = stored.language || "en";
    applyLanguage(lang);
  } catch (error) {
    applyLanguage("en");
  }
}

async function loadPreferences() {
  const stored = await storageGet([
    STORAGE_KEYS.location,
    STORAGE_KEYS.notificationsEnabled,
    STORAGE_KEYS.timeZone,
  ]);
  const location = normalizeLocation(stored[STORAGE_KEYS.location]);

  currentTimeZone = stored[STORAGE_KEYS.timeZone] || DEFAULT_TIME_ZONE;
  document.getElementById("countryInput").value = location.country;
  populateCities(location.country, location.city);
  document.getElementById("cityName").textContent = `${location.city}, ${location.country}`;
  document.getElementById("notificationsToggle").checked = stored[STORAGE_KEYS.notificationsEnabled] !== false;
}

function applyTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-light", theme !== "dark");
}

function updateThemeButton(theme) {
  document.querySelector(".theme-toggle__label").textContent = theme === "dark" ? t("lightMode") : t("darkMode");
}

async function loadPrayerTimes() {
  const prayerListElement = document.getElementById("prayerTimes");
  const loadingHintElement = document.getElementById("loadingHint");
  const dateElement = document.getElementById("currentDate");
  const location = await getStoredLocation();

  document.getElementById("cityName").textContent = `${location.city}, ${location.country}`;
  dateElement.textContent = formatDate(new Date(), currentTimeZone);
  updateStatus(t("loading"));
  loadingHintElement.textContent = t("fetchingTimes");

  try {
    const result = await fetchPrayerTimes(location);
    currentTimeZone = result.timeZone;

    await storageSet({
      [STORAGE_KEYS.prayerTimes]: result.prayerTimes,
      [STORAGE_KEYS.prayerTimesDate]: getDateKey(new Date(), result.timeZone),
      [STORAGE_KEYS.prayerSchedule]: serializePrayerSchedule(buildPrayerSchedule(result.prayerTimes, new Date(), result.timeZone)),
      [STORAGE_KEYS.prayerScheduleDate]: getDateKey(new Date(), result.timeZone),
      [STORAGE_KEYS.timeZone]: result.timeZone,
    });
    await sendRuntimeMessage({ type: "PRAYER_TIMES_UPDATED" });

    renderPrayerSummary(result.prayerTimes);
    dateElement.textContent = formatDate(new Date(), result.timeZone);
    updateStatus(t("prayerTimesLoaded"));
    loadingHintElement.textContent = t("liveData");
    await maybeAutoPlayRadioAfterFajr(result.prayerTimes);
  } catch (error) {
    console.error("Failed to load prayer times:", error);
    await renderCachedPrayerTimes(prayerListElement, loadingHintElement);
  }
}

async function fetchPrayerTimes(location) {
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(location.city)}&country=${encodeURIComponent(location.country)}&method=5`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
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

  return {
    prayerTimes: normalizePrayerTimes(timings),
    timeZone: data?.data?.meta?.timezone || DEFAULT_TIME_ZONE,
  };
}

async function renderCachedPrayerTimes(prayerListElement, loadingHintElement) {
  const cached = await storageGet([STORAGE_KEYS.prayerTimes, STORAGE_KEYS.timeZone]);

  if (cached[STORAGE_KEYS.prayerTimes]) {
    currentTimeZone = cached[STORAGE_KEYS.timeZone] || DEFAULT_TIME_ZONE;
    renderPrayerSummary(cached[STORAGE_KEYS.prayerTimes]);
    updateStatus(t("apiUnavailable"));
    loadingHintElement.textContent = t("cachedDataUsed");
    return;
  }

  prayerListElement.innerHTML = `
    <div class="empty-state">
      <strong>${t("unableToLoad")}</strong>
      <span>${t("checkLocation")}</span>
    </div>
  `;
  document.getElementById("nextPrayerName").textContent = t("unavailable");
  document.getElementById("nextPrayerTime").textContent = "--:--";
  updateStatus(t("unableToLoadRightNow"), true);
  loadingHintElement.textContent = t("noCachedData");
}

function renderPrayerSummary(prayerTimes) {
  const nextPrayer = getNextPrayer(prayerTimes, new Date(), currentTimeZone);

  document.getElementById("nextPrayerName").textContent = nextPrayer.label;
  document.getElementById("nextPrayerTime").textContent = nextPrayer.time;
  renderPrayerTimes(prayerTimes, document.getElementById("prayerTimes"), nextPrayer);
}

function renderPrayerTimes(prayerTimes, prayerListElement, nextPrayer) {
  prayerListElement.innerHTML = "";

  for (const prayerName of PRAYER_NAMES) {
    const isNext = nextPrayer.name === prayerName;
    const card = document.createElement("article");
    card.className = `prayer-card${isNext ? " prayer-card--next" : ""}`;
    card.innerHTML = `
      <div class="prayer-card__top">
        <span class="prayer-card__name">${t(prayerName.toLowerCase())}</span>
        ${isNext ? `<span class="prayer-card__badge">${t("next")}</span>` : ""}
      </div>
      <div class="prayer-card__time">${formatTimeForDisplay(prayerTimes[prayerName])}</div>
      <div class="prayer-card__note">${isNext ? nextPrayer.note : ""}</div>
    `;
    prayerListElement.appendChild(card);
  }
}

async function loadRadioStations() {
  const select = document.getElementById("radioSelect");

  try {
    const response = await fetch(chrome.runtime.getURL("quran-egy.json"));
    const stations = await response.json();
    radioStations = stations.map(normalizeStation).filter(Boolean);

    if (!radioStations.length) {
      throw new Error("No playable stations found.");
    }

    const stored = await storageGet(STORAGE_KEYS.lastRadioStation);
    select.innerHTML = "";

    for (const station of radioStations) {
      const option = document.createElement("option");
      option.value = station.url;
      option.textContent = station.title;
      select.appendChild(option);
    }

    select.value = stored[STORAGE_KEYS.lastRadioStation] || radioStations[0].url;
    if (!select.value) {
      select.value = radioStations[0].url;
    }
  } catch (error) {
    console.error("Unable to load radio stations:", error);
    select.innerHTML = '<option value="">${t("unavailable")}</option>';
    document.getElementById("radioStatus").textContent = t("unavailable");
  }
}

function normalizeStation(station) {
  const url = [station.Source1, station.Source2, station.Source3, station.Source4, station.Source5, station.Source6]
    .find((source) => source && source !== "-");

  if (!station.Title || !url) {
    return null;
  }

  return { title: station.Title, url };
}

async function playSelectedRadio() {
  const select = document.getElementById("radioSelect");
  const url = select.value;
  const station = radioStations.find((item) => item.url === url);

  if (!url || !station) {
    document.getElementById("radioStatus").textContent = t("chooseStation");
    return;
  }

  try {
    const response = await sendRuntimeMessage({ action: "playRadio", url: url });
    if (response && response.ok === false) {
      throw new Error(response.error);
    }
    await storageSet({ [STORAGE_KEYS.lastRadioStation]: url });
    document.getElementById("radioStatus").textContent = `${t("playing")}${station.title}`;
  } catch (error) {
    console.warn("Radio playback failed:", error);
    document.getElementById("radioStatus").textContent = t("unableToPlay");
  }
}

async function stopRadio() {
  try {
    await sendRuntimeMessage({ action: "stopAudio" });
  } catch (error) {
    console.warn("Failed to stop radio:", error);
  }

  document.getElementById("radioStatus").textContent = t("noStationPlaying");
}

async function maybeAutoPlayRadioAfterFajr(prayerTimes) {
  const stored = await storageGet("radioAutoPlayedDate");
  const todayKey = getDateKey(new Date(), currentTimeZone);
  const fajrDate = buildPrayerSchedule(prayerTimes, new Date(), currentTimeZone).Fajr;
  const minutesAfterFajr = (Date.now() - fajrDate.getTime()) / 60000;

  if (stored.radioAutoPlayedDate === todayKey || minutesAfterFajr < 0 || minutesAfterFajr > 30) {
    return;
  }

  await storageSet({ radioAutoPlayedDate: todayKey });
  await playSelectedRadio();
}

function switchAzkarType(type) {
  selectedAzkarType = type;
  document.getElementById("morningAzkarTab").classList.toggle("segment-button--active", type === "morning");
  document.getElementById("eveningAzkarTab").classList.toggle("segment-button--active", type === "evening");
  renderAzkar();
}

async function renderAzkar() {
  const list = document.getElementById("azkarList");
  const stored = await storageGet(STORAGE_KEYS.azkarDone);
  const doneMap = stored[STORAGE_KEYS.azkarDone] || {};
  const todayKey = getDateKey(new Date(), currentTimeZone);
  const items = AZKAR[selectedAzkarType];

  list.innerHTML = "";

  items.forEach((item, index) => {
    const doneKey = `${todayKey}:${selectedAzkarType}:${index}`;
    const isDone = Boolean(doneMap[doneKey]);
    const card = document.createElement("article");
    card.className = "azkar-item";
    card.innerHTML = `
      <p class="azkar-item__text">${item.text}</p>
      <div class="azkar-item__meta">
        <span>${t("repeat")} ${item.count}</span>
        <button type="button" class="done-button${isDone ? " done-button--done" : ""}" data-done-key="${doneKey}">
          ${isDone ? t("done") : t("markAsDone")}
        </button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll(".done-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const latest = await storageGet(STORAGE_KEYS.azkarDone);
      const nextDoneMap = latest[STORAGE_KEYS.azkarDone] || {};
      nextDoneMap[button.dataset.doneKey] = true;
      await storageSet({ [STORAGE_KEYS.azkarDone]: nextDoneMap });
      button.classList.add("done-button--done");
      button.textContent = t("done");
    });
  });
}

function normalizePrayerTimes(timings) {
  const prayerTimes = {};
  for (const prayerName of PRAYER_NAMES) {
    prayerTimes[prayerName] = normalizeTime(timings[prayerName]);
  }
  return prayerTimes;
}

function getNextPrayer(prayerTimes, referenceDate, timeZone) {
  const schedule = buildPrayerSchedule(prayerTimes, referenceDate, timeZone);
  const now = new Date(referenceDate.getTime());

  for (const prayerName of PRAYER_NAMES) {
    if (now.getTime() < schedule[prayerName].getTime()) {
      return {
        name: prayerName,
        label: t(prayerName.toLowerCase()),
        time: formatPrayerTime(schedule[prayerName], timeZone),
        note: t("upcomingPrayer"),
      };
    }
  }

  return {
    name: "Fajr",
    label: t("fajr"),
    time: `${formatTimeForDisplay(prayerTimes.Fajr)} ${t("tomorrow")}`,
    note: t("nextPrayerTomorrow"),
  };
}

function buildPrayerSchedule(prayerTimes, referenceDate, timeZone) {
  const { year, month, day } = getTimeZoneParts(referenceDate, timeZone);
  const schedule = {};

  for (const prayerName of PRAYER_NAMES) {
    const { hour, minute } = parseHourMinute(prayerTimes[prayerName]);
    schedule[prayerName] = createZonedDate({ year, month, day, hour, minute, second: 0, timeZone });
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

function parseHourMinute(timeValue) {
  const [hour, minute] = normalizeTime(timeValue).split(":").map(Number);
  return { hour, minute };
}

function normalizeTime(timeValue) {
  if (!timeValue) {
    return "--:--";
  }
  return String(timeValue).slice(0, 5);
}

function formatDate(referenceDate, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(referenceDate);
}

function getDateKey(referenceDate, timeZone) {
  const { year, month, day } = getTimeZoneParts(referenceDate, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatPrayerTime(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatTimeForDisplay(timeValue) {
  const normalized = normalizeTime(timeValue);
  const [hour, minute] = normalized.split(":").map(Number);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return normalized;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function serializePrayerSchedule(schedule) {
  const serialized = {};
  for (const prayerName of PRAYER_NAMES) {
    serialized[prayerName] = schedule[prayerName].getTime();
  }
  return serialized;
}

async function getStoredLocation() {
  const stored = await storageGet(STORAGE_KEYS.location);
  return normalizeLocation(stored[STORAGE_KEYS.location]);
}

function normalizeLocation(location) {
  return {
    country: location?.country || DEFAULT_LOCATION.country,
    city: location?.city || DEFAULT_LOCATION.city,
  };
}

function updateStatus(message, isError = false) {
  const statusElement = document.getElementById("status");
  statusElement.textContent = message;
  statusElement.classList.toggle("error-text", isError);
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

function sendRuntimeMessage(payload) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(payload, (response) => resolve(response));
    } catch (error) {
      console.warn("Runtime message failed:", error);
      resolve();
    }
  });
}
