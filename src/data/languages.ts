/**
 * Languages a visitor can pick as "my language". The code is a BCP 47 tag.
 * `ui` marks languages the site interface itself is translated into.
 * The others still work for "is my language supported by this tool?" checks.
 */
export interface LanguageOption {
  code: string;
  /** English name, matches the names tools report. */
  name: string;
  /** Name in its own language, for the picker. */
  native: string;
  ui: boolean;
  rtl?: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", native: "English", ui: true },
  { code: "es", name: "Spanish", native: "Español", ui: true },
  { code: "zh", name: "Chinese", native: "中文", ui: true },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", ui: true },
  { code: "ko", name: "Korean", native: "한국어", ui: false },
  { code: "tl", name: "Tagalog", native: "Tagalog", ui: false },
  { code: "ar", name: "Arabic", native: "العربية", ui: false, rtl: true },
  { code: "ht", name: "Haitian Creole", native: "Kreyòl ayisyen", ui: false },
  { code: "pt", name: "Portuguese", native: "Português", ui: false },
  { code: "fr", name: "French", native: "Français", ui: false },
  { code: "ru", name: "Russian", native: "Русский", ui: false },
  { code: "hi", name: "Hindi", native: "हिन्दी", ui: false },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", ui: false },
  { code: "ur", name: "Urdu", native: "اردو", ui: false, rtl: true },
  { code: "bn", name: "Bengali", native: "বাংলা", ui: false },
  { code: "am", name: "Amharic", native: "አማርኛ", ui: false },
  { code: "so", name: "Somali", native: "Soomaali", ui: false },
  { code: "fa", name: "Persian", native: "فارسی", ui: false, rtl: true },
  { code: "pl", name: "Polish", native: "Polski", ui: false },
  { code: "uk", name: "Ukrainian", native: "Українська", ui: false },
  { code: "th", name: "Thai", native: "ไทย", ui: false },
  { code: "ja", name: "Japanese", native: "日本語", ui: false },
  { code: "de", name: "German", native: "Deutsch", ui: false },
  { code: "it", name: "Italian", native: "Italiano", ui: false },
  { code: "el", name: "Greek", native: "Ελληνικά", ui: false },
  { code: "tr", name: "Turkish", native: "Türkçe", ui: false },
  { code: "sw", name: "Swahili", native: "Kiswahili", ui: false },
  { code: "ne", name: "Nepali", native: "नेपाली", ui: false },
  { code: "km", name: "Khmer", native: "ខ្មែរ", ui: false },
  { code: "hmn", name: "Hmong", native: "Hmoob", ui: false },
  { code: "lo", name: "Lao", native: "ລາວ", ui: false },
  { code: "my", name: "Burmese", native: "မြန်မာ", ui: false },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", ui: false },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", ui: false },
  { code: "ta", name: "Tamil", native: "தமிழ்", ui: false },
  { code: "te", name: "Telugu", native: "తెలుగు", ui: false },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", ui: false },
  { code: "he", name: "Hebrew", native: "עברית", ui: false, rtl: true },
  { code: "nl", name: "Dutch", native: "Nederlands", ui: false },
  { code: "ro", name: "Romanian", native: "Română", ui: false },
];

export const LANGUAGE_BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export function languageName(code: string) {
  return LANGUAGE_BY_CODE.get(code)?.name ?? "English";
}

/** Common shorthand for "many languages" used by seed records. */
export const MAJOR_30 = [
  "English", "Spanish", "Chinese", "Vietnamese", "Korean", "Tagalog", "Arabic", "Portuguese", "French", "Russian",
  "Hindi", "Japanese", "German", "Italian", "Polish", "Ukrainian", "Thai", "Turkish", "Dutch", "Greek",
  "Indonesian", "Malay", "Hebrew", "Romanian", "Swedish", "Danish", "Norwegian", "Finnish", "Czech", "Hungarian",
];

export const MAJOR_100 = [
  ...MAJOR_30,
  "Haitian Creole", "Punjabi", "Urdu", "Bengali", "Amharic", "Somali", "Persian", "Nepali", "Khmer", "Hmong",
  "Lao", "Burmese", "Tamil", "Telugu", "Gujarati", "Swahili", "Marathi", "Kannada", "Malayalam", "Sinhala",
  "Bulgarian", "Croatian", "Serbian", "Slovak", "Slovenian", "Lithuanian", "Latvian", "Estonian", "Albanian", "Macedonian",
  "Armenian", "Georgian", "Azerbaijani", "Kazakh", "Uzbek", "Mongolian", "Tibetan", "Yoruba", "Igbo", "Hausa",
  "Zulu", "Xhosa", "Afrikaans", "Catalan", "Basque", "Galician", "Welsh", "Irish", "Icelandic", "Maltese",
  "Filipino", "Cebuano", "Javanese", "Sundanese", "Pashto", "Kurdish", "Tajik", "Kyrgyz", "Turkmen", "Uyghur",
  "Samoan", "Tongan", "Maori", "Hawaiian", "Fijian", "Chichewa", "Shona", "Sesotho", "Kinyarwanda", "Luganda",
];
