import type { VlmMode } from '../contexts/CommandContext';

export type OcrToolPrefill = Record<Exclude<VlmMode, 'vlm_qa_over_text'>, string>;

export const OCR_TOOL_PREFILLS: Record<string, OcrToolPrefill> = {
  Afrikaans: {
    vlm_extract_fields: 'Onttrek die velde uit die lêer',
    vlm_summarize_doc: 'Som die inligting van die lêer op',
    vlm_ocr_clean: 'Onttrek die inligting uit hierdie lêer',
  },
  Arabic: {
    vlm_extract_fields: 'استخرج الحقول من الملف',
    vlm_summarize_doc: 'لخص معلومات الملف',
    vlm_ocr_clean: 'استخرج المعلومات من هذا الملف',
  },
  Armenian: {
    vlm_extract_fields: 'Հանեք դաշտերը ֆայլից',
    vlm_summarize_doc: 'Ամփոփեք ֆայլի տեղեկատվությունը',
    vlm_ocr_clean: 'Հանեք տեղեկատվությունը այս ֆայլից',
  },
  Azerbaijani: {
    vlm_extract_fields: 'Fayldan sahələri çıxar',
    vlm_summarize_doc: 'Fayldakı məlumatı xülasə et',
    vlm_ocr_clean: 'Bu fayldan məlumatı çıxar',
  },
  Belarusian: {
    vlm_extract_fields: 'Здабыць палі з файла',
    vlm_summarize_doc: 'Абагульніць інфармацыю з файла',
    vlm_ocr_clean: 'Здабыць інфармацыю з гэтага файла',
  },
  Bosnian: {
    vlm_extract_fields: 'Izdvoji polja iz datoteke',
    vlm_summarize_doc: 'Sažmi informacije iz datoteke',
    vlm_ocr_clean: 'Izdvoji informacije iz ove datoteke',
  },
  Bulgarian: {
    vlm_extract_fields: 'Извлечи полетата от файла',
    vlm_summarize_doc: 'Обобщи информацията от файла',
    vlm_ocr_clean: 'Извлечи информацията от този файл',
  },
  Catalan: {
    vlm_extract_fields: "Extreu els camps del fitxer",
    vlm_summarize_doc: "Resumeix la informació del fitxer",
    vlm_ocr_clean: "Extreu la informació d'aquest fitxer",
  },
  Chinese: {
    vlm_extract_fields: '提取文件中的字段',
    vlm_summarize_doc: '总结文件信息',
    vlm_ocr_clean: '提取此文件中的信息',
  },
  Croatian: {
    vlm_extract_fields: 'Izvuci polja iz datoteke',
    vlm_summarize_doc: 'Sažmi informacije iz datoteke',
    vlm_ocr_clean: 'Izvuci informacije iz ove datoteke',
  },
  Czech: {
    vlm_extract_fields: 'Extrahuj pole ze souboru',
    vlm_summarize_doc: 'Shrň informace ze souboru',
    vlm_ocr_clean: 'Extrahuj informace z tohoto souboru',
  },
  Danish: {
    vlm_extract_fields: 'Udtræk felterne fra filen',
    vlm_summarize_doc: 'Opsummer information fra filen',
    vlm_ocr_clean: 'Udtræk information fra denne fil',
  },
  Dutch: {
    vlm_extract_fields: 'Extraheer de velden uit het bestand',
    vlm_summarize_doc: 'Vat de informatie uit het bestand samen',
    vlm_ocr_clean: 'Extraheer de informatie uit dit bestand',
  },
  English: {
    vlm_extract_fields: 'Extract the fields from the file',
    vlm_summarize_doc: 'Summarize the information from the file',
    vlm_ocr_clean: 'Extract the information from this file',
  },
  Estonian: {
    vlm_extract_fields: 'Eralda väljad failist',
    vlm_summarize_doc: 'Võta faili teave kokku',
    vlm_ocr_clean: 'Eralda teave sellest failist',
  },
  Finnish: {
    vlm_extract_fields: 'Pura kentät tiedostosta',
    vlm_summarize_doc: 'Tiivistä tiedoston tiedot',
    vlm_ocr_clean: 'Pura tiedot tästä tiedostosta',
  },
  French: {
    vlm_extract_fields: 'Extrais les champs du fichier',
    vlm_summarize_doc: 'Résume les informations du fichier',
    vlm_ocr_clean: 'Extrais les informations de ce fichier',
  },
  German: {
    vlm_extract_fields: 'Extrahiere die Felder aus der Datei',
    vlm_summarize_doc: 'Fasse die Informationen der Datei zusammen',
    vlm_ocr_clean: 'Extrahiere die Informationen aus dieser Datei',
  },
  Greek: {
    vlm_extract_fields: 'Εξαγωγή πεδίων από το αρχείο',
    vlm_summarize_doc: 'Σύνοψη πληροφοριών του αρχείου',
    vlm_ocr_clean: 'Εξαγωγή πληροφοριών από αυτό το αρχείο',
  },
  Hebrew: {
    vlm_extract_fields: 'חלץ את השדות מהקובץ',
    vlm_summarize_doc: 'סכם את המידע מהקובץ',
    vlm_ocr_clean: 'חלץ את המידע מקובץ זה',
  },
  Hindi: {
    vlm_extract_fields: 'फ़ाइल से फ़ील्ड निकालें',
    vlm_summarize_doc: 'फ़ाइल की जानकारी सारांशित करें',
    vlm_ocr_clean: 'इस फ़ाइल से जानकारी निकालें',
  },
  Hungarian: {
    vlm_extract_fields: 'Vonja ki a mezőket a fájlból',
    vlm_summarize_doc: 'Foglalja össze a fájl információit',
    vlm_ocr_clean: 'Vonja ki az információkat ebből a fájlból',
  },
  Icelandic: {
    vlm_extract_fields: 'Dragðu út reiti úr skránni',
    vlm_summarize_doc: 'Dragðu saman upplýsingar úr skránni',
    vlm_ocr_clean: 'Dragðu út upplýsingar úr þessari skrá',
  },
  Indonesian: {
    vlm_extract_fields: 'Ekstrak kolom dari file',
    vlm_summarize_doc: 'Rangkum informasi dari file',
    vlm_ocr_clean: 'Ekstrak informasi dari file ini',
  },
  Italian: {
    vlm_extract_fields: 'Estrai i campi dal file',
    vlm_summarize_doc: 'Riassumi le informazioni del file',
    vlm_ocr_clean: 'Estrai le informazioni da questo file',
  },
  Japanese: {
    vlm_extract_fields: 'ファイルからフィールドを抽出してください',
    vlm_summarize_doc: 'ファイルの情報を要約してください',
    vlm_ocr_clean: 'このファイルから情報を抽出してください',
  },
  Korean: {
    vlm_extract_fields: '파일에서 필드를 추출하세요',
    vlm_summarize_doc: '파일의 정보를 요약하세요',
    vlm_ocr_clean: '이 파일에서 정보를 추출하세요',
  },
  Latvian: {
    vlm_extract_fields: 'Izvelciet laukus no faila',
    vlm_summarize_doc: 'Apkopojiet faila informāciju',
    vlm_ocr_clean: 'Izvelciet informāciju no šī faila',
  },
  Lithuanian: {
    vlm_extract_fields: 'Ištraukite laukus iš failo',
    vlm_summarize_doc: 'Apibendrinkite failo informaciją',
    vlm_ocr_clean: 'Ištraukite informaciją iš šio failo',
  },
  Malay: {
    vlm_extract_fields: 'Ekstrak medan dari fail',
    vlm_summarize_doc: 'Ringkaskan maklumat dari fail',
    vlm_ocr_clean: 'Ekstrak maklumat dari fail ini',
  },
  Norwegian: {
    vlm_extract_fields: 'Trekk ut feltene fra filen',
    vlm_summarize_doc: 'Oppsummer informasjonen fra filen',
    vlm_ocr_clean: 'Trekk ut informasjonen fra denne filen',
  },
  Persian: {
    vlm_extract_fields: 'فیلدهای فایل را استخراج کن',
    vlm_summarize_doc: 'اطلاعات فایل را خلاصه کن',
    vlm_ocr_clean: 'اطلاعات این فایل را استخراج کن',
  },
  Polish: {
    vlm_extract_fields: 'Wyodrębnij pola z pliku',
    vlm_summarize_doc: 'Podsumuj informacje z pliku',
    vlm_ocr_clean: 'Wyodrębnij informacje z tego pliku',
  },
  Portuguese: {
    vlm_extract_fields: 'Extraia os campos do arquivo',
    vlm_summarize_doc: 'Resuma as informações do arquivo',
    vlm_ocr_clean: 'Extraia as informações deste arquivo',
  },
  Romanian: {
    vlm_extract_fields: 'Extrage câmpurile din fișier',
    vlm_summarize_doc: 'Rezumă informațiile din fișier',
    vlm_ocr_clean: 'Extrage informațiile din acest fișier',
  },
  Russian: {
    vlm_extract_fields: 'Извлеки поля из файла',
    vlm_summarize_doc: 'Суммируй информацию из файла',
    vlm_ocr_clean: 'Извлеки информацию из этого файла',
  },
  Slovak: {
    vlm_extract_fields: 'Extrahuj polia zo súboru',
    vlm_summarize_doc: 'Zhrň informácie zo súboru',
    vlm_ocr_clean: 'Extrahuj informácie z tohto súboru',
  },
  Slovenian: {
    vlm_extract_fields: 'Izvleci polja iz datoteke',
    vlm_summarize_doc: 'Povzemi informacije iz datoteke',
    vlm_ocr_clean: 'Izvleci informacije iz te datoteke',
  },
  Spanish: {
    vlm_extract_fields: 'Extrae los campos del archivo',
    vlm_summarize_doc: 'Resume la información del archivo',
    vlm_ocr_clean: 'Extrae la información de este archivo',
  },
  Swahili: {
    vlm_extract_fields: 'Toa sehemu kutoka kwa faili',
    vlm_summarize_doc: 'Fupisha taarifa kutoka kwa faili',
    vlm_ocr_clean: 'Toa taarifa kutoka kwa faili hii',
  },
  Swedish: {
    vlm_extract_fields: 'Extrahera fälten från filen',
    vlm_summarize_doc: 'Sammanfatta informationen från filen',
    vlm_ocr_clean: 'Extrahera informationen från den här filen',
  },
  Filipino: {
    vlm_extract_fields: 'Kunin ang mga field mula sa file',
    vlm_summarize_doc: 'Buod ang impormasyon mula sa file',
    vlm_ocr_clean: 'Kunin ang impormasyon mula sa file na ito',
  },
  Tamil: {
    vlm_extract_fields: 'கோப்பிலிருந்து புலங்களை பிரித்தெடுக்கவும்',
    vlm_summarize_doc: 'கோப்பிலிருந்து தகவல்களை சுருக்கவும்',
    vlm_ocr_clean: 'இந்த கோப்பிலிருந்து தகவல்களை பிரித்தெடுக்கவும்',
  },
  Thai: {
    vlm_extract_fields: 'แยกฟิลด์จากไฟล์',
    vlm_summarize_doc: 'สรุปข้อมูลจากไฟล์',
    vlm_ocr_clean: 'แยกข้อมูลจากไฟล์นี้',
  },
  Turkish: {
    vlm_extract_fields: 'Dosyadaki alanları çıkar',
    vlm_summarize_doc: 'Dosyadaki bilgileri özetle',
    vlm_ocr_clean: 'Bu dosyadaki bilgileri çıkar',
  },
  Ukrainian: {
    vlm_extract_fields: 'Витягни поля з файлу',
    vlm_summarize_doc: 'Узагальни інформацію з файлу',
    vlm_ocr_clean: 'Витягни інформацію з цього файлу',
  },
  Urdu: {
    vlm_extract_fields: 'فائل سے فیلڈز نکالیں',
    vlm_summarize_doc: 'فائل کی معلومات کا خلاصہ کریں',
    vlm_ocr_clean: 'اس فائل سے معلومات نکالیں',
  },
  Vietnamese: {
    vlm_extract_fields: 'Trích xuất các trường từ tệp',
    vlm_summarize_doc: 'Tóm tắt thông tin từ tệp',
    vlm_ocr_clean: 'Trích xuất thông tin từ tệp này',
  },
  Welsh: {
    vlm_extract_fields: "Echdynnwch y meysydd o'r ffeil",
    vlm_summarize_doc: "Crynhowch wybodaeth o'r ffeil",
    vlm_ocr_clean: "Echdynnwch wybodaeth o'r ffeil hon",
  },
};

/**
 * Get the prefill text for an OCR mode in the given language.
 * Falls back to Spanish if the language is not found.
 */
export function getOcrPrefill(nameEnglish: string, mode: keyof OcrToolPrefill): string {
  return (OCR_TOOL_PREFILLS[nameEnglish] ?? OCR_TOOL_PREFILLS['Spanish'])[mode];
}
