/**
 * Language codes for OpenAI Realtime API transcription
 * Based on OpenAI supported languages (ISO 639-1 codes)
 *
 * OpenAI uses simple 2-letter codes (e.g., 'es', 'en') not locale codes (e.g., 'es-ES')
 */

export interface Language {
  name: string;
  code: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { name: "Afrikaans", code: "af" },
  { name: "العربية", code: "ar" },
  { name: "Հայերեն", code: "hy" },
  { name: "Azərbaycan dili", code: "az" },
  { name: "Беларуская", code: "be" },
  { name: "Bosanski", code: "bs" },
  { name: "Български", code: "bg" },
  { name: "Català", code: "ca" },
  { name: "中文", code: "zh" },
  { name: "Hrvatski", code: "hr" },
  { name: "Čeština", code: "cs" },
  { name: "Dansk", code: "da" },
  { name: "Nederlands", code: "nl" },
  { name: "English", code: "en" },
  { name: "Eesti", code: "et" },
  { name: "Suomi", code: "fi" },
  { name: "Français", code: "fr" },
  { name: "Galego", code: "gl" },
  { name: "Deutsch", code: "de" },
  { name: "Ελληνικά", code: "el" },
  { name: "עברית", code: "he" },
  { name: "हिन्दी", code: "hi" },
  { name: "Magyar", code: "hu" },
  { name: "Íslenska", code: "is" },
  { name: "Bahasa Indonesia", code: "id" },
  { name: "Italiano", code: "it" },
  { name: "日本語", code: "ja" },
  { name: "ಕನ್ನಡ", code: "kn" },
  { name: "Қазақ тілі", code: "kk" },
  { name: "한국어", code: "ko" },
  { name: "Latviešu", code: "lv" },
  { name: "Lietuvių", code: "lt" },
  { name: "Македонски", code: "mk" },
  { name: "Bahasa Melayu", code: "ms" },
  { name: "मराठी", code: "mr" },
  { name: "Māori", code: "mi" },
  { name: "नेपाली", code: "ne" },
  { name: "Norsk", code: "no" },
  { name: "فارسی", code: "fa" },
  { name: "Polski", code: "pl" },
  { name: "Português", code: "pt" },
  { name: "Română", code: "ro" },
  { name: "Русский", code: "ru" },
  { name: "Српски", code: "sr" },
  { name: "Slovenčina", code: "sk" },
  { name: "Slovenščina", code: "sl" },
  { name: "Español", code: "es" },
  { name: "Kiswahili", code: "sw" },
  { name: "Svenska", code: "sv" },
  { name: "Filipino", code: "tl" },
  { name: "தமிழ்", code: "ta" },
  { name: "ไทย", code: "th" },
  { name: "Türkçe", code: "tr" },
  { name: "Українська", code: "uk" },
  { name: "اردو", code: "ur" },
  { name: "Tiếng Việt", code: "vi" },
  { name: "Cymraeg", code: "cy" },
];

// Default language (Spanish)
export const DEFAULT_LANGUAGE = "es";
