import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

/**
 * Exact Urdu Huroof-e-Tahajji spoken names in Urdu script with clear vowel carrier
 * so Neural TTS pronounces single Urdu letters with 100% authentic Pakistani/Indian
 * Urdu teacher pronunciation (and NEVER aspirates 'چ' Che into 'چھے' Chhe!).
 */
const URDU_LETTER_SPOKEN_MAP: Record<string, string> = {
  'ا': 'اَلِف',
  'الف': 'اَلِف',
  'آ': 'اَلِف مَد آ',
  'ب': 'بے',
  'پ': 'پے',
  'ت': 'تے',
  'ٹ': 'ٹے',
  'ث': 'ثے',
  'ج': 'جِیم',
  'چ': 'چَے',
  'چے': 'چَے',
  'ح': 'بڑی حے',
  'خ': 'خے',
  'د': 'دال',
  'ڈ': 'ڈال',
  'ذ': 'ذال',
  'ر': 'رے',
  'ڑ': 'ڑے',
  'ز': 'زے',
  'ژ': 'ژے',
  'س': 'سِین',
  'ش': 'شِین',
  'ص': 'صواد',
  'ض': 'ضواد',
  'ط': 'طوئے',
  'ظ': 'ظوئے',
  'ع': 'عَین',
  'غ': 'غَین',
  'ف': 'فے',
  'ق': 'قاف',
  'ک': 'کاف',
  'گ': 'گاف',
  'ل': 'لام',
  'م': 'مِیم',
  'ن': 'نُون',
  'ں': 'نُون غُنَّہ',
  'و': 'واؤ',
  'ہ': 'چھوٹی ہے',
  'ھ': 'دو چشمی ہے',
  'ء': 'ہَمزَہ',
  'ی': 'چھوٹی یے',
  'ے': 'بڑی یے',
};

/**
 * Verified single-letter Devanagari phonetic equivalents for Urdu Huroof-e-Tahajji.
 * CRITICAL: 'چ' / 'چے' is mapped to 'चेय' (unaspirated 'च' + 'े' + soft 'य' glide)
 * so the TTS engine NEVER mistakes standalone 'चे' for the Hindi/Urdu number 6 ('छह' / 'چھ' / 'Chhe')!
 */
const URDU_SINGLE_LETTER_HINDI_PHONETIC: Record<string, string> = {
  'ا': 'अलिफ़',
  'الف': 'अलिफ़',
  'اَلِف': 'अलिफ़',
  'آ': 'अलिफ़ मद आ',
  'اَلِف مَد آ': 'अलिफ़ मद आ',
  'ب': 'बेय',
  'بے': 'बेय',
  'پ': 'पेय',
  'پے': 'पेय',
  'ت': 'तेय',
  'تے': 'तेय',
  'ٹ': 'टेय',
  'ٹے': 'टेय',
  'ث': 'सेय',
  'ثے': 'सेय',
  'ج': 'जीम',
  'جیم': 'जीम',
  'جِیم': 'जीम',
  'چ': 'चेय',
  'چے': 'चेय',
  'چَے': 'चेय',
  'ح': 'बड़ी हेय',
  'حے': 'बड़ी हेय',
  'بڑی حے': 'बड़ी हेय',
  'خ': 'ख़ेय',
  'خے': 'ख़ेय',
  'د': 'दाल',
  'دال': 'दाल',
  'ڈ': 'डाल',
  'ڈال': 'डाल',
  'ذ': 'ज़ाल',
  'ذال': 'ज़ाल',
  'ر': 'रेय',
  'رے': 'रेय',
  'ڑ': 'ड़ेय',
  'ڑے': 'ड़ेय',
  'ز': 'ज़ेय',
  'زے': 'ज़ेय',
  'ژ': 'झेय',
  'ژے': 'झेय',
  'س': 'सीन',
  'سین': 'सीन',
  'سِین': 'सीन',
  'ش': 'शीन',
  'شین': 'शीन',
  'شِین': 'शीन',
  'ص': 'स्वाद',
  'صواد': 'स्वाद',
  'صاد': 'स्वाद',
  'ض': 'ज़्वाद',
  'ضواد': 'ज़्वाद',
  'ضاد': 'ज़्वाद',
  'ط': 'तोए',
  'طوئے': 'तोए',
  'ظ': 'ज़ोए',
  'ظوئے': 'ज़ोए',
  'ع': 'ऐन',
  'عین': 'ऐन',
  'عَین': 'ऐन',
  'غ': 'ग़ैन',
  'غین': 'ग़ैन',
  'غَین': 'ग़ैन',
  'ف': 'फ़ेय',
  'فے': 'फ़ेय',
  'ق': 'क़ाफ़',
  'قاف': 'क़ाफ़',
  'ک': 'काफ़',
  'کاف': 'काफ़',
  'گ': 'गाफ़',
  'گاف': 'गाफ़',
  'ل': 'लाम',
  'لام': 'लाम',
  'م': 'मीम',
  'میم': 'मीम',
  'مِیم': 'मीम',
  'ن': 'नून',
  'نون': 'नून',
  'نُون': 'नून',
  'ں': 'नून ग़ुन्ना',
  'نُون غُنَّہ': 'नून ग़ुन्ना',
  'و': 'वाओ',
  'واؤ': 'वाओ',
  'ہ': 'छोटी हेय',
  'ہے': 'छोटी हेय',
  'چھوٹی ہے': 'छोटी हेय',
  'ھ': 'दो चश्मी हेय',
  'دو چَشمی ہے': 'दो चश्मी हेय',
  'دو چشمی ہے': 'दो चश्मी हेय',
  'ء': 'हमज़ा',
  'ہمزہ': 'हमज़ा',
  'ہَمزَہ': 'हमज़ा',
  'ی': 'छोटी येय',
  'چھوٹی یے': 'छोटी येय',
  'ے': 'बड़ी येय',
  'بڑی یے': 'बड़ी येय',
};

