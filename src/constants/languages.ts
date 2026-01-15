/**
 * Language codes for transcription providers
 *
 * OpenAI uses simple 2-letter codes (e.g., 'es', 'en')
 * AWS uses locale codes (e.g., 'es-ES', 'en-US')
 */

export interface Language {
  name: string;
  codeOpenAI?: string;  // OpenAI 2-letter code (e.g., 'es')
  codeAws?: string[];   // AWS locale codes (e.g., ['es-ES', 'es-US'])
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { name: "Afrikaans", codeOpenAI: "af", codeAws: [] },
  { name: "العربية", codeOpenAI: "ar", codeAws: ["ar-AE", "ar-SA"] },
  { name: "Հայերեն", codeOpenAI: "hy", codeAws: [] },
  { name: "Azərbaycan dili", codeOpenAI: "az", codeAws: [] },
  { name: "Беларуская", codeOpenAI: "be", codeAws: [] },
  { name: "Bosanski", codeOpenAI: "bs", codeAws: [] },
  { name: "Български", codeOpenAI: "bg", codeAws: ["bg-BG"] },
  { name: "Català", codeOpenAI: "ca", codeAws: [] },
  { name: "中文", codeOpenAI: "zh", codeAws: ["zh-CN"] },
  { name: "Hrvatski", codeOpenAI: "hr", codeAws: ["hr-HR"] },
  { name: "Čeština", codeOpenAI: "cs", codeAws: ["cs-CZ"] },
  { name: "Dansk", codeOpenAI: "da", codeAws: ["da-DK"] },
  { name: "Nederlands", codeOpenAI: "nl", codeAws: ["nl-NL"] },
  { name: "English", codeOpenAI: "en", codeAws: ["en-US", "en-GB", "en-AU", "en-CA", "en-IN"] },
  { name: "Eesti", codeOpenAI: "et", codeAws: ["et-EE"] },
  { name: "Suomi", codeOpenAI: "fi", codeAws: ["fi-FI"] },
  { name: "Français", codeOpenAI: "fr", codeAws: ["fr-FR", "fr-CA"] },
  { name: "Deutsch", codeOpenAI: "de", codeAws: ["de-DE"] },
  { name: "Ελληνικά", codeOpenAI: "el", codeAws: ["el-GR"] },
  { name: "עברית", codeOpenAI: "he", codeAws: ["he-IL"] },
  { name: "हिन्दी", codeOpenAI: "hi", codeAws: ["hi-IN"] },
  { name: "Magyar", codeOpenAI: "hu", codeAws: ["hu-HU"] },
  { name: "Íslenska", codeOpenAI: "is", codeAws: ["is-IS"] },
  { name: "Bahasa Indonesia", codeOpenAI: "id", codeAws: ["id-ID"] },
  { name: "Italiano", codeOpenAI: "it", codeAws: ["it-IT"] },
  { name: "日本語", codeOpenAI: "ja", codeAws: ["ja-JP"] },
  { name: "한국어", codeOpenAI: "ko", codeAws: ["ko-KR"] },
  { name: "Latviešu", codeOpenAI: "lv", codeAws: ["lv-LV"] },
  { name: "Lietuvių", codeOpenAI: "lt", codeAws: ["lt-LT"] },
  { name: "Bahasa Melayu", codeOpenAI: "ms", codeAws: ["ms-MY"] },
  { name: "Norsk", codeOpenAI: "no", codeAws: ["no-NO"] },
  { name: "فارسی", codeOpenAI: "fa", codeAws: [] },
  { name: "Polski", codeOpenAI: "pl", codeAws: ["pl-PL"] },
  { name: "Português", codeOpenAI: "pt", codeAws: ["pt-PT", "pt-BR"] },
  { name: "Română", codeOpenAI: "ro", codeAws: ["ro-RO"] },
  { name: "Русский", codeOpenAI: "ru", codeAws: ["ru-RU"] },
  { name: "Slovenčina", codeOpenAI: "sk", codeAws: ["sk-SK"] },
  { name: "Slovenščina", codeOpenAI: "sl", codeAws: ["sl-SI"] },
  { name: "Español", codeOpenAI: "es", codeAws: ["es-ES", "es-US", "es-MX"] },
  { name: "Kiswahili", codeOpenAI: "sw", codeAws: ["sw-KE"] },
  { name: "Svenska", codeOpenAI: "sv", codeAws: ["sv-SE"] },
  { name: "Filipino", codeOpenAI: "tl", codeAws: ["tl-PH"] },
  { name: "தமிழ்", codeOpenAI: "ta", codeAws: ["ta-IN"] },
  { name: "ไทย", codeOpenAI: "th", codeAws: ["th-TH"] },
  { name: "Türkçe", codeOpenAI: "tr", codeAws: ["tr-TR"] },
  { name: "Українська", codeOpenAI: "uk", codeAws: ["uk-UA"] },
  { name: "اردو", codeOpenAI: "ur", codeAws: ["ur-IN"] },
  { name: "Tiếng Việt", codeOpenAI: "vi", codeAws: ["vi-VN"] },
  { name: "Cymraeg", codeOpenAI: "cy", codeAws: [] },
];

// Default language (Spanish)
export const DEFAULT_LANGUAGE = "es";

/**
 * Get the appropriate code for a language based on the provider
 */
export const getLanguageCode = (language: Language, provider: 'aws' | 'openai'): string | undefined => {
  if (provider === 'openai') {
    return language.codeOpenAI;
  }
  // For AWS, return the first locale code
  return language.codeAws && language.codeAws.length > 0 ? language.codeAws[0] : undefined;
};

/**
 * Filter languages that have support for the given provider
 */
export const getAvailableLanguages = (provider: 'aws' | 'openai'): Language[] => {
  return SUPPORTED_LANGUAGES.filter(lang => {
    if (provider === 'openai') {
      return !!lang.codeOpenAI;
    }
    return lang.codeAws && lang.codeAws.length > 0;
  });
};