import re

file_path = r"d:\Projects-Django\ExtentionChrome\popup.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

cities_data = """
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
"""

# Insert cities_data after currentLang declaration
content = content.replace('let currentLang = "en";', f'let currentLang = "en";\n{cities_data}')

# Bind location form also needs to handle country change
country_change_logic = """
  document.getElementById("countryInput").addEventListener("change", (event) => {
    populateCities(event.target.value);
  });
"""
content = content.replace('document.getElementById("locationForm").addEventListener("submit"', f'{country_change_logic}\n  document.getElementById("locationForm").addEventListener("submit"')

# In loadPreferences, populate cities after setting country
load_pref_target = """
  document.getElementById("countryInput").value = location.country;
  document.getElementById("cityInput").value = location.city;
"""
load_pref_replace = """
  document.getElementById("countryInput").value = location.country;
  populateCities(location.country, location.city);
"""
content = content.replace(load_pref_target, load_pref_replace)

# In applyLanguage, re-populate cities so they get translated
apply_lang_replace = """
  const countrySelect = document.getElementById("countryInput");
  if (countrySelect) {
    for (const option of countrySelect.options) {
      option.textContent = t(option.value);
    }
    const currentCity = document.getElementById("cityInput").value;
    populateCities(countrySelect.value, currentCity);
  }
"""

content = content.replace("""
  const countrySelect = document.getElementById("countryInput");
  if (countrySelect) {
    for (const option of countrySelect.options) {
      option.textContent = t(option.value);
    }
  }
""", apply_lang_replace)

# Add city translations
city_translations_en = {
    "Cairo": "Cairo", "Alexandria": "Alexandria", "Giza": "Giza", "Port Said": "Port Said", "Suez": "Suez", "Luxor": "Luxor", "Aswan": "Aswan",
    "Riyadh": "Riyadh", "Jeddah": "Jeddah", "Mecca": "Mecca", "Medina": "Medina", "Dammam": "Dammam", "Khobar": "Khobar", "Abha": "Abha",
    "Dubai": "Dubai", "Abu Dhabi": "Abu Dhabi", "Sharjah": "Sharjah", "Ajman": "Ajman", "Al Ain": "Al Ain",
    "Kuwait City": "Kuwait City", "Al Ahmadi": "Al Ahmadi", "Hawalli": "Hawalli", "Salmiya": "Salmiya",
    "Doha": "Doha", "Al Rayyan": "Al Rayyan", "Al Khor": "Al Khor", "Al Wakrah": "Al Wakrah",
    "Manama": "Manama", "Riffa": "Riffa", "Muharraq": "Muharraq", "Hamad Town": "Hamad Town",
    "Muscat": "Muscat", "Salalah": "Salalah", "Sohar": "Sohar", "Nizwa": "Nizwa",
    "Amman": "Amman", "Zarqa": "Zarqa", "Irbid": "Irbid", "Aqaba": "Aqaba",
    "Beirut": "Beirut", "Tripoli": "Tripoli", "Sidon": "Sidon", "Tyre": "Tyre",
    "Damascus": "Damascus", "Aleppo": "Aleppo", "Homs": "Homs", "Latakia": "Latakia",
    "Baghdad": "Baghdad", "Basra": "Basra", "Mosul": "Mosul", "Erbil": "Erbil",
    "Jerusalem": "Jerusalem", "Gaza": "Gaza", "Hebron": "Hebron", "Nablus": "Nablus", "Ramallah": "Ramallah",
    "Casablanca": "Casablanca", "Rabat": "Rabat", "Fes": "Fes", "Marrakech": "Marrakech", "Tangier": "Tangier",
    "Algiers": "Algiers", "Oran": "Oran", "Constantine": "Constantine", "Annaba": "Annaba",
    "Tunis": "Tunis", "Sfax": "Sfax", "Sousse": "Sousse", "Kairouan": "Kairouan",
    "Benghazi": "Benghazi", "Misrata": "Misrata", "Tarhuna": "Tarhuna",
    "Khartoum": "Khartoum", "Omdurman": "Omdurman", "Port Sudan": "Port Sudan", "Nyala": "Nyala",
    "Sanaa": "Sanaa", "Aden": "Aden", "Taiz": "Taiz", "Al Hudaydah": "Al Hudaydah",
    "New York": "New York", "Los Angeles": "Los Angeles", "Chicago": "Chicago", "Houston": "Houston", "Phoenix": "Phoenix",
    "London": "London", "Birmingham": "Birmingham", "Manchester": "Manchester", "Glasgow": "Glasgow", "Liverpool": "Liverpool",
    "Toronto": "Toronto", "Montreal": "Montreal", "Vancouver": "Vancouver", "Calgary": "Calgary", "Ottawa": "Ottawa",
    "Sydney": "Sydney", "Melbourne": "Melbourne", "Brisbane": "Brisbane", "Perth": "Perth", "Adelaide": "Adelaide",
    "Berlin": "Berlin", "Munich": "Munich", "Frankfurt": "Frankfurt", "Hamburg": "Hamburg", "Cologne": "Cologne",
    "Paris": "Paris", "Marseille": "Marseille", "Lyon": "Lyon", "Toulouse": "Toulouse", "Nice": "Nice",
    "Rome": "Rome", "Milan": "Milan", "Naples": "Naples", "Turin": "Turin", "Palermo": "Palermo",
    "Madrid": "Madrid", "Barcelona": "Barcelona", "Valencia": "Valencia", "Seville": "Seville", "Zaragoza": "Zaragoza",
    "Istanbul": "Istanbul", "Ankara": "Ankara", "Izmir": "Izmir", "Bursa": "Bursa", "Antalya": "Antalya",
    "Kuala Lumpur": "Kuala Lumpur", "George Town": "George Town", "Ipoh": "Ipoh", "Shah Alam": "Shah Alam",
    "Jakarta": "Jakarta", "Surabaya": "Surabaya", "Bandung": "Bandung", "Medan": "Medan", "Bali": "Bali",
    "Karachi": "Karachi", "Lahore": "Lahore", "Islamabad": "Islamabad", "Rawalpindi": "Rawalpindi", "Faisalabad": "Faisalabad",
    "Mumbai": "Mumbai", "Delhi": "Delhi", "Bangalore": "Bangalore", "Hyderabad": "Hyderabad", "Chennai": "Chennai",
    "Dhaka": "Dhaka", "Chittagong": "Chittagong", "Khulna": "Khulna", "Sylhet": "Sylhet", "Rajshahi": "Rajshahi"
}