/**
 * Disambiguate single Hindi letters so 'च' is pronounced cleanly as unaspirated "च" (Cha)
 * and never confused with 'छ' (Chha).
 */
const HINDI_LETTER_SPOKEN_MAP: Record<string, string> = {
  'च': 'च, चम्मच का च',
  'छ': 'छ, छाता का छ',
  'क': 'क',
  'ख': 'ख',
  'ग': 'ग',
  'घ': 'घ',
  'ज': 'ज',
  'झ': 'झ',
  'ट': 'ट',
  'ठ': 'ठ',
  'ड': 'ड',
  'ढ': 'ढ',
  'त': 'त',
  'थ': 'थ',
  'द': 'द',
  'ध': 'ध',
  'न': 'न',
  'प': 'प',
  'फ': 'फ',
  'ब': 'ब',
  'भ': 'भ',
  'म': 'म',
  'य': 'य',
  'र': 'र',
  'ल': 'ल',
  'व': 'व',
  'श': 'श',
  'ष': 'ष',
  'स': 'स',
  'ह': 'ह',
};

const ARABIC_LETTER_SPOKEN_MAP: Record<string, string> = {
  'ا': 'أَلِف',
  'أ': 'أَلِف',
  'ب': 'بَاء',
  'ت': 'تَاء',
  'ث': 'ثَاء',
  'ج': 'جِيم',
  'ح': 'حَاء',
  'خ': 'خَاء',
  'د': 'دَال',
  'ذ': 'ذَال',
  'ر': 'رَاء',
  'ز': 'زَاي',
  'س': 'سِين',
  'ش': 'شِين',
  'ص': 'صَاد',
  'ض': 'ضَاد',
  'ط': 'طَاء',
  'ظ': 'ظَاء',
  'ع': 'عَيْن',
  'غ': 'غَيْن',
  'ف': 'فَاء',
  'ق': 'قَاف',
  'ك': 'كَاف',
  'ل': 'لَام',
  'م': 'مِيم',
  'ن': 'نُون',
  'ه': 'هَاء',
  'و': 'وَاو',
  'ي': 'يَاء',
};

/**
 * Wraps raw 16-bit signed little-endian PCM bytes (e.g. audio/L16;rate=24000 from Gemini 2.5 Flash TTS)
 * in a standard 44-byte RIFF/WAVE header so browser AudioContext.decodeAudioData() decodes it cleanly.
 */
function ensureWavHeaderBase64(
  rawBase64: string,
  mimeType = 'audio/L16;rate=24000'
): string {
  const pcmBuf = Buffer.from(rawBase64, 'base64');
  // If already a RIFF WAV file, return as-is
  if (
    pcmBuf.length > 44 &&
    pcmBuf.toString('ascii', 0, 4) === 'RIFF' &&
    pcmBuf.toString('ascii', 8, 12) === 'WAVE'
  ) {
    return rawBase64;
  }

  const rateMatch = mimeType.match(/rate=(\d+)/i);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) || 24000 : 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuf.length;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuf]).toString('base64');
}

