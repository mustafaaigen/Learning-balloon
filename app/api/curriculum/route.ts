import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';
import { BALLOON_COLORS } from '@/lib/languages';

export async function POST(req: NextRequest) {
  try {
    const { targetLangName, targetLangCode, nativeLangName, nativeLangCode } =
      await req.json();

    const ai = getGeminiClient();

    const prompt = `You are designing a comprehensive real-world language & travel learning curriculum.
Target language to learn: ${targetLangName} (code: ${targetLangCode}).
Learner's spoken/native language: ${nativeLangName} (code: ${nativeLangCode}).

Generate:
1. "alphabet": The COMPLETE authentic real-world alphabet or script characters of ${targetLangName} in their exact traditional order (do not skip any letters of the standard alphabet). For each letter provide:
   - "letter": The character itself in ${targetLangName} script.
   - "name": How the letter is named in ${targetLangName}, written clearly for a speaker of ${nativeLangName}.
   - "phonetic": Clear pronunciation guide.
   - "ttsPrompt": The exact character or letter name to feed to a TTS engine in ${targetLangName}.
   - "acceptedMatches": Array of 3-5 lowercase strings (script and romanized) that match when spoken.
2. "words": 30 practical real-world travel, outdoor, and daily-life words in ${targetLangName} that a person needs when going outside or traveling abroad (e.g. Airport, Passport, Visa, Ticket, Luggage, Hotel, Room, Key, Taxi, Bus, Train Station, Street, Restaurant, Water, Bread, Rice, Chicken, Halal Meat, Tea, Coffee, Money, Bank Card, Bill, Market, Clothes, Shoes, Mobile Phone, Charger, Wi-Fi, Hospital, Doctor, Pharmacy, Police, Washroom, Mosque, House, Work). For each word provide:
   - "letter": The starting letter from the ${targetLangName} alphabet.
   - "word": The word in ${targetLangName} script.
   - "pronunciation": Simple phonetic pronunciation guide.
   - "englishMeaning": Meaning in English.
   - "nativeMeaning": Meaning translated into ${nativeLangName}.
   - "icon": A single expressive emoji representing the word.
   - "acceptedMatches": Array of 2-4 lowercase strings (both ${targetLangName} script and romanized).
3. "conversations": 20 complete, natural, full-length real-world travel & abroad conversation sentences (8 to 14 words per sentence) in ${targetLangName} so a traveler going to another country can speak properly (covering introducing yourself as Mustafa, airport & immigration, taking a taxi to a hotel, hotel room reservation, Wi-Fi password, ordering halal food & water at a restaurant, paying the bill by card, shopping & asking for a discount, buying a SIM card, currency exchange, asking directions to train station or mosque, speaking slowly, doctor/pharmacy, and lost passport help). Always use "Mustafa" (مصطفیٰ) when a person's name is mentioned. For each conversation item provide:
   - "situation": Short label of the travel situation (e.g., "Airport & Immigration · ایئرپورٹ").
   - "phrase": The complete natural sentence in ${targetLangName}.
   - "pronunciation": Clear romanized phonetic pronunciation of the full sentence.
   - "englishMeaning": Meaning in English.
   - "urduMeaning": Meaning in Urdu script (اردو ترجمہ).
   - "nativeMeaning": Meaning in ${nativeLangName}.
   - "replyHint": Helpful tip on when to use this sentence abroad.
   - "icon": Expressive emoji for the situation.
   - "acceptedMatches": Array of 2-3 lowercase strings (full sentence in script and romanized).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alphabet: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  letter: { type: Type.STRING },
                  name: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  ttsPrompt: { type: Type.STRING },
                  acceptedMatches: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'letter',
                  'name',
                  'phonetic',
                  'ttsPrompt',
                  'acceptedMatches',
                ],
              },
            },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  letter: { type: Type.STRING },
                  word: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  englishMeaning: { type: Type.STRING },
                  nativeMeaning: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  acceptedMatches: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'letter',
                  'word',
                  'pronunciation',
                  'englishMeaning',
                  'nativeMeaning',
                  'icon',
                  'acceptedMatches',
                ],
              },
            },
            conversations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  situation: { type: Type.STRING },
                  phrase: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  englishMeaning: { type: Type.STRING },
                  urduMeaning: { type: Type.STRING },
                  nativeMeaning: { type: Type.STRING },
                  replyHint: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  acceptedMatches: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'situation',
                  'phrase',
                  'pronunciation',
                  'englishMeaning',
                  'urduMeaning',
                  'nativeMeaning',
                  'icon',
                  'acceptedMatches',
                ],
              },
            },
          },
          required: ['alphabet', 'words', 'conversations'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());

    const formattedWords = (parsed.words || []).map((w: any, idx: number) => ({
      letter: w.letter,
      word: w.word,
      pronunciation: w.pronunciation,
      englishMeaning: w.englishMeaning,
      translations: {
        [nativeLangCode]: w.nativeMeaning || w.englishMeaning,
        en: w.englishMeaning,
      },
      icon: w.icon || '🎈',
      color: BALLOON_COLORS[idx % BALLOON_COLORS.length],
      acceptedMatches: w.acceptedMatches || [w.word.toLowerCase()],
    }));

    const formattedConversations = (parsed.conversations || []).map(
      (c: any, idx: number) => ({
        situation: c.situation || 'Travel Conversation',
        phrase: c.phrase,
        pronunciation: c.pronunciation,
        englishMeaning: c.englishMeaning,
        urduMeaning: c.urduMeaning || c.nativeMeaning || c.englishMeaning,
        translations: {
          [nativeLangCode]: c.nativeMeaning || c.englishMeaning,
          en: c.englishMeaning,
          ur: c.urduMeaning || c.nativeMeaning || c.englishMeaning,
        },
        replyHint: c.replyHint || '',
        icon: c.icon || '💬',
        color: BALLOON_COLORS[idx % BALLOON_COLORS.length],
        acceptedMatches: c.acceptedMatches || [c.phrase.toLowerCase()],
      })
    );

    return NextResponse.json({
      alphabet: parsed.alphabet || [],
      words: formattedWords,
      conversations: formattedConversations,
    });
  } catch {
    return NextResponse.json({
      alphabet: [],
      words: [],
      conversations: [],
      fallback: true,
    });
  }
}