city_translations_ar = {
    "Cairo": "القاهرة", "Alexandria": "الإسكندرية", "Giza": "الجيزة", "Port Said": "بورسعيد", "Suez": "السويس", "Luxor": "الأقصر", "Aswan": "أسوان",
    "Riyadh": "الرياض", "Jeddah": "جدة", "Mecca": "مكة المكرمة", "Medina": "المدينة المنورة", "Dammam": "الدمام", "Khobar": "الخبر", "Abha": "أبها",
    "Dubai": "دبي", "Abu Dhabi": "أبو ظبي", "Sharjah": "الشارقة", "Ajman": "عجمان", "Al Ain": "العين",
    "Kuwait City": "مدينة الكويت", "Al Ahmadi": "الأحمدي", "Hawalli": "حولي", "Salmiya": "السالمية",
    "Doha": "الدوحة", "Al Rayyan": "الريان", "Al Khor": "الخور", "Al Wakrah": "الوكرة",
    "Manama": "المنامة", "Riffa": "الرفاع", "Muharraq": "المحرق", "Hamad Town": "مدينة حمد",
    "Muscat": "مسقط", "Salalah": "صلالة", "Sohar": "صحار", "Nizwa": "نزوى",
    "Amman": "عمان", "Zarqa": "الزرقاء", "Irbid": "إربد", "Aqaba": "العقبة",
    "Beirut": "بيروت", "Tripoli": "طرابلس", "Sidon": "صيدا", "Tyre": "صور",
    "Damascus": "دمشق", "Aleppo": "حلب", "Homs": "حمص", "Latakia": "اللاذقية",
    "Baghdad": "بغداد", "Basra": "البصرة", "Mosul": "الموصل", "Erbil": "أربيل",
    "Jerusalem": "القدس", "Gaza": "غزة", "Hebron": "الخليل", "Nablus": "نابلس", "Ramallah": "رام الله",
    "Casablanca": "الدار البيضاء", "Rabat": "الرباط", "Fes": "فاس", "Marrakech": "مراكش", "Tangier": "طنجة",
    "Algiers": "الجزائر العاصمة", "Oran": "وهران", "Constantine": "قسنطينة", "Annaba": "عنابة",
    "Tunis": "تونس العاصمة", "Sfax": "صفاقس", "Sousse": "سوسة", "Kairouan": "القيروان",
    "Benghazi": "بنغازي", "Misrata": "مصراتة", "Tarhuna": "ترهونة",
    "Khartoum": "الخرطوم", "Omdurman": "أم درمان", "Port Sudan": "بورتسودان", "Nyala": "نيالا",
    "Sanaa": "صنعاء", "Aden": "عدن", "Taiz": "تعز", "Al Hudaydah": "الحديدة",
    "New York": "نيويورك", "Los Angeles": "لوس أنجلوس", "Chicago": "شيكاغو", "Houston": "هيوستن", "Phoenix": "فينيكس",
    "London": "لندن", "Birmingham": "برمنغهام", "Manchester": "مانشستر", "Glasgow": "غلاسكو", "Liverpool": "ليفربول",
    "Toronto": "تورونتو", "Montreal": "مونتريال", "Vancouver": "فانكوفر", "Calgary": "كالجاري", "Ottawa": "أوتاوا",
    "Sydney": "سيدني", "Melbourne": "ملبورن", "Brisbane": "بريزبان", "Perth": "بيرث", "Adelaide": "أديلايد",
    "Berlin": "برلين", "Munich": "ميونخ", "Frankfurt": "فرانكفورت", "Hamburg": "هامبورغ", "Cologne": "كولونيا",
    "Paris": "باريس", "Marseille": "مارسيليا", "Lyon": "ليون", "Toulouse": "تولوز", "Nice": "نيس",
    "Rome": "روما", "Milan": "ميلانو", "Naples": "نابولي", "Turin": "تورينو", "Palermo": "باليرمو",
    "Madrid": "مدريد", "Barcelona": "برشلونة", "Valencia": "فالنسيا", "Seville": "إشبيلية", "Zaragoza": "سرقسطة",
    "Istanbul": "إسطنبول", "Ankara": "أنقرة", "Izmir": "إزمير", "Bursa": "بورصة", "Antalya": "أنطاليا",
    "Kuala Lumpur": "كوالالمبور", "George Town": "جورج تاون", "Ipoh": "ايبوه", "Shah Alam": "شاه عالم",
    "Jakarta": "جاكرتا", "Surabaya": "سورابايا", "Bandung": "باندونغ", "Medan": "ميدان", "Bali": "بالي",
    "Karachi": "كراتشي", "Lahore": "لاهور", "Islamabad": "إسلام آباد", "Rawalpindi": "روالبندي", "Faisalabad": "فيصل آباد",
    "Mumbai": "مومباي", "Delhi": "دلهي", "Bangalore": "بنغالور", "Hyderabad": "حيدر أباد", "Chennai": "تشيناي",
    "Dhaka": "دكا", "Chittagong": "شيتاجونج", "Khulna": "خولنا", "Sylhet": "سيلهيت", "Rajshahi": "راجشاهي"
}

en_additions = ",\n".join([f'    "{k}": "{v}"' for k, v in city_translations_en.items()])
ar_additions = ",\n".join([f'    "{k}": "{v}"' for k, v in city_translations_ar.items()])

content = content.replace('    "Bangladesh": "Bangladesh"', f'    "Bangladesh": "Bangladesh",\n{en_additions}')
content = content.replace('    "Bangladesh": "بنغلاديش"', f'    "Bangladesh": "بنغلاديش",\n{ar_additions}')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated popup.js with city selection and translations.")
