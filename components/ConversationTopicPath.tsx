'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Check,
  Gift,
  Lock,
  Search,
  Star,
  Shield,
  Volume2,
  X,
  ArrowLeft,
  Mic,
  User as UserIcon,
} from 'lucide-react';
import { ConversationItem, LanguageInfo } from '@/lib/languages';
import {
  NINETY_CONVERSATION_TOPICS,
  ROUNDS_PER_TOPIC,
  ConversationTopicNode,
  getTopicPathUICopy,
  getTopicTitleForLang,
  getSentencesForTopicRound,
  localizeUsernameForSpokenLanguage,
} from '@/lib/conversation-topics-90';
import { pronounceText } from '@/lib/audio-engine';

interface ConversationTopicPathProps {
  nativeLang: LanguageInfo;
  targetLang: LanguageInfo;
  isDark: boolean;
  learnerName?: string;
  onChangeLearnerName?: (name: string) => void;
  allConversations: ConversationItem[];
  topicRounds: Record<number, number>;
  maxUnlockedTopicId: number;
  claimedChests: number[];
  onClaimChest: (unitNumber: number) => void;
  onStartTopicRound: (topicIndex: number, roundNumber: number) => void;
  onBackHome: () => void;
  onOpenWordsMode: () => void;
}

const WINDING_OFFSETS = [0, -54, -84, -44, 18, 68, 42, -16, -64, -22];
const FIFTEEN_ROUNDS = Array.from({ length: ROUNDS_PER_TOPIC }, (_, i) => i + 1);

