'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Globe,
  Check,
  GraduationCap,
  BookOpen,
  Sparkles,
  Flame,
  MessageCircle,
  Compass,
  Target,
  CheckCircle2,
  ShieldCheck,
  Youtube,
  Instagram,
  Music2,
  Facebook,
  Users,
  Chrome,
  Plane,
  Briefcase,
  Brain,
  Zap,
  Trophy,
  LogIn,
} from 'lucide-react';
import { WORLD_LANGUAGES, LanguageInfo } from '@/lib/languages';
import { getUIPrompts } from '@/lib/ui-translations';
import {
  getOnboardingWizardCopy,
  OnboardingProfileData,
  ReferralSourceId,
  InitialProficiencyType,
  ConversationAbilityLevel,
  LearningMotivationId,
} from '@/lib/onboarding-translations';

export type OnboardingStepId =
  | 'native'
  | 'target'
  | 'referral'
  | 'proficiency'
  | 'daily_goal';

interface LanguageSelectionScreenProps {
  initialNative: LanguageInfo;
  initialTarget: LanguageInfo;
  initialStep?: OnboardingStepId;
  initialOnboardingData?: OnboardingProfileData;
  hasCompletedOnboarding?: boolean;
  onConfirm: (
    nativeLang: LanguageInfo,
    targetLang: LanguageInfo,
    onboardingData?: OnboardingProfileData
  ) => void;
  onSelectNative?: (nativeLang: LanguageInfo) => void;
  onCancel?: () => void;
  onOpenSignIn?: () => void;
  isDark?: boolean;
}

