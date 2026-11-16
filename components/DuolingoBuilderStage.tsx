'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Check,
  RotateCcw,
  Lightbulb,
  Mic,
} from 'lucide-react';
import {
  LanguageInfo,
  ConversationItem,
  WordItem,
} from '@/lib/languages';
import {
  getSharedAudioContext,
  playMicStartChime,
  playGentleRetryTone,
  pronounceText,
} from '@/lib/audio-engine';

export interface WordTile {
  id: string;
  text: string;
  normText: string;
  phonetic?: string;
  isDistractor: boolean;
}

interface InlineConversationWordAssemblerProps {
  currentItem: ConversationItem;
  allConversations: ConversationItem[];
  words: WordItem[];
  currentIndex: number;
  targetLang: LanguageInfo;
  nativeLang?: LanguageInfo;
  isDark: boolean;
  onSuccessAssemble: (assembledText: string) => void;
  onSwitchToVoice: () => void;
  onReplayTeacher: () => void;
}

const ASSEMBLER_COPY: Record<
  string,
  {
    placeholder: string;
    wrongOrder: string;
    checkBtn: string;
    hintBtn: string;
    resetTitle: string;
    hearAgainBtn: string;
    speakInsteadBtn: string;
  }
> = {
  en: {
    placeholder: 'Tap words below in the right order to build the sentence',
    wrongOrder: '❌ Wrong word order! Arrange the words properly or tap Hint.',
    checkBtn: 'Check',
    hintBtn: 'Hint',
    resetTitle: 'Reset words',
    hearAgainBtn: 'Hear Again',
    speakInsteadBtn: 'Speak Instead',
  },
  ur: {
    placeholder: 'نیچے دیے گئے الفاظ پر کلک کر کے جملہ مکمل کریں',
    wrongOrder: '❌ ترتیب غلط ہے! صحیح ترتیب سے الفاظ لگائیں یا "اشارہ" دبائیں۔',
    checkBtn: 'چیک کریں',
    hintBtn: 'اشارہ',
    resetTitle: 'دوبارہ ترتیب دیں',
    hearAgainBtn: 'دوبارہ سنیں',
    speakInsteadBtn: 'بول کر جواب دیں',
  },
  fa: {
    placeholder: 'روی واژه‌های زیر به ترتیب کلیک کنید تا جمله کامل شود',
    wrongOrder: '❌ ترتیب واژه‌ها نادرست است! ترتیب درست را بچینید یا «راهنما» را بزنید.',
    checkBtn: 'بررسی',
    hintBtn: 'راهنما',
    resetTitle: 'چیدمان مجدد',
    hearAgainBtn: 'دوباره بشنوید',
    speakInsteadBtn: 'پاسخ صوتی',
  },
  fr: {
    placeholder: 'Appuyez sur les mots ci-dessous pour former la phrase',
    wrongOrder: '❌ Ordre incorrect ! Placez les mots dans le bon ordre ou utilisez un Indice.',
    checkBtn: 'Vérifier',
    hintBtn: 'Indice',
    resetTitle: 'Réinitialiser',
    hearAgainBtn: 'Réécouter',
    speakInsteadBtn: 'Parler au micro',
  },
  hi: {
    placeholder: 'वाक्य पूरा करने के लिए नीचे दिए गए शब्दों पर टैप करें',
    wrongOrder: '❌ क्रम ग़लत है! सही क्रम में शब्द लगाएं या "संकेत" दबाएं।',
    checkBtn: 'जाँचें',
    hintBtn: 'संकेत',
    resetTitle: 'रीसेट करें',
    hearAgainBtn: 'फिर से सुनें',
    speakInsteadBtn: 'बोलकर जवाब दें',
  },
  ar: {
    placeholder: 'اضغط على الكلمات أدناه بالترتيب الصحيح لتكوين الجملة',
    wrongOrder: '❌ الترتيب غير صحيح! رتب الكلمات بشكل صحيح أو اضغط على "تلميح".',
    checkBtn: 'تحقق',
    hintBtn: 'تلميح',
    resetTitle: 'إعادة ترتيب',
    hearAgainBtn: 'استمع مجدداً',
    speakInsteadBtn: 'تحدث بالميكروفون',
  },
};