export default function ConversationTopicPath({
  nativeLang,
  targetLang,
  isDark,
  learnerName = '',
  onChangeLearnerName,
  allConversations,
  topicRounds,
  maxUnlockedTopicId,
  claimedChests,
  onClaimChest,
  onStartTopicRound,
  onBackHome,
  onOpenWordsMode,
}: ConversationTopicPathProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<number | 'ALL'>('ALL');
  const [guidebookUnit, setGuidebookUnit] = useState<number | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isListeningName, setIsListeningName] = useState(false);

  const ui = useMemo(() => getTopicPathUICopy(nativeLang), [nativeLang]);

  const localizedUsername = useMemo(
    () => localizeUsernameForSpokenLanguage(learnerName, nativeLang, ''),
    [learnerName, nativeLang]
  );

  const handleVoiceUsernameInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;
    try {
      const rec = new SpeechRec();
      rec.lang = nativeLang.bcp47;
      rec.continuous = false;
      rec.interimResults = false;
      setIsListeningName(true);
      rec.onresult = (ev: any) => {
        const transcript = (ev.results?.[0]?.[0]?.transcript || '').trim();
        if (transcript) {
          onChangeLearnerName?.(transcript);
        }
        setIsListeningName(false);
      };
      rec.onerror = () => setIsListeningName(false);
      rec.onend = () => setIsListeningName(false);
      rec.start();
    } catch {
      setIsListeningName(false);
    }
  };

  const completedTopicsCount = useMemo(() => {
    return NINETY_CONVERSATION_TOPICS.filter(
      (_, idx) => (topicRounds[idx] || 0) >= ROUNDS_PER_TOPIC
    ).length;
  }, [topicRounds]);

  const effectiveMaxUnlockedIndex = useMemo(() => {
    let seqIdx = 0;
    while (seqIdx < 89 && (topicRounds[seqIdx] || 0) >= ROUNDS_PER_TOPIC) {
      seqIdx++;
    }
    return Math.min(89, Math.max(seqIdx, Math.max(1, maxUnlockedTopicId) - 1));
  }, [topicRounds, maxUnlockedTopicId]);

  const activeFocusTopicIndex = useMemo(() => {
    for (let i = 0; i <= effectiveMaxUnlockedIndex; i++) {
      if ((topicRounds[i] || 0) < ROUNDS_PER_TOPIC) return i;
    }
    return effectiveMaxUnlockedIndex;
  }, [topicRounds, effectiveMaxUnlockedIndex]);

  const units = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const grouped: Array<{
      unitNumber: number;
      sectionNumber: number;
      accentColor: string;
      headerTitleNative: string;
      headerTitleTarget: string;
      topics: Array<{ topic: ConversationTopicNode; index: number }>;
    }> = [];

    for (let u = 1; u <= 18; u++) {
      const sectionNum = Math.ceil(u / 2);
      if (selectedSectionFilter !== 'ALL' && sectionNum !== selectedSectionFilter) {
        continue;
      }
      const unitTopics = NINETY_CONVERSATION_TOPICS.slice((u - 1) * 5, u * 5)
        .map((t, localIdx) => ({ topic: t, index: (u - 1) * 5 + localIdx }))
        .filter(({ topic }) => {
          if (!q) return true;
          const nativeTitle = getTopicTitleForLang(topic, nativeLang).toLowerCase();
          const targetTitle = getTopicTitleForLang(topic, targetLang).toLowerCase();
          return (
            nativeTitle.includes(q) ||
            targetTitle.includes(q) ||
            topic.titleEn.toLowerCase().includes(q) ||
            String(topic.id).includes(q)
          );
        });

      if (unitTopics.length === 0) continue;

      const leadTopic = unitTopics[0].topic;
      grouped.push({
        unitNumber: u,
        sectionNumber: sectionNum,
        accentColor: leadTopic.accentColor,
        headerTitleNative: getTopicTitleForLang(leadTopic, nativeLang),
        headerTitleTarget: getTopicTitleForLang(leadTopic, targetLang),
        topics: unitTopics,
      });
    }
    return grouped;
  }, [searchQuery, selectedSectionFilter, nativeLang, targetLang]);

  const guidebookSentences = useMemo(() => {
    if (guidebookUnit === null) return [];
    const baseTopicIdx = (guidebookUnit - 1) * 5;
    return getSentencesForTopicRound(allConversations, baseTopicIdx, 1);
  }, [allConversations, guidebookUnit]);

  const showLockedBanner = (prevTopicNum: number) => {
    setLockedNotice(ui.lockedTopicToast(prevTopicNum));
    setTimeout(() => {
      setLockedNotice('');
    }, 3400);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        dir={ui.rtl ? 'rtl' : 'ltr'}
        className={`rounded-[26px] p-4 sm:p-5 border transition-all ${
          isDark
            ? 'bg-[#111A24] border-slate-800 text-white shadow-xl'
            : 'bg-white border-sky-100 text-slate-900 shadow-[0_12px_30px_rgba(14,116,144,0.08)]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onBackHome}
              className={`px-3.5 py-2 rounded-full text-xs font-display font-extrabold flex items-center gap-1.5 border cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>🏠</span>
            </button>

            <button
              type="button"
              onClick={onOpenWordsMode}
              className={`px-3.5 py-2 rounded-full text-xs font-display font-extrabold flex items-center gap-1.5 border cursor-pointer transition-colors ${
                isDark
                  ? 'bg-sky-950/70 border-sky-700 text-sky-300 hover:bg-sky-900/70'
                  : 'bg-[#EEF6FF] border-sky-200 text-[#0066FF] hover:bg-[#DCEBFF]'
              }`}
            >
              <span>🍎 1. Words</span>
            </button>

            <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#C084FC] to-[#9333EA] text-white text-xs font-display font-extrabold shadow-xs">
              {ui.topicsProgressSummary(
                completedTopicsCount,
                90,
                Math.max(90, allConversations.length)
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsEditingName((v) => !v)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-display font-extrabold flex items-center gap-1.5 border cursor-pointer transition-colors ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{ui.usernameBadgeLabel}</span>
              <span className="underline decoration-dotted">
                {localizedUsername || '✏️'}
              </span>
            </button>
          </div>

          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ui.searchTopicsPlaceholder}
              className={`w-full pl-9 pr-3 py-2 rounded-full border text-xs font-semibold outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-500'
              }`}
            />
          </div>
        </div>

        {isEditingName && onChangeLearnerName && (
          <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] flex items-center">
              <input
                type="text"
                value={learnerName}
                onChange={(e) => onChangeLearnerName(e.target.value)}
                placeholder={ui.editUsernamePlaceholder}
                className={`w-full pl-3.5 pr-9 py-2 rounded-full border text-xs font-extrabold outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-400'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              />
              {learnerName.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeLearnerName('')}
                  title="Clear name"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 text-[10px] font-black flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleVoiceUsernameInput}
              className={`px-3.5 py-2 rounded-full text-xs font-display font-extrabold flex items-center gap-1.5 cursor-pointer ${
                isListeningName
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-[#0066FF] hover:bg-blue-600 text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{ui.speakUsernameBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingName(false)}
              className="px-3.5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-display font-extrabold cursor-pointer"
            >
              {ui.saveUsernameBtn}
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1">
          <button
            type="button"
            onClick={() => setSelectedSectionFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-display font-extrabold shrink-0 cursor-pointer transition-all ${
              selectedSectionFilter === 'ALL'
                ? 'bg-[#C084FC] text-slate-950 shadow-xs'
                : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All 90 Topics (1–90)
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((sec) => {
            const firstTopic = NINETY_CONVERSATION_TOPICS[(sec - 1) * 10];
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSectionFilter(sec)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-display font-bold shrink-0 cursor-pointer transition-all flex items-center gap-1 ${
                  selectedSectionFilter === sec
                    ? 'bg-[#C084FC] text-slate-950 font-extrabold shadow-xs'
                    : isDark
                    ? 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{firstTopic?.icon}</span>
                <span>
                  {(sec - 1) * 10 + 1}–{sec * 10}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {lockedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            dir={ui.rtl ? 'rtl' : 'ltr'}
            className="w-full px-4 py-3 rounded-2xl bg-amber-500 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 text-center"
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>{lockedNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-[30px] bg-[#131F24] border border-slate-800 px-3 py-6 sm:px-6 sm:py-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)] space-y-10">
        {units.map((unit) => {
          const isChestClaimed = claimedChests.includes(unit.unitNumber);

          return (
            <div key={unit.unitNumber} className="space-y-7">
              <div
                dir={ui.rtl ? 'rtl' : 'ltr'}
                style={{ backgroundColor: unit.accentColor }}
                className="w-full rounded-[22px] p-4 sm:p-5 text-slate-950 shadow-[0_6px_0_rgba(0,0,0,0.28)] flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="text-xs sm:text-sm font-display font-extrabold opacity-80 flex items-center gap-1.5">
                    <span>
                      {ui.sectionUnitHeader(unit.sectionNumber, unit.unitNumber)}
                    </span>
                    <span>·</span>
                    <span>
                      {ui.topicWord} {(unit.unitNumber - 1) * 5 + 1}–
                      {unit.unitNumber * 5}
                    </span>
                  </div>
                  <h3 className="font-display text-lg sm:text-2xl font-extrabold leading-tight text-white drop-shadow-xs">
                    {unit.headerTitleNative}
                  </h3>
                  {nativeLang.code !== targetLang.code && (
                    <div className="text-xs font-extrabold text-slate-900/85">
                      {targetLang.flag} {unit.headerTitleTarget}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setGuidebookUnit(unit.unitNumber)}
                  className="px-4 py-2.5 rounded-2xl bg-black/15 hover:bg-black/25 border-2 border-white/40 text-white font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{ui.guidebookBtn}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 px-2">
                <div className="flex-1 h-[2px] bg-slate-700/70" />
                <span
                  dir={ui.rtl ? 'rtl' : 'ltr'}
                  className="text-xs sm:text-sm font-display font-extrabold text-slate-400 text-center"
                >
                  {unit.headerTitleNative}
                </span>
                <div className="flex-1 h-[2px] bg-slate-700/70" />
              </div>

              <div className="relative flex flex-col items-center gap-7 py-2">
                {unit.topics.map(({ topic, index }, localIdx) => {
                  const completedRounds = Math.min(
                    ROUNDS_PER_TOPIC,
                    topicRounds[index] || 0
                  );
                  const isTopicCompleted = completedRounds >= ROUNDS_PER_TOPIC;
                  const isTopicUnlocked = index <= effectiveMaxUnlockedIndex;
                  const nextRoundToPlay = isTopicCompleted
                    ? 1
                    : completedRounds + 1;
                  const isFocusNode = index === activeFocusTopicIndex;
                  const offsetX =
                    WINDING_OFFSETS[index % WINDING_OFFSETS.length];

                  const nativeTopicTitle = getTopicTitleForLang(
                    topic,
                    nativeLang
                  );
                  const targetTopicTitle = getTopicTitleForLang(
                    topic,
                    targetLang
                  );

                  const ringRadius = 46;
                  const ringCircumference = 2 * Math.PI * ringRadius;
                  const ringProgress = completedRounds / ROUNDS_PER_TOPIC;
                  const strokeDashoffset =
                    ringCircumference * (1 - ringProgress);

                  return (
                    <React.Fragment key={topic.id}>
                      <div
                        style={{ transform: `translateX(${offsetX}px)` }}
                        className="relative flex flex-col items-center group"
                      >
                        {localIdx === 1 && (
                          <div className="hidden sm:flex flex-col items-center absolute -left-36 top-0 pointer-events-none select-none">
                            <img
                              src="/assets/aistudio/balloon_variant.png"
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-20 h-24 object-contain animate-gentle-bob drop-shadow-[0_14px_20px_rgba(192,132,252,0.35)]"
                            />
                            <div className="w-16 h-4 rounded-full bg-slate-800/90 -mt-2" />
                          </div>
                        )}

                        {(isFocusNode ||
                          (isTopicUnlocked &&
                            completedRounds > 0 &&
                            completedRounds < ROUNDS_PER_TOPIC)) && (
                          <motion.div
                            initial={{ y: 4, opacity: 0 }}
                            animate={{ y: [0, -5, 0], opacity: 1 }}
                            transition={{
                              y: { repeat: Infinity, duration: 1.8 },
                            }}
                            dir={ui.rtl ? 'rtl' : 'ltr'}
                            className="mb-2 px-4 py-1.5 rounded-2xl bg-[#1F2C34] border-2 border-slate-600 text-white font-display font-extrabold text-xs sm:text-sm shadow-lg relative z-20 whitespace-nowrap"
                          >
                            <span style={{ color: topic.accentColor }}>
                              {completedRounds === 0
                                ? ui.startLabel
                                : ui.continueRoundLabel(
                                    nextRoundToPlay,
                                    ROUNDS_PER_TOPIC
                                  )}
                            </span>
                            <div className="w-3 h-3 bg-[#1F2C34] border-r-2 border-b-2 border-slate-600 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
                          </motion.div>
                        )}

                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg
                            className="w-28 h-28 -rotate-90 absolute inset-0 pointer-events-none"
                            viewBox="0 0 108 108"
                          >
                            <circle
                              cx="54"
                              cy="54"
                              r={ringRadius}
                              fill="transparent"
                              stroke="#2A3942"
                              strokeWidth="8"
                            />
                            {isTopicUnlocked && completedRounds > 0 && (
                              <circle
                                cx="54"
                                cy="54"
                                r={ringRadius}
                                fill="transparent"
                                stroke={
                                  isTopicCompleted ? '#FACC15' : topic.accentColor
                                }
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={strokeDashoffset}
                              />
                            )}
                          </svg>

                          <button
                            type="button"
                            onClick={() => {
                              if (!isTopicUnlocked) {
                                showLockedBanner(topic.id - 1);
                                return;
                              }
                              onStartTopicRound(index, nextRoundToPlay);
                            }}
                            style={{
                              backgroundColor: !isTopicUnlocked
                                ? '#2A3942'
                                : isTopicCompleted
                                ? '#EAB308'
                                : topic.accentColor,
                              boxShadow: !isTopicUnlocked
                                ? '0 7px 0 #1A242B'
                                : isTopicCompleted
                                ? '0 7px 0 #A16207'
                                : '0 7px 0 rgba(0,0,0,0.42)',
                            }}
                            className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center text-white transition-transform active:translate-y-1 cursor-pointer border-2 ${
                              !isTopicUnlocked
                                ? 'border-slate-600/50 text-slate-400 opacity-75'
                                : 'border-white/35 hover:scale-105'
                            }`}
                          >
                            {!isTopicUnlocked ? (
                              <Lock className="w-7 h-7 text-slate-400" />
                            ) : isTopicCompleted ? (
                              <Check className="w-9 h-9 stroke-[3.5] text-slate-950" />
                            ) : localIdx === 4 ? (
                              <Shield className="w-8 h-8 fill-white text-white" />
                            ) : (
                              <Star className="w-8 h-8 fill-white text-white" />
                            )}
                            <span className="text-[10px] font-mono font-extrabold mt-0.5 text-slate-950/90 bg-white/75 px-1.5 rounded-full">
                              {!isTopicUnlocked
                                ? '🔒'
                                : `${completedRounds}/${ROUNDS_PER_TOPIC}`}
                            </span>
                          </button>
                        </div>

                        <div className="mt-2 flex flex-col items-center text-center max-w-[290px]">
                          <div className="flex items-center gap-1 flex-wrap justify-center mb-1">
                            {FIFTEEN_ROUNDS.map((rNum) => (
                              <span
                                key={rNum}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  isTopicUnlocked && rNum <= completedRounds
                                    ? 'bg-amber-400 scale-110'
                                    : 'bg-slate-700'
                                }`}
                              />
                            ))}
                          </div>

                          <div
                            dir={ui.rtl ? 'rtl' : 'ltr'}
                            className={`text-xs sm:text-sm font-display font-extrabold leading-snug ${
                              isTopicUnlocked ? 'text-white' : 'text-slate-500'
                            }`}
                          >
                            <span className="text-purple-300">
                              #{topic.id} {topic.icon}
                            </span>{' '}
                            <span>{nativeTopicTitle}</span>
                          </div>

                          {nativeLang.code !== targetLang.code && (
                            <div
                              dir={targetLang.rtl ? 'rtl' : 'ltr'}
                              className="text-[11px] font-bold text-sky-300/90 mt-0.5"
                            >
                              {targetLang.flag} {targetTopicTitle}
                            </div>
                          )}

                          {isTopicUnlocked ? (
                            <div className="mt-1.5 flex items-center gap-1 flex-wrap justify-center max-w-[270px]">
                              {FIFTEEN_ROUNDS.map((rNum) => {
                                const isRoundDone = rNum <= completedRounds;
                                const isRoundNext = rNum === nextRoundToPlay;
                                const canClickRound =
                                  isRoundDone || isRoundNext;
                                return (
                                  <button
                                    key={rNum}
                                    type="button"
                                    onClick={() => {
                                      if (!canClickRound) return;
                                      onStartTopicRound(index, rNum);
                                    }}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition-all ${
                                      isRoundDone
                                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 cursor-pointer'
                                        : isRoundNext
                                        ? 'bg-purple-500/30 border-purple-300 text-white cursor-pointer'
                                        : 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                                  >
                                    R{rNum} {isRoundDone ? '✓' : ''}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>{ui.lockedTopicLabel}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {localIdx === 2 && (
                        <div className="my-1 flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => onClaimChest(unit.unitNumber)}
                            className={`px-5 py-3 rounded-2xl border-2 flex items-center gap-2.5 font-display font-extrabold text-xs transition-transform active:scale-95 cursor-pointer ${
                              isChestClaimed
                                ? 'bg-slate-800/80 border-slate-700 text-emerald-300'
                                : 'bg-gradient-to-b from-amber-400 to-orange-500 border-yellow-200 text-slate-950 shadow-[0_6px_0_#B45309]'
                            }`}
                          >
                            <Gift className="w-5 h-5" />
                            <span>
                              {isChestClaimed
                                ? ui.chestOpenedLabel
                                : ui.chestRewardTitle}
                            </span>
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {guidebookUnit !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGuidebookUnit(null)}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              dir={ui.rtl ? 'rtl' : 'ltr'}
              className="w-full max-w-2xl rounded-[28px] bg-[#1E293B] border border-slate-700 text-white p-5 sm:p-6 space-y-4 shadow-2xl max-h-[84vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <h3 className="font-display text-lg sm:text-xl font-extrabold">
                    {ui.guidebookBtn} — Unit {guidebookUnit}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setGuidebookUnit(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {guidebookSentences.map((item, idx) => {
                  const meaning =
                    item.translations?.[nativeLang.code] ||
                    (nativeLang.code === 'ur'
                      ? item.urduMeaning
                      : item.englishMeaning);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div
                          dir={targetLang.rtl ? 'rtl' : 'ltr'}
                          className="font-display font-extrabold text-sm sm:text-base text-white"
                        >
                          {item.icon} {item.phrase}
                        </div>
                        <div className="text-xs text-sky-300 font-semibold">
                          {item.pronunciation}
                        </div>
                        <div className="text-xs text-slate-300">
                          {nativeLang.flag} {meaning}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          pronounceText(
                            item.phrase,
                            targetLang.bcp47,
                            targetLang.name,
                            item.pronunciation
                          )
                        }
                        className="p-2.5 rounded-full bg-[#0066FF] hover:bg-blue-600 text-white shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