export default function LanguageSelectionScreen({
  initialNative,
  initialTarget,
  initialStep = 'native',
  initialOnboardingData,
  hasCompletedOnboarding = false,
  onConfirm,
  onSelectNative,
  onCancel,
  onOpenSignIn,
  isDark = false,
}: LanguageSelectionScreenProps) {
  const [step, setStep] = useState<OnboardingStepId>(initialStep);
  const [nativeLang, setNativeLang] = useState<LanguageInfo>(initialNative);
  const [targetLang, setTargetLang] = useState<LanguageInfo>(initialTarget);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [hasChosenNativeInSession, setHasChosenNativeInSession] =
    useState<boolean>(initialStep !== 'native');

  // Step 3, 4, 5 state (localized in nativeLang after Step 1)
  const [referralSource, setReferralSource] = useState<ReferralSourceId>(
    initialOnboardingData?.referralSource || 'youtube'
  );
  const [proficiencyType, setProficiencyType] = useState<InitialProficiencyType>(
    initialOnboardingData?.proficiencyType || 'scratch'
  );
  const [conversationAbility, setConversationAbility] =
    useState<ConversationAbilityLevel>(
      initialOnboardingData?.conversationAbility || 'level_1_basic'
    );
  const [motivation, setMotivation] = useState<LearningMotivationId>(
    initialOnboardingData?.motivation || 'travel'
  );
  const [dailyMinutes, setDailyMinutes] = useState<5 | 10 | 15 | 20>(
    initialOnboardingData?.dailyMinutes || 10
  );

  // IMPORTANT: On Step 1 ('native'), before the user tells us what language they speak,
  // ask in English ("What language do you speak?"). As soon as they choose their spoken language,
  // convert Step 2, Step 3, Step 4, Step 5 and the entire website into their chosen spoken language!
  const ui = useMemo(() => getUIPrompts(nativeLang.code), [nativeLang.code]);
  const ob = useMemo(() => getOnboardingWizardCopy(nativeLang), [nativeLang]);

  const regions = useMemo(() => {
    const set = new Set<string>(['All']);
    WORLD_LANGUAGES.forEach((l) => set.add(l.region));
    return Array.from(set);
  }, []);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return WORLD_LANGUAGES.filter((lang) => {
      const matchesRegion =
        selectedRegion === 'All' || lang.region === selectedRegion;
      const matchesSearch =
        !q ||
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q);
      return matchesRegion && matchesSearch;
    });
  }, [searchQuery, selectedRegion]);

  const customLanguageCandidate = useMemo<LanguageInfo | null>(() => {
    const q = searchQuery.trim();
    if (q.length < 2 || filteredLanguages.length > 0) return null;
    const formattedName = q.charAt(0).toUpperCase() + q.slice(1);
    return {
      code: q.toLowerCase().slice(0, 3),
      name: formattedName,
      nativeName: formattedName,
      flag: '🌍',
      bcp47: 'en-US',
      region: 'Global',
    };
  }, [searchQuery, filteredLanguages]);

  const buildOnboardingPayload = (
    overrideProficiency?: InitialProficiencyType,
    overrideConvLevel?: ConversationAbilityLevel
  ): OnboardingProfileData => ({
    referralSource,
    proficiencyType: overrideProficiency || proficiencyType,
    conversationAbility: overrideConvLevel || conversationAbility,
    motivation,
    dailyMinutes,
    completedAt: new Date().toISOString(),
  });

  // Step 1: Select Spoken Language -> Closes Screen 1 and opens Screen 2 ('target') in that spoken language!
  // Step 2: Select Learning Language -> If onboarding was already completed earlier, confirm immediately without repeating survey questions!
  const handleSelectLanguage = (lang: LanguageInfo) => {
    if (step === 'native') {
      setNativeLang(lang);
      setHasChosenNativeInSession(true);
      onSelectNative?.(lang);
      setSearchQuery('');
      setStep('target');
    } else if (step === 'target') {
      setTargetLang(lang);
      setSearchQuery('');
      if (hasCompletedOnboarding) {
        onConfirm(nativeLang, lang, initialOnboardingData);
        return;
      }
      setStep('referral');
    }
  };

  const handleFinishWizard = () => {
    onConfirm(nativeLang, targetLang, buildOnboardingPayload());
  };

  const stepOrder: OnboardingStepId[] = [
    'native',
    'target',
    'referral',
    'proficiency',
    'daily_goal',
  ];
  const currentStepIdx = stepOrder.indexOf(step);
  const progressPercent = Math.round(((currentStepIdx + 1) / stepOrder.length) * 100);

  const handleStepBack = () => {
    if (currentStepIdx > 0) {
      setStep(stepOrder[currentStepIdx - 1]);
      setSearchQuery('');
    }
  };

  // On Step 1 ('native'), keep direction LTR to match the English prompt
  const isStepOneEnglish = step === 'native';
  const activeDir = isStepOneEnglish ? 'ltr' : nativeLang.rtl ? 'rtl' : 'ltr';

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-center py-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.24 }}
          dir={activeDir}
          className={`w-full rounded-[32px] border p-5 sm:p-8 transition-all duration-300 ${
            isDark
              ? 'bg-[#0F172A]/95 border-slate-700/80 text-white shadow-[0_24px_60px_rgba(0,0,0,0.55)]'
              : 'bg-white border-sky-100 text-slate-900 shadow-[0_24px_60px_rgba(14,116,144,0.14)]'
          }`}
        >
          {/* Top Sequential Step Progress Bar (Shows only current screen progress — previous screen is closed) */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2.5">
              {currentStepIdx > 0 && (
                <button
                  type="button"
                  onClick={handleStepBack}
                  className={`px-3.5 py-2 rounded-full border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isStepOneEnglish ? 'Back' : ob.backBtn}</span>
                </button>
              )}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/25 text-[#0066FF] dark:text-sky-300 text-xs font-extrabold">
                <ShieldCheck className="w-4 h-4" />
                <span dir="ltr">
                  Step {currentStepIdx + 1} of 5 · {progressPercent}%
                </span>
              </div>
            </div>

            {/* Selected Languages Summary Pill (Appears from Step 2 onwards) */}
            <div className="flex items-center gap-2">
              {currentStepIdx >= 1 && (
                <div
                  className={`px-3 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-slate-800/90 border-slate-700 text-sky-300'
                      : 'bg-[#EEF6FF] border-sky-200 text-[#0066FF]'
                  }`}
                >
                  <span>{nativeLang.flag}</span>
                  <span>{nativeLang.nativeName}</span>
                  {currentStepIdx >= 2 && (
                    <>
                      <span className="opacity-60">→</span>
                      <span>{targetLang.flag}</span>
                      <span>{targetLang.nativeName}</span>
                    </>
                  )}
                </div>
              )}

              {onOpenSignIn && (
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-sm flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {isStepOneEnglish
                      ? 'Sign in'
                      : nativeLang.code === 'ur'
                      ? 'سائن اِن کریں (Sign in)'
                      : nativeLang.code === 'hi'
                      ? 'साइन इन करें (Sign in)'
                      : 'Sign in'}
                  </span>
                </button>
              )}

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-white shadow-sm"
                >
                  {ui.backToGame}
                </button>
              )}
            </div>
          </div>

          {/* Continuous Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35 }}
              className="h-full rounded-full bg-gradient-to-r from-[#0066FF] via-indigo-500 to-emerald-500"
            />
          </div>

          {/* Dedicated Question Header Banner for Current Screen */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl border ${
              isDark
                ? 'bg-gradient-to-r from-[#0F172A] via-[#1E3A5F] to-[#1E293B] border-sky-500/30'
                : 'bg-gradient-to-r from-[#DCEBFF] via-[#C3E0FF] to-[#9AD0FF] border-white'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0">
                <img
                  src="/assets/aistudio/balloon_variant.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-11 h-14 sm:w-12 sm:h-16 object-contain drop-shadow-[0_6px_12px_rgba(0,102,255,0.28)]"
                />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-b from-[#FDE047] to-[#F59E0B] border border-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-3 h-3 text-slate-950 stroke-[2.5]" />
                </span>
                <span className="absolute -bottom-0.5 -left-1 w-4 h-4 rounded-full bg-gradient-to-b from-[#38BDF8] to-[#0284C7] border border-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                </span>
              </div>
              <div>
                <div
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold tracking-wide mb-1.5 ${
                    isDark
                      ? 'bg-[#0066FF]/25 text-sky-300 border border-sky-400/30'
                      : 'bg-white/90 text-[#0066FF] border border-sky-200'
                  }`}
                >
                  {step === 'native'
                    ? 'STEP 1 OF 5 · SPOKEN LANGUAGE'
                    : step === 'target'
                    ? ui.selectStep2Badge(
                        `${nativeLang.flag} ${nativeLang.nativeName}`
                      )
                    : step === 'referral'
                    ? ob.step3Badge
                    : step === 'proficiency'
                    ? ob.step4Badge
                    : ob.step5Badge}
                </div>
                <h1
                  className={`font-display text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {step === 'native'
                    ? 'What language do you speak?'
                    : step === 'target'
                    ? ui.selectTargetTitle
                    : step === 'referral'
                    ? ob.step3Title
                    : step === 'proficiency'
                    ? ob.step4Title(
                        `${targetLang.flag} ${targetLang.nativeName}`
                      )
                    : ob.step5Title}
                </h1>
                <p
                  className={`text-xs sm:text-sm mt-1 font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {step === 'native'
                    ? 'Choose your native spoken language first. Once selected, the entire website and all questions will convert into your language.'
                    : step === 'target'
                    ? ui.selectTargetSub
                    : step === 'referral'
                    ? ob.step3Subtitle
                    : step === 'proficiency'
                    ? ob.step4Subtitle
                    : ob.step5Subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================================
              SCREEN 1 ('native') OR SCREEN 2 ('target'): LANGUAGE SELECTION
              ================================================================= */}
          {(step === 'native' || step === 'target') && (
            <div className="mt-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#0066FF] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      step === 'native'
                        ? 'Search the language you speak (e.g. Urdu, English, Hindi, Arabic)...'
                        : ui.searchTargetPlaceholder
                    }
                    className={`w-full pl-11 pr-4 py-2.5 border rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0066FF] transition-all ${
                      isDark
                        ? 'bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-400'
                        : 'bg-[#F3F8FF] border-sky-100 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {regions.slice(0, 5).map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedRegion === region
                          ? 'bg-[#0066FF] text-white shadow-[0_4px_12px_rgba(0,102,255,0.28)]'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-[#EEF5FF] text-slate-600 hover:bg-[#DCEBFF]'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div
                dir="ltr"
                className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[390px] overflow-y-auto pr-1 py-1"
              >
                {filteredLanguages.map((lang) => {
                  const isHighlighted =
                    step === 'native'
                      ? hasChosenNativeInSession &&
                        nativeLang.code === lang.code
                      : targetLang.code === lang.code;

                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang)}
                      className={`group relative flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-150 hover:-translate-y-0.5 cursor-pointer ${
                        isHighlighted
                          ? isDark
                            ? 'bg-[#0066FF]/20 border-[#0066FF] ring-2 ring-[#0066FF]/30'
                            : 'bg-[#DCEBFF] border-[#0066FF] shadow-[0_6px_14px_rgba(0,102,255,0.16)]'
                          : isDark
                          ? 'bg-slate-800/75 border-slate-700 hover:border-sky-400'
                          : 'bg-white border-slate-100 hover:border-sky-300 hover:bg-[#F5F9FF] shadow-[0_3px_10px_rgba(14,116,144,0.05)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0 drop-shadow-xs">
                          {lang.flag}
                        </span>
                        <div className="min-w-0">
                          <div
                            className={`font-display font-bold text-xs sm:text-sm truncate ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {lang.nativeName}
                          </div>
                          <div
                            className={`text-[11px] truncate ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {lang.name}
                          </div>
                        </div>
                      </div>

                      {isHighlighted && (
                        <div className="w-5 h-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center shrink-0 ml-1 shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}

                {customLanguageCandidate && (
                  <button
                    type="button"
                    onClick={() => handleSelectLanguage(customLanguageCandidate)}
                    className={`col-span-full flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-[#0066FF] text-left transition-all cursor-pointer ${
                      isDark
                        ? 'bg-sky-950/40 hover:bg-sky-900/50 text-white'
                        : 'bg-[#EEF5FF] hover:bg-[#DCEBFF] text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-6 h-6 text-[#0066FF]" />
                      <div>
                        <div className="font-display font-bold text-sm">
                          {customLanguageCandidate.name}
                        </div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              SCREEN 3 ('referral'): WHERE DID YOU HEAR ABOUT US?
              ================================================================= */}
          {step === 'referral' && (
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {(
                  [
                    'youtube',
                    'tiktok_insta',
                    'google',
                    'friends_family',
                    'facebook',
                    'school_other',
                  ] as ReferralSourceId[]
                ).map((refId) => {
                  const item = ob.referralOptions[refId];
                  const isSelected = referralSource === refId;
                  const renderReferralPlatformIcon = (id: ReferralSourceId) => {
                    switch (id) {
                      case 'youtube':
                        return (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF0000] to-[#CC0000] text-white flex items-center justify-center shadow-[0_6px_14px_rgba(255,0,0,0.3)] shrink-0">
                            <Youtube className="w-6 h-6 stroke-[2.2]" />
                          </div>
                        );
                      case 'tiktok_insta':
                        return (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shadow-[0_6px_14px_rgba(221,42,123,0.3)] shrink-0 relative">
                            <Instagram className="w-6 h-6 stroke-[2.2]" />
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 text-[#00F2FE] border border-white flex items-center justify-center shadow-xs">
                              <Music2 className="w-3 h-3 stroke-[2.5]" />
                            </span>
                          </div>
                        );
                      case 'google':
                        return (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05] p-0.5 shadow-[0_6px_14px_rgba(66,133,244,0.28)] shrink-0">
                            <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center text-[#4285F4]">
                              <Chrome className="w-6 h-6 stroke-[2.2]" />
                            </div>
                          </div>
                        );
                      case 'friends_family':
                        return (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-[0_6px_14px_rgba(16,185,129,0.3)] shrink-0">
                            <Users className="w-6 h-6 stroke-[2.2]" />
                          </div>
                        );
                      case 'facebook':
                        return (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1877F2] to-[#0C5DC7] text-white flex items-center justify-center shadow-[0_6px_14px_rgba(24,119,242,0.3)] shrink-0 relative">
                            <Facebook className="w-6 h-6 stroke-[2.2]" />
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#25D366] text-white border border-white flex items-center justify-center shadow-xs">
                              <MessageCircle className="w-3 h-3 stroke-[2.5]" />
                            </span>
                          </div>
                        );
                      case 'school_other':
                      default:
                        return (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-[0_6px_14px_rgba(79,70,229,0.3)] shrink-0">
                            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
                          </div>
                        );
                    }
                  };

                  return (
                    <button
                      key={refId}
                      type="button"
                      onClick={() => {
                        setReferralSource(refId);
                        // Automatically close Screen 3 and open Screen 4 ('proficiency')!
                        setStep('proficiency');
                      }}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-start transition-all flex items-center justify-between gap-3 cursor-pointer hover:-translate-y-0.5 ${
                        isSelected
                          ? isDark
                            ? 'bg-[#0066FF]/25 border-[#0066FF] ring-2 ring-[#0066FF]/30 shadow-md'
                            : 'bg-[#DCEBFF] border-[#0066FF] shadow-[0_6px_16px_rgba(0,102,255,0.18)]'
                          : isDark
                          ? 'bg-slate-800/80 border-slate-700 hover:border-sky-400'
                          : 'bg-[#F8FBFF] border-sky-100 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {renderReferralPlatformIcon(refId)}
                        <div className="min-w-0">
                          <div className="font-display font-extrabold text-sm sm:text-base">
                            {item.title}
                          </div>
                          <p className="text-xs opacity-80 mt-0.5 leading-snug">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'bg-[#0066FF] text-white shadow-xs'
                            : isDark
                            ? 'border-2 border-slate-600 text-transparent'
                            : 'border-2 border-sky-200 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Continue & Direct Sign-In Action Row on Step 3 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {onOpenSignIn && (
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className={`px-5 py-3 rounded-full border-2 font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
                      isDark
                        ? 'bg-slate-800 border-sky-500/50 text-sky-300 hover:bg-slate-700'
                        : 'bg-white border-sky-300 text-[#0066FF] hover:bg-sky-50'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {nativeLang.code === 'ur'
                        ? 'گوگل سے سائن اِن کریں (Sign in with Google)'
                        : nativeLang.code === 'hi'
                        ? 'गूगल से साइन इन करें (Sign in with Google)'
                        : 'Sign in with Google'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setStep('proficiency')}
                  className="ml-auto px-6 py-3 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-extrabold text-xs sm:text-sm shadow-[0_8px_20px_rgba(0,102,255,0.3)] flex items-center gap-2 cursor-pointer"
                >
                  <span>{ob.continueBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              SCREEN 4 ('proficiency'): BEGINNER (CHILD-LIKE TEACHER MODE) VS CONVERSATION LEVEL
              ================================================================= */}
          {step === 'proficiency' && (
            <div className="mt-6 space-y-5">
              {/* Primary 2-Way Choice: Start from Scratch (Child-Friendly Hand-Holding Teacher) OR Know Some Conversation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setProficiencyType('scratch');
                    // Selecting Complete Beginner closes Screen 4 and advances to Screen 5!
                    setStep('daily_goal');
                  }}
                  className={`p-5 rounded-3xl border-2 text-start transition-all flex items-start justify-between gap-3 cursor-pointer hover:-translate-y-0.5 ${
                    proficiencyType === 'scratch'
                      ? isDark
                        ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg'
                        : 'bg-emerald-50 border-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.18)]'
                      : isDark
                      ? 'bg-slate-800/85 border-slate-700 hover:border-emerald-400'
                      : 'bg-[#F8FBFF] border-sky-100 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl shrink-0">
                      👩‍🏫
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[11px] font-extrabold mb-1">
                        <span>🌱 Hand-Holding Teacher Mode</span>
                      </div>
                      <div className="font-display font-extrabold text-sm sm:text-base md:text-lg">
                        {ob.startFromScratchTitle}
                      </div>
                      <p className="text-xs sm:text-sm opacity-80 mt-1 leading-relaxed">
                        {ob.startFromScratchDesc}
                      </p>
                    </div>
                  </div>
                  {proficiencyType === 'scratch' && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProficiencyType('some_conversation');
                  }}
                  className={`p-5 rounded-3xl border-2 text-start transition-all flex items-start justify-between gap-3 cursor-pointer hover:-translate-y-0.5 ${
                    proficiencyType === 'some_conversation'
                      ? isDark
                        ? 'bg-[#0066FF]/25 border-[#0066FF] ring-2 ring-[#0066FF]/35 shadow-lg'
                        : 'bg-[#DCEBFF] border-[#0066FF] shadow-[0_8px_20px_rgba(0,102,255,0.2)]'
                      : isDark
                      ? 'bg-slate-800/85 border-slate-700 hover:border-sky-400'
                      : 'bg-[#F8FBFF] border-sky-100 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-[#0066FF]/20 border border-sky-400/40 flex items-center justify-center text-2xl shrink-0">
                      💬
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] dark:text-sky-300 text-[11px] font-extrabold mb-1">
                        <span>🗣️ Select Conversation Level</span>
                      </div>
                      <div className="font-display font-extrabold text-sm sm:text-base md:text-lg">
                        {ob.knowSomeConvTitle}
                      </div>
                      <p className="text-xs sm:text-sm opacity-80 mt-1 leading-relaxed">
                        {ob.knowSomeConvDesc}
                      </p>
                    </div>
                  </div>
                  {proficiencyType === 'some_conversation' && (
                    <CheckCircle2 className="w-6 h-6 text-[#0066FF] shrink-0" />
                  )}
                </button>
              </div>

              {/* Conditional Follow-up Question when user chooses "I can have some conversation" */}
              <AnimatePresence>
                {proficiencyType === 'some_conversation' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-3xl p-4 sm:p-5 border-2 space-y-3.5 overflow-hidden ${
                      isDark
                        ? 'bg-slate-900/90 border-sky-500/40'
                        : 'bg-gradient-to-r from-[#EEF6FF] via-[#F5F9FF] to-[#EEF6FF] border-sky-200'
                    }`}
                  >
                    <div>
                      <h3 className="font-display font-extrabold text-sm sm:text-lg text-[#0066FF] dark:text-sky-300 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 shrink-0" />
                        <span>
                          {ob.convLevelQuestionTitle(
                            `${targetLang.flag} ${targetLang.nativeName}`
                          )}
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm opacity-80 mt-0.5">
                        {ob.convLevelQuestionSub}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(
                        [
                          'level_1_basic',
                          'level_2_medium',
                          'level_3_full',
                        ] as ConversationAbilityLevel[]
                      ).map((lvlId, idx) => {
                        const lvl = ob.convLevels[lvlId];
                        const isChosen = conversationAbility === lvlId;
                        const iconEmoji =
                          idx === 0 ? '🗣️' : idx === 1 ? '🚀' : '👑';
                        return (
                          <button
                            key={lvlId}
                            type="button"
                            onClick={() => {
                              setConversationAbility(lvlId);
                              // Selecting Conversation Level closes Screen 4 and advances to Screen 5!
                              setStep('daily_goal');
                            }}
                            className={`p-4 rounded-2xl border-2 text-start transition-all flex flex-col justify-between gap-2.5 cursor-pointer hover:-translate-y-0.5 ${
                              isChosen
                                ? isDark
                                  ? 'bg-[#0066FF]/25 border-[#0066FF] shadow-md'
                                  : 'bg-white border-[#0066FF] shadow-[0_6px_16px_rgba(0,102,255,0.18)]'
                                : isDark
                                ? 'bg-slate-800/80 border-slate-700 hover:border-sky-400'
                                : 'bg-white/80 border-sky-100 hover:border-sky-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#0066FF]/15 text-[#0066FF] dark:text-sky-300">
                                  {iconEmoji} {lvl.badge}
                                </span>
                                {isChosen && (
                                  <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                                )}
                              </div>
                              <div className="font-display font-extrabold text-sm sm:text-base">
                                {lvl.title}
                              </div>
                              <p className="text-xs opacity-80 mt-1 leading-relaxed">
                                {lvl.desc}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-sky-500/20 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                              {lvl.unlockPreview}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* =================================================================
              SCREEN 5 ('daily_goal'): MOTIVATION + DAILY GOAL + PROCEED TO SIGN-IN
              ================================================================= */}
          {step === 'daily_goal' && (
            <div className="mt-6 space-y-5">
              {/* Motivation Picker */}
              <div>
                <label className="block text-xs sm:text-sm font-extrabold mb-2.5 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#0066FF]" />
                  <span>{ob.motivationLabel}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(
                    [
                      'travel',
                      'career',
                      'education',
                      'connect',
                      'brain',
                    ] as LearningMotivationId[]
                  ).map((motId) => {
                    const item = ob.motivations[motId];
                    const isSelected = motivation === motId;
                    const renderMotivationIcon = (id: LearningMotivationId) => {
                      switch (id) {
                        case 'travel':
                          return <Plane className="w-5 h-5 text-sky-500" />;
                        case 'career':
                          return <Briefcase className="w-5 h-5 text-amber-500" />;
                        case 'education':
                          return <GraduationCap className="w-5 h-5 text-indigo-500" />;
                        case 'connect':
                          return <Users className="w-5 h-5 text-emerald-500" />;
                        case 'brain':
                        default:
                          return <Brain className="w-5 h-5 text-rose-500" />;
                      }
                    };
                    return (
                      <button
                        key={motId}
                        type="button"
                        onClick={() => setMotivation(motId)}
                        className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'bg-[#0066FF]/25 border-[#0066FF] shadow-md'
                              : 'bg-[#DCEBFF] border-[#0066FF] shadow-sm'
                            : isDark
                            ? 'bg-slate-800/80 border-slate-700 hover:border-sky-400'
                            : 'bg-[#F8FBFF] border-sky-100 hover:border-sky-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-700 flex items-center justify-center shadow-2xs">
                          {renderMotivationIcon(motId)}
                        </div>
                        <span className="font-display font-extrabold text-xs leading-tight">
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily Practice Commitment Picker */}
              <div>
                <label className="block text-xs sm:text-sm font-extrabold mb-2.5 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span>{ob.dailyCommitLabel}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ob.dailyCommitOptions.map((opt) => {
                    const isSelected = dailyMinutes === opt.minutes;
                    const renderGoalIcon = (mins: number) => {
                      if (mins <= 5) return <Sparkles className="w-5 h-5 text-emerald-500" />;
                      if (mins <= 10) return <Flame className="w-5 h-5 text-orange-500" />;
                      if (mins <= 15) return <Zap className="w-5 h-5 text-amber-500" />;
                      return <Trophy className="w-5 h-5 text-yellow-500" />;
                    };
                    return (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => setDailyMinutes(opt.minutes)}
                        className={`p-3.5 rounded-2xl border-2 text-start transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-400/25 to-orange-500/20 border-amber-500 shadow-md'
                            : isDark
                            ? 'bg-slate-800/80 border-slate-700 hover:border-amber-400'
                            : 'bg-[#FFFDF5] border-amber-200/80 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-700 flex items-center justify-center shrink-0">
                            {renderGoalIcon(opt.minutes)}
                          </div>
                          <div>
                            <div className="font-display font-extrabold text-xs sm:text-sm">
                              {opt.label}
                            </div>
                            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-300">
                              {opt.tag}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 100% Automatic Streak System Info Banner */}
              <div
                className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
                  isDark
                    ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Flame className="w-5 h-5 fill-white" />
                </div>
                <div className="flex-1">
                  <div className="font-display font-extrabold text-xs sm:text-sm flex items-center gap-2">
                    <span>{ob.autoStreakPromiseTitle}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                      AUTO
                    </span>
                  </div>
                  <p className="text-xs opacity-85 mt-0.5 leading-relaxed">
                    {ob.autoStreakPromiseDesc}
                  </p>
                </div>
              </div>

              {/* Final CTA to Complete Setup & Proceed to Mandatory Sign-In */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleFinishWizard}
                  className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#0066FF] via-indigo-600 to-purple-600 hover:brightness-110 text-white font-display font-extrabold text-sm sm:text-base shadow-[0_10px_25px_rgba(0,102,255,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {hasCompletedOnboarding
                      ? ob.savePreferencesBtn
                      : ob.finishToSignInBtn}
                  </span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