// Normalize a word token for comparison (strips punctuation and diacritics)
function normalizeTileToken(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ةۀہھ]/g, 'ه')
    .replace(/[يئىے]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[.,!?؟،"'()[\]{}\-_/\\+:;|~`@#$%^&*=<>«»„“”！？。、]/g, '')
    .trim();
}

// Tokenize any target sentence into clean word tiles across all 65+ languages
function tokenizeSentenceIntoWords(
  phrase: string,
  pronunciation: string,
  langCode: string
): { text: string; phonetic?: string }[] {
  const cleanPhrase = phrase
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanPron = (pronunciation || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[.,!?؟،！？。、]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const pronTokens = cleanPron ? cleanPron.split(' ').filter(Boolean) : [];

  const rawSpaceTokens = cleanPhrase
    .split(/\s+/)
    .map((tok) =>
      tok.replace(
        /^[.,!?؟،"'()[\]{}«»„“”！？。、]+|[.,!?؟،"'()[\]{}«»„“”！？。、]+$/g,
        ''
      )
    )
    .filter(Boolean);

  if (rawSpaceTokens.length >= 2) {
    return rawSpaceTokens.map((text, idx) => ({
      text,
      phonetic:
        pronTokens.length === rawSpaceTokens.length
          ? pronTokens[idx]
          : undefined,
    }));
  }

  // Non-space scripts (e.g., Japanese, Chinese, Thai)
  if (langCode === 'ja' || langCode === 'zh' || rawSpaceTokens.length === 1) {
    const stripped = cleanPhrase.replace(/[！？。、!?.,]/g, ' ').trim();
    const clauseParts = stripped.split(/\s+/).filter(Boolean);

    const chunks: string[] = [];
    for (const part of clauseParts) {
      if (langCode === 'ja') {
        const jaTokens = part
          .split(
            /(?<=[はがをにでへとからまでよりねよか])|(?=です|ます|ません|ください)/
          )
          .map((s) => s.trim())
          .filter(Boolean);
        chunks.push(...jaTokens);
      } else {
        for (let i = 0; i < part.length; i += 2) {
          chunks.push(part.slice(i, i + 2));
        }
      }
    }

    if (chunks.length >= 2) {
      return chunks.map((text, idx) => ({
        text,
        phonetic:
          pronTokens.length === chunks.length ? pronTokens[idx] : undefined,
      }));
    }
  }

  return rawSpaceTokens.map((text) => ({ text }));
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed + 1;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export default function InlineConversationWordAssembler({
  currentItem,
  allConversations,
  words,
  currentIndex,
  targetLang,
  nativeLang,
  isDark,
  onSuccessAssemble,
  onSwitchToVoice,
  onReplayTeacher,
}: InlineConversationWordAssemblerProps) {
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const [wrongFeedback, setWrongFeedback] = useState<boolean>(false);
  const [shuffleNonce, setShuffleNonce] = useState<number>(0);

  const uiCode = nativeLang?.code || targetLang.code;
  const copy = ASSEMBLER_COPY[uiCode] || ASSEMBLER_COPY.en;

  const { targetTokens, bankTiles } = useMemo(() => {
    const coreTokens = tokenizeSentenceIntoWords(
      currentItem.phrase,
      currentItem.pronunciation,
      targetLang.code
    );

    const correctTiles: WordTile[] = coreTokens.map((tok, idx) => ({
      id: `conv-word-${currentIndex}-${idx}`,
      text: tok.text,
      normText: normalizeTileToken(tok.text),
      phonetic: tok.phonetic,
      isDistractor: false,
    }));

    // Add 2-3 distractor words from the same language so the learner chooses the right words
    const usedNorms = new Set(correctTiles.map((t) => t.normText));
    const distractorCandidates: { text: string; phonetic?: string }[] = [];

    for (let offset = 1; offset <= words.length; offset++) {
      const wItem = words[(currentIndex * 3 + offset) % words.length];
      if (!wItem) continue;
      const wClean = wItem.word.replace(/\([^)]*\)/g, '').trim();
      const wNorm = normalizeTileToken(wClean);
      if (wClean && !wClean.includes(' ') && wNorm && !usedNorms.has(wNorm)) {
        usedNorms.add(wNorm);
        distractorCandidates.push({
          text: wClean,
          phonetic: wItem.pronunciation,
        });
      }
      if (distractorCandidates.length >= 3) break;
    }

    if (distractorCandidates.length < 2) {
      for (let offset = 1; offset < allConversations.length; offset++) {
        const otherConv =
          allConversations[(currentIndex + offset) % allConversations.length];
        if (!otherConv) continue;
        const otherWords = tokenizeSentenceIntoWords(
          otherConv.phrase,
          otherConv.pronunciation,
          targetLang.code
        );
        for (const ow of otherWords) {
          const owNorm = normalizeTileToken(ow.text);
          if (owNorm && !usedNorms.has(owNorm)) {
            usedNorms.add(owNorm);
            distractorCandidates.push(ow);
            if (distractorCandidates.length >= 3) break;
          }
        }
        if (distractorCandidates.length >= 3) break;
      }
    }

    const maxDistractors = coreTokens.length >= 7 ? 2 : 3;
    const distractorTiles: WordTile[] = distractorCandidates
      .slice(0, maxDistractors)
      .map((d, idx) => ({
        id: `conv-dist-${currentIndex}-${idx}`,
        text: d.text,
        normText: normalizeTileToken(d.text),
        phonetic: d.phonetic,
        isDistractor: true,
      }));

    const combined = [...correctTiles, ...distractorTiles];
    const shuffled = seededShuffle(
      combined,
      currentIndex * 97 + targetLang.code.charCodeAt(0) + shuffleNonce * 31
    );

    return {
      targetTokens: correctTiles,
      bankTiles: shuffled,
    };
  }, [
    allConversations,
    currentIndex,
    currentItem.phrase,
    currentItem.pronunciation,
    shuffleNonce,
    targetLang.code,
    words,
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSelectedTileIds([]);
      setWrongFeedback(false);
    }, 0);
    return () => clearTimeout(t);
  }, [currentIndex, targetLang.code]);

  const selectedTiles = useMemo(
    () =>
      selectedTileIds
        .map((id) => bankTiles.find((t) => t.id === id))
        .filter((t): t is WordTile => Boolean(t)),
    [selectedTileIds, bankTiles]
  );

  // Select a word tile from the bank
  const handleSelectBankTile = useCallback(
    (tile: WordTile) => {
      if (selectedTileIds.includes(tile.id)) return;
      getSharedAudioContext();
      setWrongFeedback(false);
      playMicStartChime();
      pronounceText(
        tile.text,
        targetLang.bcp47,
        targetLang.name,
        tile.phonetic || tile.text
      );

      const nextIds = [...selectedTileIds, tile.id];
      setSelectedTileIds(nextIds);

      // If the user has assembled the exact number of target words and they match 100%, auto-pop the balloon!
      if (nextIds.length === targetTokens.length) {
        const nextTiles = nextIds
          .map((id) => bankTiles.find((bt) => bt.id === id))
          .filter((bt): bt is WordTile => Boolean(bt));
        const userNorm = nextTiles.map((t) => t.normText).join(' ');
        const targetNorm = targetTokens.map((t) => t.normText).join(' ');
        if (userNorm === targetNorm) {
          setTimeout(() => {
            onSuccessAssemble(currentItem.phrase);
          }, 260);
        }
      }
    },
    [
      bankTiles,
      currentItem.phrase,
      onSuccessAssemble,
      selectedTileIds,
      targetLang.bcp47,
      targetLang.name,
      targetTokens,
    ]
  );

  const handleRemoveTrayTile = useCallback((tileId: string) => {
    getSharedAudioContext();
    setWrongFeedback(false);
    setSelectedTileIds((prev) => prev.filter((id) => id !== tileId));
  }, []);

  const handleUseHint = useCallback(() => {
    getSharedAudioContext();
    setWrongFeedback(false);

    let matchPrefixLen = 0;
    while (
      matchPrefixLen < selectedTiles.length &&
      matchPrefixLen < targetTokens.length &&
      selectedTiles[matchPrefixLen].normText ===
        targetTokens[matchPrefixLen].normText
    ) {
      matchPrefixLen++;
    }

    if (matchPrefixLen >= targetTokens.length) return;

    const correctPrefixIds = selectedTiles
      .slice(0, matchPrefixLen)
      .map((t) => t.id);
    const nextNeededNorm = targetTokens[matchPrefixLen].normText;

    const candidateTile = bankTiles.find(
      (t) =>
        !correctPrefixIds.includes(t.id) && t.normText === nextNeededNorm
    );

    if (candidateTile) {
      playMicStartChime();
      pronounceText(
        candidateTile.text,
        targetLang.bcp47,
        targetLang.name,
        candidateTile.phonetic || candidateTile.text
      );
      const nextIds = [...correctPrefixIds, candidateTile.id];
      setSelectedTileIds(nextIds);

      if (nextIds.length === targetTokens.length) {
        setTimeout(() => {
          onSuccessAssemble(currentItem.phrase);
        }, 280);
      }
    }
  }, [
    bankTiles,
    currentItem.phrase,
    onSuccessAssemble,
    selectedTiles,
    targetLang.bcp47,
    targetLang.name,
    targetTokens,
  ]);

  const handleCheckAnswer = useCallback(() => {
    if (selectedTiles.length === 0) return;
    getSharedAudioContext();

    const userNorm = selectedTiles.map((t) => t.normText).join(' ');
    const targetNorm = targetTokens.map((t) => t.normText).join(' ');

    if (userNorm === targetNorm) {
      onSuccessAssemble(currentItem.phrase);
    } else {
      setWrongFeedback(true);
      playGentleRetryTone();
      onReplayTeacher();
    }
  }, [
    currentItem.phrase,
    onReplayTeacher,
    onSuccessAssemble,
    selectedTiles,
    targetTokens,
  ]);

  return (
    <div className="w-full flex flex-col gap-1.5 sm:gap-2">
      {/* Assembled Sentence Tray */}
      <div
        dir={targetLang.rtl ? 'rtl' : 'ltr'}
        className={`min-h-[42px] sm:min-h-[46px] rounded-2xl border-2 px-2.5 py-1.5 flex flex-wrap items-center justify-center gap-1.5 transition-colors ${
          wrongFeedback
            ? isDark
              ? 'bg-rose-950/60 border-rose-500/80'
              : 'bg-rose-50 border-rose-400'
            : isDark
            ? 'bg-slate-950/65 border-slate-700'
            : 'bg-slate-50/95 border-slate-200'
        }`}
      >
        {selectedTiles.length === 0 ? (
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 select-none">
            {copy.placeholder}
          </span>
        ) : (
          <AnimatePresence>
            {selectedTiles.map((tile) => (
              <motion.button
                key={`tray-${tile.id}`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                type="button"
                onClick={() => handleRemoveTrayTile(tile.id)}
                className={`px-2.5 py-1 rounded-xl border-2 border-b-4 font-display font-extrabold text-xs sm:text-sm cursor-pointer transition-transform active:translate-y-0.5 ${
                  wrongFeedback
                    ? 'bg-gradient-to-b from-[#FF6B8B] to-[#E11D48] border-[#9F1239] text-white'
                    : isDark
                    ? 'bg-emerald-950/90 border-emerald-500 border-b-emerald-900 text-emerald-100'
                    : 'bg-gradient-to-b from-[#ECFCCB] to-[#D9F99D] border-[#65A30D] text-emerald-950'
                }`}
              >
                {tile.text}
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Shuffled Word Tiles Bank */}
      <div
        dir={targetLang.rtl ? 'rtl' : 'ltr'}
        className="flex flex-wrap items-center justify-center gap-1.5"
      >
        {bankTiles.map((tile) => {
          const isSelected = selectedTileIds.includes(tile.id);
          return (
            <button
              key={`bank-${tile.id}`}
              type="button"
              disabled={isSelected}
              onClick={() => handleSelectBankTile(tile)}
              className={`px-2.5 py-1 rounded-xl border-2 border-b-4 font-display font-extrabold text-xs sm:text-sm transition-all ${
                isSelected
                  ? isDark
                    ? 'bg-slate-800/40 border-dashed border-slate-700 text-transparent select-none cursor-default'
                    : 'bg-slate-200/60 border-dashed border-slate-300 text-transparent select-none cursor-default'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 border-b-slate-950 text-white cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5'
                  : 'bg-white hover:bg-sky-50 border-slate-200 border-b-slate-300 text-slate-900 shadow-xs cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5'
              }`}
            >
              {tile.text}
            </button>
          );
        })}
      </div>

      {/* Wrong Order Correction Notice */}
      {wrongFeedback && (
        <div className="text-[11px] sm:text-xs font-extrabold text-rose-500">
          {copy.wrongOrder}
        </div>
      )}

      {/* Action Controls Row: Check + Hint + Hear Again + Switch to Mic */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-0.5">
        <button
          type="button"
          disabled={selectedTiles.length === 0}
          onClick={handleCheckAnswer}
          className={`px-4 py-1.5 rounded-xl font-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
            selectedTiles.length > 0
              ? 'bg-gradient-to-b from-[#58CC02] to-[#46A302] text-white shadow-[0_3px_0_#388200] active:translate-y-0.5'
              : isDark
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{copy.checkBtn}</span>
        </button>

        <button
          type="button"
          onClick={handleUseHint}
          className={`px-2.5 py-1.5 rounded-xl border font-extrabold text-xs flex items-center gap-1 cursor-pointer ${
            isDark
              ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
              : 'bg-amber-50 border-amber-300 text-amber-900 shadow-[0_2px_0_#F59E0B]'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>{copy.hintBtn}</span>
        </button>

        {selectedTiles.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedTileIds([]);
              setWrongFeedback(false);
              setShuffleNonce((n) => n + 1);
            }}
            className={`p-1.5 rounded-xl border cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title={copy.resetTitle}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onReplayTeacher}
          className={`px-2.5 py-1.5 rounded-xl border font-extrabold text-xs flex items-center gap-1 cursor-pointer ${
            isDark
              ? 'bg-slate-800 border-slate-600 text-amber-300'
              : 'bg-gradient-to-b from-[#FEF9C3] to-[#FDE047] border-amber-300 text-amber-950 shadow-[0_2px_0_#D97706]'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{copy.hearAgainBtn}</span>
        </button>

        <button
          type="button"
          onClick={onSwitchToVoice}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#FF6B8B] to-[#FF8E53] text-white font-extrabold text-xs flex items-center gap-1 shadow-[0_2px_0_#E11D48] cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>{copy.speakInsteadBtn}</span>
        </button>
      </div>
    </div>
  );
}