async function synthesizeWithGeminiTTS(
  spokenText: string,
  rawLang: string,
  languageName?: string
): Promise<string | null> {
  try {
    const ai = getGeminiClient();
    const isUrdu = rawLang === 'ur';
    const promptText = isUrdu
      ? `Pronounce clearly in authentic native Pakistani Urdu with natural pronunciation and zero extra words: ${spokenText}`
      : `Pronounce clearly in authentic native ${languageName || rawLang} with natural native pronunciation and zero extra words: ${spokenText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData?.data) {
      return ensureWavHeaderBase64(
        inlineData.data,
        inlineData.mimeType || 'audio/L16;rate=24000'
      );
    }
  } catch {
    // Ignore and allow fallback
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { text, langCode, languageName } = await req.json();
    if (!text) {
      return NextResponse.json({ audioBase64: null, fallback: true });
    }

    const cleanText = String(text)
      .replace(/\s*\([^)]*\)/g, '')
      .trim();

    if (!cleanText) {
      return NextResponse.json({ audioBase64: null, fallback: true });
    }

    const rawLang = (langCode || 'en').split('-')[0].toLowerCase();
    const isUrdu = rawLang === 'ur';
    const isHindi = rawLang === 'hi';
    const isArabic = rawLang === 'ar';

    // Check if this is an isolated letter in Urdu, Arabic, or Hindi
    const urduLetterPhonetic = isUrdu
      ? URDU_SINGLE_LETTER_HINDI_PHONETIC[cleanText]
      : undefined;

    const spokenTextForGemini = isUrdu
      ? urduLetterPhonetic || URDU_LETTER_SPOKEN_MAP[cleanText] || cleanText
      : isArabic && ARABIC_LETTER_SPOKEN_MAP[cleanText]
      ? ARABIC_LETTER_SPOKEN_MAP[cleanText]
      : isHindi && HINDI_LETTER_SPOKEN_MAP[cleanText]
      ? cleanText
      : cleanText;

    // Languages where Google Translate TTS does not have a direct tl code (fa, ps, sd, ku) -> Try Gemini Neural TTS first!
    const needsGeminiPrimary = ['fa', 'ps', 'sd', 'ku'].includes(rawLang);
    if (needsGeminiPrimary) {
      const geminiWav = await synthesizeWithGeminiTTS(
        spokenTextForGemini,
        rawLang,
        languageName
      );
      if (geminiWav) {
        return NextResponse.json({
          audioBase64: geminiWav,
          mimeType: 'audio/wav',
          modelUsed: 'gemini-2.5-flash-preview-tts',
        });
      }
    }

    // 1. Fast Neural TTS with exact native South Asian & Middle Eastern language mapping
    try {
      const synthLangMap: Record<string, string> = {
        zh: 'zh-CN',
        fil: 'tl',
        tl: 'tl',
        nb: 'no',
        he: 'he',
        iw: 'he',
        // Perso-Arabic script fallback if Gemini TTS is offline for fa/ps/sd/ku
        fa: 'ur',
        ps: 'ur',
        sd: 'ur',
        ku: 'ar',
      };

      const synthLang =
        isUrdu && urduLetterPhonetic
          ? 'hi'
          : isUrdu
          ? 'ur'
          : synthLangMap[rawLang] || rawLang;

      const synthText =
        isUrdu && urduLetterPhonetic
          ? urduLetterPhonetic
          : isUrdu && URDU_LETTER_SPOKEN_MAP[cleanText]
          ? URDU_LETTER_SPOKEN_MAP[cleanText]
          : isArabic && ARABIC_LETTER_SPOKEN_MAP[cleanText]
          ? ARABIC_LETTER_SPOKEN_MAP[cleanText]
          : cleanText;

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
        synthLang
      )}&q=${encodeURIComponent(synthText)}`;

      const googleRes = await fetch(ttsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      });

      if (googleRes.ok) {
        const arrayBuffer = await googleRes.arrayBuffer();
        if (arrayBuffer.byteLength > 200) {
          const base64Audio = Buffer.from(arrayBuffer).toString('base64');
          return NextResponse.json({
            audioBase64: base64Audio,
            mimeType: 'audio/mpeg',
          });
        }
      }
    } catch {
      // Fall through to Gemini TTS backup
    }

    // 2. Backup: Gemini 2.5 Flash TTS with 44-byte RIFF WAV header
    if (!needsGeminiPrimary) {
      const geminiWav = await synthesizeWithGeminiTTS(
        spokenTextForGemini,
        rawLang,
        languageName
      );
      if (geminiWav) {
        return NextResponse.json({
          audioBase64: geminiWav,
          mimeType: 'audio/wav',
          modelUsed: 'gemini-2.5-flash-preview-tts',
        });
      }
    }

    return NextResponse.json({ audioBase64: null, fallback: true });
  } catch {
    return NextResponse.json({ audioBase64: null, fallback: true });
  }
}
