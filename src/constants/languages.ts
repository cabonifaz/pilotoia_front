/**
 * Language codes for transcription providers
 *
 * OpenAI uses simple 2-letter codes (e.g., 'es', 'en')
 * AWS uses locale codes (e.g., 'es-ES', 'en-US')
 */

export interface Language {
  name: string;
  nameEnglish: string;
  codeOpenAI?: string;  // OpenAI 2-letter code (e.g., 'es')
  codeAws?: string[];   // AWS locale codes (e.g., ['es-ES', 'es-US'])
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { name: "Afrikaans", nameEnglish: "Afrikaans", codeOpenAI: "af", codeAws: [] },
  { name: "العربية", nameEnglish: "Arabic", codeOpenAI: "ar", codeAws: ["ar-AE", "ar-SA"] },
  { name: "Հայերեն", nameEnglish: "Armenian", codeOpenAI: "hy", codeAws: [] },
  { name: "Azərbaycan dili", nameEnglish: "Azerbaijani", codeOpenAI: "az", codeAws: [] },
  { name: "Беларуская", nameEnglish: "Belarusian", codeOpenAI: "be", codeAws: [] },
  { name: "Bosanski", nameEnglish: "Bosnian", codeOpenAI: "bs", codeAws: [] },
  { name: "Български", nameEnglish: "Bulgarian", codeOpenAI: "bg", codeAws: ["bg-BG"] },
  { name: "Català", nameEnglish: "Catalan", codeOpenAI: "ca", codeAws: [] },
  { name: "中文", nameEnglish: "Chinese", codeOpenAI: "zh", codeAws: ["zh-CN"] },
  { name: "Hrvatski", nameEnglish: "Croatian", codeOpenAI: "hr", codeAws: ["hr-HR"] },
  { name: "Čeština", nameEnglish: "Czech", codeOpenAI: "cs", codeAws: ["cs-CZ"] },
  { name: "Dansk", nameEnglish: "Danish", codeOpenAI: "da", codeAws: ["da-DK"] },
  { name: "Nederlands", nameEnglish: "Dutch", codeOpenAI: "nl", codeAws: ["nl-NL"] },
  { name: "English", nameEnglish: "English", codeOpenAI: "en", codeAws: ["en-US", "en-GB", "en-AU", "en-CA", "en-IN"] },
  { name: "Eesti", nameEnglish: "Estonian", codeOpenAI: "et", codeAws: ["et-EE"] },
  { name: "Suomi", nameEnglish: "Finnish", codeOpenAI: "fi", codeAws: ["fi-FI"] },
  { name: "Français", nameEnglish: "French", codeOpenAI: "fr", codeAws: ["fr-FR", "fr-CA"] },
  { name: "Deutsch", nameEnglish: "German", codeOpenAI: "de", codeAws: ["de-DE"] },
  { name: "Ελληνικά", nameEnglish: "Greek", codeOpenAI: "el", codeAws: ["el-GR"] },
  { name: "עברית", nameEnglish: "Hebrew", codeOpenAI: "he", codeAws: ["he-IL"] },
  { name: "हिन्दी", nameEnglish: "Hindi", codeOpenAI: "hi", codeAws: ["hi-IN"] },
  { name: "Magyar", nameEnglish: "Hungarian", codeOpenAI: "hu", codeAws: ["hu-HU"] },
  { name: "Íslenska", nameEnglish: "Icelandic", codeOpenAI: "is", codeAws: ["is-IS"] },
  { name: "Bahasa Indonesia", nameEnglish: "Indonesian", codeOpenAI: "id", codeAws: ["id-ID"] },
  { name: "Italiano", nameEnglish: "Italian", codeOpenAI: "it", codeAws: ["it-IT"] },
  { name: "日本語", nameEnglish: "Japanese", codeOpenAI: "ja", codeAws: ["ja-JP"] },
  { name: "한국어", nameEnglish: "Korean", codeOpenAI: "ko", codeAws: ["ko-KR"] },
  { name: "Latviešu", nameEnglish: "Latvian", codeOpenAI: "lv", codeAws: ["lv-LV"] },
  { name: "Lietuvių", nameEnglish: "Lithuanian", codeOpenAI: "lt", codeAws: ["lt-LT"] },
  { name: "Bahasa Melayu", nameEnglish: "Malay", codeOpenAI: "ms", codeAws: ["ms-MY"] },
  { name: "Norsk", nameEnglish: "Norwegian", codeOpenAI: "no", codeAws: ["no-NO"] },
  { name: "فارسی", nameEnglish: "Persian", codeOpenAI: "fa", codeAws: [] },
  { name: "Polski", nameEnglish: "Polish", codeOpenAI: "pl", codeAws: ["pl-PL"] },
  { name: "Português", nameEnglish: "Portuguese", codeOpenAI: "pt", codeAws: ["pt-PT", "pt-BR"] },
  { name: "Română", nameEnglish: "Romanian", codeOpenAI: "ro", codeAws: ["ro-RO"] },
  { name: "Русский", nameEnglish: "Russian", codeOpenAI: "ru", codeAws: ["ru-RU"] },
  { name: "Slovenčina", nameEnglish: "Slovak", codeOpenAI: "sk", codeAws: ["sk-SK"] },
  { name: "Slovenščina", nameEnglish: "Slovenian", codeOpenAI: "sl", codeAws: ["sl-SI"] },
  { name: "Español", nameEnglish: "Spanish", codeOpenAI: "es", codeAws: ["es-ES", "es-US"] },
  { name: "Kiswahili", nameEnglish: "Swahili", codeOpenAI: "sw", codeAws: ["sw-KE"] },
  { name: "Svenska", nameEnglish: "Swedish", codeOpenAI: "sv", codeAws: ["sv-SE"] },
  { name: "Filipino", nameEnglish: "Filipino", codeOpenAI: "tl", codeAws: ["tl-PH"] },
  { name: "தமிழ்", nameEnglish: "Tamil", codeOpenAI: "ta", codeAws: ["ta-IN"] },
  { name: "ไทย", nameEnglish: "Thai", codeOpenAI: "th", codeAws: ["th-TH"] },
  { name: "Türkçe", nameEnglish: "Turkish", codeOpenAI: "tr", codeAws: ["tr-TR"] },
  { name: "Українська", nameEnglish: "Ukrainian", codeOpenAI: "uk", codeAws: ["uk-UA"] },
  { name: "اردو", nameEnglish: "Urdu", codeOpenAI: "ur", codeAws: ["ur-IN"] },
  { name: "Tiếng Việt", nameEnglish: "Vietnamese", codeOpenAI: "vi", codeAws: ["vi-VN"] },
  { name: "Cymraeg", nameEnglish: "Welsh", codeOpenAI: "cy", codeAws: [] },
];

// Default language (Spanish)
export const DEFAULT_LANGUAGE = "es";

/**
 * Get the default language code based on the provider
 */
export const getDefaultLanguage = (provider: 'aws' | 'openai'): string => {
  return provider === 'aws' ? 'es-ES' : 'es';
};

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