import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';

const VERIFY_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

export async function POST(req: NextRequest) {
  try {
    const {
      audioBase64,
      mimeType,
      targetText,
      targetPhonetic,
      languageName,
      acceptedMatches,
    } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ fallback: true });
    }

    const cleanMimeType =
      (mimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';

    const ai = getGeminiClient();

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: audioBase64,
      },
    };

    const textPart = {
      text: `You are a pronunciation evaluator for a language-learning game in ${languageName}.
The learner is asked to say the letter or word: "${targetText}" (pronounced "${targetPhonetic || targetText}").
Valid phonetic/script matches for this target are: ${[
        targetText,
        targetPhonetic,
        ...(acceptedMatches || []),
      ]
        .filter(Boolean)
        .join(', ')}.

Instructions:
1. Transcribe what the speaker said into "heardText".
2. Set "isCorrect": true if the speaker pronounced "${targetText}" or "${targetPhonetic}" or a close phonetic approximation.
3. Set "isCorrect": false ONLY if the speaker clearly said a DIFFERENT letter/word or made no speech sound.
4. Set "encouragement" with a short message.`,
    };

    for (const modelName of VERIFY_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [audioPart, textPart] },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isCorrect: { type: Type.BOOLEAN },
                heardText: { type: Type.STRING },
                encouragement: { type: Type.STRING },
              },
              required: ['isCorrect', 'heardText', 'encouragement'],
            },
          },
        });

        const result = JSON.parse((response.text ?? '{}').trim());
        return NextResponse.json({
          isCorrect: Boolean(result.isCorrect),
          heardText: result.heardText || '',
          encouragement: result.encouragement || '',
          fallback: false,
        });
      } catch {
        // Try next model in fallback chain if quota (429) is hit on current model
      }
    }

    return NextResponse.json({ fallback: true });
  } catch {
    return NextResponse.json({ fallback: true });
  }
}
