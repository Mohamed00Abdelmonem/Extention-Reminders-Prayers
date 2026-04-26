import re

file_path = r"d:\Projects-Django\ExtentionChrome\popup.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

countries = {
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
    "Bangladesh": "بنغلاديش"
}

# Add translations to 'en'
en_additions = ",\n".join([f'    "{k}": "{k}"' for k in countries.keys()])
# Add translations to 'ar'
ar_additions = ",\n".join([f'    "{k}": "{v}"' for k, v in countries.items()])

content = content.replace('unavailable: "Unavailable"\n  },', f'unavailable: "Unavailable",\n{en_additions}\n  }},')
content = content.replace('unavailable: "غير متوفر"\n  }', f'unavailable: "غير متوفر",\n{ar_additions}\n  }}')

# Add code to applyLanguage to translate select options
apply_logic = """
  const countrySelect = document.getElementById("countryInput");
  if (countrySelect) {
    for (const option of countrySelect.options) {
      option.textContent = t(option.value);
    }
  }
"""

content = content.replace('updateThemeButton(theme);', f'updateThemeButton(theme);\n{apply_logic}')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated popup.js with country translations.")
