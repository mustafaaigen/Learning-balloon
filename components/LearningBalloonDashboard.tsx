'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  BookOpen,
  Mic,
  Trophy,
  BarChart3,
  Users,
  Globe,
  Search,
  Flame,
  Star,
  Sun,
  Moon,
  Play,
  ArrowRight,
  ChevronRight,
  Volume2,
  Settings,
  Award,
  Check,
  Gift,
  ShieldCheck,
  Lock,
  Puzzle,
  Sparkles,
  Download,
  LogIn,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  playBalloonPopSound,
  triggerBalloonPopVibration,
} from '@/lib/audio-engine';
import { WORLD_LANGUAGES, LanguageInfo } from '@/lib/languages';
import {
  db,
  auth,
  User,
  doc,
  isUserAdmin,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  DifficultyLevel,
  LearnerRecord,
} from '@/lib/firebase-client';
import { getDashboardTranslations } from '@/lib/dashboard-translations';
import {
  getCertificateCopyForLang,
  getLocalizedCourseLanguageName,
} from '@/lib/certificate-translations';
import {
  downloadLocalizedCertificatePdf,
  renderLocalizedCertificateCanvas,
} from '@/lib/certificate-renderer';
import {
  localizeUsernameForSpokenLanguage,
  getTopicPathUICopy,
} from '@/lib/conversation-topics-90';
import {
  SecurityIncident,
  getSecurityIncidents,
  inspectAndGuardInput,
  subscribeToSecurityIncidents,
} from '@/lib/security-monitor';

export type ActiveAppScreen =
  | 'AUTH_ONBOARDING'
  | 'LANGUAGE_SELECT'
  | 'WORLD_START'
  | 'ALPHABET_GAME'
  | 'WORDS_GAME'
  | 'CONVERSATION_GAME'
  | 'REVIEW_GAME'
  | 'VICTORY_CELEBRATION';

interface LearningBalloonDashboardProps {
  activeScreen?: ActiveAppScreen;
  onNavigateHome?: () => void;
  children?: React.ReactNode;
  isDark: boolean;
  onToggleTheme: () => void;
  currentUser?: User | null;
  onGoogleSignIn?: () => void;
  onSignOut?: () => void;
  isSigningInGoogle?: boolean;
  learnerName: string;
  onChangeLearnerName?: (name: string) => void;
  nativeLang: LanguageInfo;
  targetLang: LanguageInfo;
  onSelectNativeLang: (lang: LanguageInfo) => void;
  onSelectTargetLang: (lang: LanguageInfo) => void;
  onOpenLanguageModal: (initialStep?: 'native' | 'target') => void;
  onOpenSignInModal: () => void;
  difficultyLevel: DifficultyLevel;
  streakDays: number;
  streakGoalDays: number;
  stars: number;
  alphabetsCompleted: number;
  alphabetsTotal: number;
  wordsCompleted: number;
  wordsTotal: number;
  conversationsCompleted: number;
  conversationsTotal: number;
  reviewMistakesCount?: number;
  isWordsUnlocked: boolean;
  isConversationUnlocked: boolean;
  isCourseFullyCompleted: boolean;
  loadingCurriculum: boolean;
  canOpenAdminPanel: boolean;
  onStartStage: (
    stage: 'ALPHABET_GAME' | 'WORDS_GAME' | 'CONVERSATION_GAME' | 'REVIEW_GAME'
  ) => void;
  onOpenHubTab: (
    tab:
      | 'streak_level'
      | 'achievements'
      | 'leaderboard'
      | 'analytics'
      | 'certificate'
      | 'admin'
  ) => void;
  dailyBonusClaimedToday?: boolean;
  dailyBonusStarsAmount?: number;
  onOpenDailyBalloonBonus?: () => void;
}

const FEATURED_LANGUAGE_CODES = [
  'ur',
  'fa',
  'fr',
  'en',
  'hi',
  'ar',
  'es',
  'de',
  'tr',
  'ru',
  'zh',
  'ja',
  'ko',
  'it',
  'pt',
  'bn',
];

export default function LearningBalloonDashboard({
  activeScreen = 'WORLD_START',
  onNavigateHome,
  children,
  isDark,
  onToggleTheme,
  currentUser,
  onGoogleSignIn,
  onSignOut,
  isSigningInGoogle = false,
  learnerName,
  onChangeLearnerName,
  nativeLang,
  targetLang,
  onSelectNativeLang,
  onSelectTargetLang,
  onOpenLanguageModal,
  onOpenSignInModal,
  difficultyLevel,
  streakDays,
  streakGoalDays,
  stars,
  alphabetsCompleted,
  alphabetsTotal,
  wordsCompleted,
  wordsTotal,
  conversationsCompleted,
  conversationsTotal,
  reviewMistakesCount = 0,
  isWordsUnlocked,
  isConversationUnlocked,
  isCourseFullyCompleted,
  loadingCurriculum,
  canOpenAdminPanel,
  onStartStage,
  onOpenHubTab,
  dailyBonusClaimedToday = false,
  dailyBonusStarsAmount = 15,
  onOpenDailyBalloonBonus,
}: LearningBalloonDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [langStripMode, setLangStripMode] = useState<'native' | 'target'>(
    'target'
  );
  const [isEditingDashboardName, setIsEditingDashboardName] = useState(false);
  const [isListeningDashboardName, setIsListeningDashboardName] = useState(false);
  const [heroBalloonPopped, setHeroBalloonPopped] = useState(false);
  const [stageThumbPopped, setStageThumbPopped] = useState(false);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>(
    () => getSecurityIncidents()
  );

  useEffect(() => {
    return subscribeToSecurityIncidents((updated) => {
      setSecurityIncidents(updated);
    });
  }, []);

  const unreadSecurityCount = useMemo(
    () => securityIncidents.filter((inc) => !inc.readByAdmin).length,
    [securityIncidents]
  );

  const handlePopHeroBalloon = () => {
    if (heroBalloonPopped) return;
    playBalloonPopSound();
    triggerBalloonPopVibration([40, 25, 55]);
    setHeroBalloonPopped(true);
    setTimeout(() => {
      setHeroBalloonPopped(false);
    }, 1500);
  };

  const handlePopStageThumb = () => {
    if (stageThumbPopped) return;
    playBalloonPopSound();
    triggerBalloonPopVibration([35, 20, 40]);
    setStageThumbPopped(true);
    setTimeout(() => {
      setStageThumbPopped(false);
    }, 1400);
  };

  // Full website localization in the user's Spoken Language (nativeLang)
  const t = useMemo(() => getDashboardTranslations(nativeLang), [nativeLang]);
  const certCopy = useMemo(
    () => getCertificateCopyForLang(nativeLang),
    [nativeLang]
  );
  const pathUi = useMemo(() => getTopicPathUICopy(nativeLang), [nativeLang]);
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);
  const [certThumbDataUrl, setCertThumbDataUrl] = useState<string>('');

  const displayName = useMemo(() => {
    const rawName =
      (learnerName || '').trim() ||
      currentUser?.displayName ||
      t.defaultLearnerName;
    return localizeUsernameForSpokenLanguage(
      rawName,
      nativeLang,
      t.defaultLearnerName
    );
  }, [learnerName, currentUser, nativeLang, t.defaultLearnerName]);

  const localizedTargetLangName = useMemo(
    () => getLocalizedCourseLanguageName(targetLang, nativeLang),
    [targetLang, nativeLang]
  );

  // Render live localized Certificate thumbnail in the user's spoken language when course is completed
  useEffect(() => {
    if (!isCourseFullyCompleted) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const rendered = await renderLocalizedCertificateCanvas({
          recipientName: displayName || learnerName || 'Student Name',
          nativeLang,
          targetLang,
          certLanguageMode: 'spoken',
          completionDate: new Date().toISOString().slice(0, 10),
          selectedTemplate: 'template_1',
        });
        if (!cancelled) {
          setCertThumbDataUrl(rendered.canvas.toDataURL('image/png'));
        }
      } catch {}
    }, 60);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    isCourseFullyCompleted,
    displayName,
    learnerName,
    nativeLang,
    targetLang,
  ]);

  const handleDirectDownloadCertificate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isDownloadingCert) return;
    setIsDownloadingCert(true);
    try {
      await downloadLocalizedCertificatePdf({
        recipientName: displayName || learnerName || 'Student Name',
        nativeLang,
        targetLang,
        certLanguageMode: 'spoken',
        completionDate: new Date().toISOString().slice(0, 10),
        selectedTemplate: 'template_1',
      });
    } catch (err) {
      console.error('Direct certificate download error:', err);
    } finally {
      setIsDownloadingCert(false);
    }
  };

  const handleVoiceUsernameCapture = () => {
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
      setIsListeningDashboardName(true);
      rec.onresult = (ev: any) => {
        const transcript = (ev.results?.[0]?.[0]?.transcript || '').trim();
        if (transcript) {
          onChangeLearnerName?.(transcript);
        }
        setIsListeningDashboardName(false);
      };
      rec.onerror = () => setIsListeningDashboardName(false);
      rec.onend = () => setIsListeningDashboardName(false);
      rec.start();
    } catch {
      setIsListeningDashboardName(false);
    }
  };

  const currentLevelNumber = useMemo(() => {
    if (isCourseFullyCompleted) return 4;
    if (difficultyLevel === 'hard') return 3;
    if (difficultyLevel === 'medium') return 2;
    return 1;
  }, [difficultyLevel, isCourseFullyCompleted]);

  // Active Learning Balloon Stage localized in Spoken Language (Only Words & 90 Conversation Topics — Alphabet is removed)
  const activeCourseStage = useMemo(() => {
    if (wordsCompleted >= wordsTotal && wordsTotal > 0) {
      const pct = Math.min(
        100,
        Math.round(
          (conversationsCompleted / Math.max(1, conversationsTotal)) * 100
        )
      );
      return {
        id: 'CONVERSATION_GAME' as const,
        title: t.stage3Title(localizedTargetLangName),
        subtitle: t.stage3Sub(conversationsCompleted, conversationsTotal),
        completed: conversationsCompleted,
        total: conversationsTotal,
        pct,
        iconEmoji: '💬',
      };
    }
    const pct = Math.min(
      100,
      Math.round((wordsCompleted / Math.max(1, wordsTotal)) * 100)
    );
    return {
      id: 'WORDS_GAME' as const,
      title: t.stage2Title(localizedTargetLangName),
      subtitle: t.stage2Sub(wordsCompleted, wordsTotal),
      completed: wordsCompleted,
      total: wordsTotal,
      pct,
      iconEmoji: '🍎',
    };
  }, [
    t,
    localizedTargetLangName,
    conversationsCompleted,
    conversationsTotal,
    wordsCompleted,
    wordsTotal,
  ]);

  // Languages list filtered by search query
  const popularLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return WORLD_LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.nativeName.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q)
      ).slice(0, 16);
    }
    const ordered: LanguageInfo[] = [];
    FEATURED_LANGUAGE_CODES.forEach((code) => {
      const found = WORLD_LANGUAGES.find((l) => l.code === code);
      if (found) ordered.push(found);
    });
    return ordered;
  }, [searchQuery]);

  const [realCloudLearners, setRealCloudLearners] = useState<LearnerRecord[]>([]);

  useEffect(() => {
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.emailVerified) {
      return;
    }
    if (isUserAdmin(fbUser)) {
      const q = query(
        collection(db, 'learners'),
        orderBy('stars', 'desc'),
        limit(15)
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list: LearnerRecord[] = [];
          snap.forEach((d) => {
            list.push(d.data() as LearnerRecord);
          });
          setRealCloudLearners(list);
        },
        () => {}
      );
      return () => unsub();
    } else {
      const selfRef = doc(db, 'learners', fbUser.uid);
      const unsub = onSnapshot(
        selfRef,
        (snap) => {
          if (snap.exists()) {
            setRealCloudLearners([snap.data() as LearnerRecord]);
          } else {
            setRealCloudLearners([]);
          }
        },
        () => {}
      );
      return () => unsub();
    }
  }, []);

  // Only show real signed-in learners + the current user (zero fake/unregistered people!)
  const dashboardLeaders = useMemo(() => {
    const avatarGradients = [
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-600',
      'from-emerald-400 to-teal-600',
      'from-purple-400 to-indigo-600',
    ];
    const others = realCloudLearners
      .filter(
        (r) =>
          r.displayName &&
          r.displayName.trim().toLowerCase() !== displayName.trim().toLowerCase()
      )
      .map((r, i) => ({
        id: r.uid || `real_${i}`,
        name: r.displayName,
        stars: r.stars || 0,
        avatarBg: avatarGradients[i % avatarGradients.length],
        initials: r.displayName.slice(0, 2).toUpperCase(),
        isYou: false,
      }));

    const youEntry = {
      id: 'leader_you',
      name: t.youLabel(displayName),
      stars,
      avatarBg: 'from-sky-400 to-blue-600',
      initials: displayName.slice(0, 2).toUpperCase(),
      isYou: true,
    };

    return [youEntry, ...others].sort((a, b) => b.stars - a.stars).slice(0, 5);
  }, [displayName, realCloudLearners, stars, t]);

  // Circular Daily Streak Ring math
  const streakProgressRatio = Math.min(
    1,
    streakDays / Math.max(1, streakGoalDays)
  );
  const circleRadius = 42;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleStrokeOffset =
    circleCircumference * (1 - Math.max(0.14, streakProgressRatio));

  const stagesCompletedCount =
    (wordsCompleted >= wordsTotal && wordsTotal > 0 ? 1 : 0) +
    (conversationsCompleted >= conversationsTotal && conversationsTotal > 0 ? 1 : 0);

  const isHomeView = activeScreen === 'WORLD_START';

  return (
    /* Keep outer layout LTR so Left Sidebar is ALWAYS on the left and Right Widgets are ALWAYS on the right, matching the reference UI 100%! */
    <div
      dir="ltr"
      className={`pointer-events-auto w-full min-h-dvh overflow-y-auto transition-colors duration-300 p-0 sm:p-3 md:p-5 ${
        isDark
          ? 'bg-[#070D19] text-slate-100'
          : 'bg-gradient-to-br from-[#CFE5FF] via-[#DCEBFA] to-[#E6F1FC] text-slate-900'
      }`}
    >
      <div
        className={`max-w-[1440px] mx-auto min-h-[calc(100dvh-2.5rem)] sm:rounded-[32px] overflow-hidden shadow-[0_24px_70px_rgba(15,23,42,0.12)] border grid grid-cols-1 lg:grid-cols-12 ${
          isDark
            ? 'bg-[#0F172A] border-slate-800'
            : 'bg-[#F5F9FF] border-white/90'
        }`}
      >
        {/* =====================================================================
            COLUMN 1: LEFT SIDEBAR (Always on Left, Clean White Card Style)
            ===================================================================== */}
        <aside
          className={`lg:col-span-2 flex flex-col justify-between p-4 sm:p-5 border-b lg:border-b-0 lg:border-r ${
            isDark
              ? 'bg-[#0B1120] border-slate-800/90'
              : 'bg-white border-slate-200/70'
          }`}
        >
          <div className="space-y-6">
            {/* Learning Balloon Mascot + Brand Header */}
            <div className="flex items-center justify-between lg:justify-start gap-3">
              <button
                type="button"
                onClick={() => onNavigateHome?.()}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#007AFF] p-0.5 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                  <div
                    className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                      isDark ? 'bg-slate-900' : 'bg-[#EBF5FF]'
                    }`}
                  >
                    <img
                      src="/assets/aistudio/balloon_variant.png"
                      alt="Learning Balloon"
                      referrerPolicy="no-referrer"
                      className="w-7 h-8 object-contain"
                    />
                  </div>
                </div>
                <div dir={t.rtl ? 'rtl' : 'ltr'}>
                  <div className="font-display font-extrabold text-base sm:text-lg tracking-tight leading-none">
                    {t.brandTitle}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1">
                    {t.brandSubtitle}
                  </div>
                </div>
              </button>

              {/* Mobile Theme Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                className={`lg:hidden p-2 rounded-xl border cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-amber-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {isDark ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Sidebar Navigation Menu */}
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => onNavigateHome?.()}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  activeScreen === 'WORLD_START'
                    ? isDark
                      ? 'bg-[#007AFF]/25 text-sky-300'
                      : 'bg-[#DFEEFF] text-[#0066FF]'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800/80'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span dir={t.rtl ? 'rtl' : 'ltr'}>{t.navHome}</span>
              </button>

              <button
                type="button"
                onClick={() => onStartStage('WORDS_GAME')}
                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl font-display font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  activeScreen === 'WORDS_GAME'
                    ? isDark
                      ? 'bg-[#007AFF]/25 text-sky-300 font-bold'
                      : 'bg-[#DFEEFF] text-[#0066FF] font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800/80'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Mic className="w-4 h-4 text-amber-500 shrink-0" />
                  <span dir={t.rtl ? 'rtl' : 'ltr'} className="truncate">
                    {t.navWords}
                  </span>
                </span>
                <span className="text-[10px] font-mono opacity-75 shrink-0">
                  {wordsCompleted}/{wordsTotal}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onStartStage('CONVERSATION_GAME')}
                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl font-display font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  activeScreen === 'CONVERSATION_GAME'
                    ? isDark
                      ? 'bg-[#007AFF]/25 text-sky-300 font-bold'
                      : 'bg-[#DFEEFF] text-[#0066FF] font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800/80'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Trophy className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span dir={t.rtl ? 'rtl' : 'ltr'} className="truncate">
                    {t.navConversation}
                  </span>
                </span>
                <span className="text-[10px] font-mono opacity-75 shrink-0">
                  {conversationsCompleted}/{conversationsTotal}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onStartStage('REVIEW_GAME')}
                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl font-display font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  activeScreen === 'REVIEW_GAME'
                    ? isDark
                      ? 'bg-rose-500/25 text-rose-300 font-bold'
                      : 'bg-rose-50 text-rose-600 font-bold'
                    : reviewMistakesCount > 0
                    ? isDark
                      ? 'bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:bg-rose-900/50'
                      : 'bg-rose-50/90 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800/80'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                  <span dir={t.rtl ? 'rtl' : 'ltr'} className="truncate">
                    {nativeLang.code === 'ur'
                      ? '🎯 غلطیوں کی دہرائی'
                      : nativeLang.code === 'ar'
                      ? '🎯 مراجعة الأخطاء'
                      : nativeLang.code === 'fa'
                      ? '🎯 مرور اشتباهات'
                      : nativeLang.code === 'hi'
                      ? '🎯 गलतियों का रिव्यू'
                      : '🎯 Review Mode'}
                  </span>
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                    reviewMistakesCount > 0
                      ? 'bg-rose-500 text-white'
                      : 'opacity-75'
                  }`}
                >
                  {reviewMistakesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onOpenHubTab('streak_level')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-display font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  isDark
                    ? 'text-slate-300 hover:bg-slate-800/80'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-purple-500 shrink-0" />
                <span dir={t.rtl ? 'rtl' : 'ltr'}>{t.navStreakLevels}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenHubTab('achievements')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-display font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  isDark
                    ? 'text-slate-300 hover:bg-slate-800/80'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span dir={t.rtl ? 'rtl' : 'ltr'}>{t.navAchievements}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenHubTab('leaderboard')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-display font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  isDark
                    ? 'text-slate-300 hover:bg-slate-800/80'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4 text-sky-500 shrink-0" />
                <span dir={t.rtl ? 'rtl' : 'ltr'}>{t.navLeaderboard}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenLanguageModal('target')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-display font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  activeScreen === 'LANGUAGE_SELECT'
                    ? isDark
                      ? 'bg-[#007AFF]/25 text-sky-300 font-bold'
                      : 'bg-[#DFEEFF] text-[#0066FF] font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800/80'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                <span dir={t.rtl ? 'rtl' : 'ltr'}>{t.navLanguages}</span>
              </button>

              {canOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => onOpenHubTab('admin')}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                    unreadSecurityCount > 0
                      ? 'bg-rose-600 text-white shadow-md animate-pulse'
                      : isDark
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span dir={t.rtl ? 'rtl' : 'ltr'}>{t.navAdmin}</span>
                  </div>
                  {securityIncidents.length > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        unreadSecurityCount > 0
                          ? 'bg-white text-rose-700'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      🚨 {securityIncidents.length}
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Bottom Sidebar Cards: Certificate Box + Learner Profile Pill */}
          <div className="hidden lg:flex flex-col gap-4 pt-6">
            {/* Learning Balloon Certificate Box (Matches Soft Sky Upgrade Box in Reference Image) */}
            <div
              dir={t.rtl ? 'rtl' : 'ltr'}
              className={`p-4 rounded-2xl border text-center space-y-2.5 ${
                isDark
                  ? 'bg-gradient-to-b from-sky-950/60 to-slate-900 border-sky-800/60'
                  : 'bg-[#EAF3FF] border-sky-100'
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded-full bg-amber-400/25 text-amber-500 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div className="font-display font-extrabold text-xs sm:text-sm">
                {t.certCardTitle}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isCourseFullyCompleted
                  ? t.certCardReadyDesc(localizedTargetLangName)
                  : t.certCardLockedDesc}
              </p>
              <button
                type="button"
                onClick={() =>
                  onOpenHubTab(
                    isCourseFullyCompleted ? 'certificate' : 'streak_level'
                  )
                }
                className="w-full py-2 px-3 rounded-full bg-[#0066FF] hover:bg-blue-600 text-white font-display font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                {isCourseFullyCompleted
                  ? t.certCardBtnReady
                  : t.certCardBtnProgress}
              </button>
            </div>

            {/* Bottom Learner Profile Bar + Google Sign-In / Sign-Out Controls */}
            <div
              className={`p-3 rounded-2xl border space-y-2.5 transition-colors ${
                activeScreen === 'AUTH_ONBOARDING'
                  ? isDark
                    ? 'bg-sky-950/60 border-sky-500'
                    : 'bg-[#DFEEFF] border-sky-300'
                  : isDark
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div
                onClick={onOpenSignInModal}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full border border-emerald-400 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white font-display font-extrabold text-xs flex items-center justify-center shrink-0">
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-display font-bold text-xs sm:text-sm truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser?.email || `${t.levelPrefix} ${currentLevelNumber}`}
                    </div>
                  </div>
                </div>
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {currentUser ? (
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/70 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isSigningInGoogle}
                    onClick={onGoogleSignIn || onOpenSignInModal}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#4285F4] text-white font-black text-[9px] flex items-center justify-center shrink-0">
                      G
                    </span>
                    <span className="truncate">Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3 shrink-0" />
                    <span className="truncate">Sign out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSigningInGoogle}
                  onClick={onGoogleSignIn || onOpenSignInModal}
                  className="w-full py-2 px-3 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <span className="w-4 h-4 rounded-full bg-white text-[#4285F4] font-black text-[10px] flex items-center justify-center shrink-0">
                    G
                  </span>
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* =====================================================================
            COLUMNS 2 & 3: CENTER MAIN CONTENT + RIGHT GOAL/LEADERBOARD COLUMN
            ===================================================================== */}
        <div className="lg:col-span-10 flex flex-col justify-between p-4 sm:p-6 space-y-5">
          {/* TOP HEADER BAR: Search Bar + Spoken Language Switcher + Streak (🔥) + Stars (⭐) + Theme Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                dir={t.rtl ? 'rtl' : 'ltr'}
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  const secCheck = inspectAndGuardInput(
                    val,
                    'Dashboard Search Bar',
                    {
                      name: displayName || learnerName || 'Dashboard User',
                      email: currentUser?.email || 'Unauthenticated',
                    }
                  );
                  if (secCheck.blocked) {
                    return;
                  }
                  setSearchQuery(val);
                  if (!isHomeView) onNavigateHome?.();
                }}
                placeholder={t.searchPlaceholder}
                className={`w-full pl-10 pr-4 py-2.5 rounded-full border text-xs sm:text-sm font-medium outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-sky-500'
                    : 'bg-white border-slate-200/80 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 shadow-2xs'
                }`}
              />
            </div>

            {/* Right Top Controls: Username Pill + Google Sign-In/Sign-Out + Streak + Stars + Theme Toggle */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {/* Live Anti-Hack Security Alert Pill (Strictly visible ONLY for Admin) */}
              {canOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => onOpenHubTab('admin')}
                  className={`px-3 py-2 rounded-full border flex items-center gap-1.5 font-display font-extrabold text-xs transition-all cursor-pointer ${
                    unreadSecurityCount > 0
                      ? 'bg-rose-600 border-rose-400 text-white shadow-md animate-pulse'
                      : securityIncidents.length > 0
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-500 dark:text-rose-300'
                      : isDark
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}
                  title="Anti-Hack Security Monitor"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    {securityIncidents.length > 0
                      ? `🚨 ${securityIncidents.length} Hack Blocked`
                      : '🛡️ Protected'}
                  </span>
                </button>
              )}
              {/* Interactive Username Pill (Displays Username in Spoken Language & Opens Inline Editor / Voice Input) */}
              <button
                type="button"
                onClick={() => setIsEditingDashboardName((v) => !v)}
                className={`px-3.5 py-2 rounded-full border flex items-center gap-1.5 font-display font-extrabold text-xs transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                }`}
              >
                <span>👤</span>
                <span dir={t.rtl ? 'rtl' : 'ltr'}>{displayName}</span>
                <span className="opacity-70 text-[10px]">✏️</span>
              </button>

              {/* Official Google Sign-In or Sign-Out Pill */}
              {currentUser ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-display font-extrabold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSigningInGoogle}
                  onClick={onGoogleSignIn || onOpenSignInModal}
                  className="px-3.5 py-2 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-extrabold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors disabled:opacity-60"
                >
                  <span className="w-4 h-4 rounded-full bg-white text-[#4285F4] font-black text-[10px] flex items-center justify-center shrink-0">
                    G
                  </span>
                  <span>Sign in with Google</span>
                </button>
              )}

              {/* Daily Balloon Bonus Pill (Opens Daily Balloon Bonus Modal!) */}
              {onOpenDailyBalloonBonus && (
                <button
                  type="button"
                  onClick={onOpenDailyBalloonBonus}
                  className={`px-3.5 py-2 rounded-full border flex items-center gap-1.5 font-display font-extrabold text-xs transition-all hover:scale-105 cursor-pointer ${
                    !dailyBonusClaimedToday
                      ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 border-amber-300 text-slate-950 shadow-[0_4px_14px_rgba(245,158,11,0.45)] animate-pulse'
                      : isDark
                      ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-800 shadow-2xs'
                  }`}
                  title="Daily Balloon Bonus"
                >
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {!dailyBonusClaimedToday
                      ? nativeLang.code === 'ur'
                        ? `🎈 بلون بونس +${dailyBonusStarsAmount} ⭐`
                        : nativeLang.code === 'hi'
                        ? `🎈 बैलून बोनस +${dailyBonusStarsAmount} ⭐`
                        : `🎈 Balloon Bonus +${dailyBonusStarsAmount} ⭐`
                      : nativeLang.code === 'ur'
                      ? `✓ بونس ملا (+${dailyBonusStarsAmount} ⭐)`
                      : nativeLang.code === 'hi'
                      ? `✓ बोनस मिला (+${dailyBonusStarsAmount} ⭐)`
                      : `✓ Bonus (+${dailyBonusStarsAmount} ⭐)`}
                  </span>
                </button>
              )}

              {/* Daily Streak Counter */}
              <button
                type="button"
                onClick={() => onOpenHubTab('streak_level')}
                className={`px-3.5 py-2 rounded-full border flex items-center gap-1.5 font-display font-extrabold text-xs sm:text-sm transition-transform hover:scale-105 cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-amber-400'
                    : 'bg-white border-slate-200/80 text-slate-800 shadow-2xs'
                }`}
              >
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {streakDays}
                </span>
              </button>

              {/* Stars Counter (Our Stars replacing Gems!) */}
              <button
                type="button"
                onClick={() => onOpenHubTab('leaderboard')}
                className={`px-3.5 py-2 rounded-full border flex items-center gap-1.5 font-display font-extrabold text-xs sm:text-sm transition-transform hover:scale-105 cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-yellow-400'
                    : 'bg-white border-slate-200/80 text-slate-800 shadow-2xs'
                }`}
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {stars}
                </span>
              </button>

              {/* Theme Toggle Button (Light / Dark) */}
              <button
                type="button"
                onClick={onToggleTheme}
                className={`px-3.5 py-2 rounded-full border flex items-center gap-1.5 font-display font-bold text-xs sm:text-sm transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100 shadow-2xs'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>{t.lightThemeBtn}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>{t.darkThemeBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Inline Username Editor + Voice Mic Input Bar (Write in ANY language or Speak in Spoken Language) */}
          {isEditingDashboardName && onChangeLearnerName && (
            <div
              dir={t.rtl ? 'rtl' : 'ltr'}
              className={`p-3.5 rounded-2xl border flex flex-wrap items-center gap-2.5 ${
                isDark
                  ? 'bg-slate-900/95 border-emerald-500/40 text-white'
                  : 'bg-white border-emerald-200 text-slate-900 shadow-sm'
              }`}
            >
              <span className="text-xs font-display font-extrabold text-emerald-600 dark:text-emerald-400">
                👤 {pathUi.usernameBadgeLabel}
              </span>
              <div className="relative flex-1 min-w-[200px] flex items-center">
                <input
                  type="text"
                  value={learnerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const secCheck = inspectAndGuardInput(
                      val,
                      'Dashboard Username Editor',
                      {
                        name: displayName || learnerName || 'Dashboard User',
                        email: currentUser?.email || 'Unauthenticated',
                      }
                    );
                    if (secCheck.blocked) return;
                    onChangeLearnerName(val);
                  }}
                  placeholder={pathUi.editUsernamePlaceholder}
                  className={`w-full pl-3.5 pr-9 py-2 rounded-full border text-xs sm:text-sm font-extrabold outline-none ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-400'
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
                onClick={handleVoiceUsernameCapture}
                className={`px-3.5 py-2 rounded-full text-xs font-display font-extrabold flex items-center gap-1.5 cursor-pointer ${
                  isListeningDashboardName
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-[#0066FF] hover:bg-blue-600 text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{pathUi.speakUsernameBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingDashboardName(false)}
                className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-display font-extrabold cursor-pointer"
              >
                {pathUi.saveUsernameBtn}
              </button>
            </div>
          )}

          {/* MAIN 2-COLUMN WORKSPACE: Center Column (8 cols) + Right Widgets Column (4 cols) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start flex-1">
            {/* ===============================================================
                CENTER MAIN COLUMN (8 COLS) — Shows Home Dashboard OR Active Lesson/Language/Profile View in the Exact Same Theme!
                =============================================================== */}
            <div className="xl:col-span-8 space-y-5">
              {!isHomeView && children ? (
                <div className="w-full">{children}</div>
              ) : (
                <>
                  {/* 1. SKY-BLUE HERO BANNER (Exact Visual Theme of Reference Image, 100% Learning Balloon Content) */}
                  <div
                    className={`relative rounded-[28px] p-6 sm:p-8 overflow-hidden border transition-all ${
                      isDark
                        ? 'bg-gradient-to-r from-sky-950 via-blue-950/90 to-indigo-950 border-sky-800/60'
                        : 'bg-gradient-to-r from-[#9AD0FF] via-[#BCE0FF] to-[#D9EEFF] border-sky-200/80 shadow-[0_10px_30px_rgba(0,102,255,0.08)]'
                    }`}
                  >
                    {/* Scenic Sky Clouds & Horizon Decoration inside Hero Card */}
                    <div className="pointer-events-none absolute -bottom-10 right-0 w-72 h-28 rounded-full bg-emerald-400/25 dark:bg-emerald-500/10 blur-xl" />
                    <div className="pointer-events-none absolute top-6 right-44 w-24 h-10 rounded-full bg-white/55 dark:bg-white/5 blur-md" />

                    <div
                      dir={t.rtl ? 'rtl' : 'ltr'}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-10"
                    >
                      {/* Hero Copy + CTA Button */}
                      <div className="sm:col-span-7 space-y-3">
                        {/* Target Language Selector Pill placed cleanly above greeting so it NEVER overlaps in RTL or LTR */}
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => onOpenLanguageModal('target')}
                            className={`px-4 py-1.5 rounded-full text-xs font-display font-bold inline-flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105 cursor-pointer ${
                              isDark
                                ? 'bg-slate-900/90 text-white border border-slate-700'
                                : 'bg-white/95 backdrop-blur-md text-slate-800 border border-white'
                            }`}
                          >
                            <span className="text-sm">{targetLang.flag}</span>
                            <span>
                              {t.learningLangBadge(localizedTargetLangName)}
                            </span>
                            <ChevronRight
                              className={`w-3.5 h-3.5 opacity-70 ${
                                t.rtl ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>

                        <h1
                          className={`font-display text-2xl sm:text-3xl md:text-[34px] font-extrabold tracking-tight leading-tight ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          <span>{t.heroGreeting(displayName)}</span>
                          <span className="block text-[#0066FF] dark:text-sky-400 text-lg sm:text-2xl mt-1">
                            {t.heroTitle}
                          </span>
                        </h1>

                        <p
                          className={`text-xs sm:text-sm font-medium max-w-md leading-relaxed ${
                            isDark ? 'text-slate-300' : 'text-slate-800'
                          }`}
                        >
                          {t.heroSubtitle(
                            targetLang.flag,
                            localizedTargetLangName,
                            wordsCompleted,
                            wordsTotal,
                            conversationsCompleted,
                            conversationsTotal
                          )}
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-2.5">
                          {isCourseFullyCompleted && (
                            <button
                              type="button"
                              disabled={isDownloadingCert}
                              onClick={handleDirectDownloadCertificate}
                              className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:brightness-105 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-[0_8px_24px_rgba(245,158,11,0.45)] border-2 border-white flex items-center gap-2 transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer"
                            >
                              <Download className="w-4 h-4 stroke-[2.5]" />
                              <span>
                                🎓 {certCopy.downloadCertDirectBtn}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={loadingCurriculum}
                            onClick={() => onStartStage(activeCourseStage.id)}
                            className="px-6 py-3 rounded-full bg-[#0066FF] hover:bg-blue-600 text-white font-display font-bold text-xs sm:text-sm shadow-[0_8px_20px_rgba(0,102,255,0.32)] flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                          >
                            <span>
                              {loadingCurriculum
                                ? t.loadingBalloonsBtn
                                : t.heroStartBtn}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Right Hero 3D Learning Balloon Mascot & Floating Voice Balloons (Interactive Pop Animation) */}
                      <div className="sm:col-span-5 flex items-center justify-center relative">
                        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
                          <div className="absolute inset-3 rounded-full bg-white/60 dark:bg-sky-400/15 blur-lg pointer-events-none" />
                          <AnimatePresence mode="wait">
                            {!heroBalloonPopped ? (
                              <motion.button
                                key="hero-balloon-intact"
                                type="button"
                                onClick={handlePopHeroBalloon}
                                initial={{ scale: 0.35, opacity: 0, y: 18 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{
                                  scale: [1, 1.38, 1.48, 0],
                                  opacity: [1, 1, 1, 0],
                                  transition: {
                                    duration: 0.22,
                                    times: [0, 0.45, 0.75, 1],
                                    ease: 'easeOut',
                                  },
                                }}
                                whileHover={{ scale: 1.07 }}
                                whileTap={{ scale: 1.18 }}
                                title="Tap to pop the 3D Learning Balloon!"
                                className="relative z-10 cursor-pointer focus:outline-none group flex items-center justify-center"
                              >
                                <img
                                  src="/assets/aistudio/balloon_variant.png"
                                  alt="Learning Balloon"
                                  referrerPolicy="no-referrer"
                                  className="w-32 h-36 sm:w-36 sm:h-40 object-contain animate-gentle-bob drop-shadow-[0_16px_26px_rgba(255,107,139,0.45)] transition-transform group-hover:brightness-105"
                                />
                              </motion.button>
                            ) : (
                              <motion.div
                                key="hero-balloon-popped"
                                initial={{ scale: 0.5, opacity: 1 }}
                                animate={{ scale: 1.15, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="relative z-30 w-40 h-40 flex items-center justify-center pointer-events-none"
                              >
                                {/* Radial Flash Core */}
                                <motion.div
                                  initial={{ scale: 0.2, opacity: 1 }}
                                  animate={{ scale: 2.3, opacity: 0 }}
                                  transition={{ duration: 0.35, ease: 'easeOut' }}
                                  className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-white via-yellow-200 to-pink-400 blur-xs"
                                />
                                {/* Primary Shockwave Ring */}
                                <motion.div
                                  initial={{ scale: 0.35, opacity: 1 }}
                                  animate={{ scale: 2.4, opacity: 0 }}
                                  transition={{ duration: 0.55, ease: 'easeOut' }}
                                  className="absolute w-24 h-24 rounded-full border-4 border-pink-400"
                                />
                                {/* Secondary Shockwave Ring */}
                                <motion.div
                                  initial={{ scale: 0.25, opacity: 0.9 }}
                                  animate={{ scale: 2.9, opacity: 0 }}
                                  transition={{
                                    duration: 0.68,
                                    delay: 0.05,
                                    ease: 'easeOut',
                                  }}
                                  className="absolute w-24 h-24 rounded-full border-2 border-dashed border-amber-300"
                                />
                                {/* Center POP! Badge */}
                                <motion.div
                                  initial={{ scale: 0.3, rotate: -12, opacity: 0 }}
                                  animate={{
                                    scale: [0.3, 1.35, 1.05],
                                    rotate: [-12, 8, 0],
                                    opacity: [0, 1, 0],
                                  }}
                                  transition={{ duration: 0.95, ease: 'easeOut' }}
                                  className="relative z-20 flex flex-col items-center"
                                >
                                  <span className="text-4xl drop-shadow-md">💥</span>
                                  <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-display font-black text-xs shadow-lg border border-white">
                                    POP! 🎈
                                  </span>
                                </motion.div>
                                {/* 12 Flying 3D Latex Shards & Confetti */}
                                {[
                                  0, 30, 60, 90, 120, 150, 180, 210, 240, 270,
                                  300, 330,
                                ].map((deg, idx) => {
                                  const rad = (deg * Math.PI) / 180;
                                  const dist = idx % 2 === 0 ? 84 : 62;
                                  const shardColors = [
                                    '#FF4D6D',
                                    '#FF8E53',
                                    '#FACC15',
                                    '#4ADE80',
                                    '#38BDF8',
                                    '#A855F7',
                                  ];
                                  return (
                                    <motion.span
                                      key={deg}
                                      initial={{ x: 0, y: 0, scale: 1.2, rotate: 0, opacity: 1 }}
                                      animate={{
                                        x: Math.cos(rad) * dist,
                                        y: Math.sin(rad) * dist + 18,
                                        scale: 0,
                                        rotate: deg + 200,
                                        opacity: 0,
                                      }}
                                      transition={{ duration: 0.68, ease: 'easeOut' }}
                                      style={{
                                        backgroundColor:
                                          shardColors[idx % shardColors.length],
                                      }}
                                      className={`absolute shadow-xs ${
                                        idx % 2 === 0
                                          ? 'w-4 h-2.5 rounded-tl-full rounded-br-full'
                                          : 'w-3 h-3 rounded-full'
                                      }`}
                                    />
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Floating Traveler & Conversation Badge */}
                          <div className="absolute -left-1 top-3 z-20 w-11 h-11 rounded-2xl bg-gradient-to-b from-purple-500 to-indigo-600 text-white shadow-md flex items-center justify-center font-display font-extrabold text-sm">
                            ✈️·💬
                          </div>
                          {/* Floating Voice Pop Badge */}
                          <div
                            dir={t.rtl ? 'rtl' : 'ltr'}
                            className="absolute -left-2 bottom-3 z-20 px-3 py-1 rounded-full bg-white dark:bg-slate-900 shadow-md border border-sky-200 dark:border-slate-700 flex items-center gap-1 text-[11px] font-extrabold text-rose-500"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>{t.skill1Title}</span>
                          </div>
                          {/* Floating Stars Badge */}
                          <div
                            dir={t.rtl ? 'rtl' : 'ltr'}
                            className="absolute -right-1 top-3 z-20 px-3 py-1 rounded-full bg-amber-400 text-slate-950 shadow-md flex items-center gap-1 text-[11px] font-extrabold"
                          >
                            <Star className="w-3 h-3 fill-slate-950" />
                            <span>
                              {stars} {t.starsUnit}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. CONTINUE LEARNING / ACTIVE BALLOON STAGE PROGRESS CARD */}
                  <div dir={t.rtl ? 'rtl' : 'ltr'} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-extrabold text-sm sm:text-base">
                        {t.continueStageHeading}
                      </h2>
                      <button
                        type="button"
                        onClick={() => onOpenHubTab('streak_level')}
                        className="text-xs font-bold text-[#0066FF] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        {t.seeAllStagesBtn}
                      </button>
                    </div>

                    <div
                      className={`p-3.5 sm:p-4 rounded-[22px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-[#DCEBFF] border-sky-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Interactive Poppable Balloon Stage Thumbnail */}
                        <button
                          type="button"
                          onClick={handlePopStageThumb}
                          title="Tap to pop!"
                          className="w-28 h-18 sm:w-32 sm:h-20 rounded-2xl bg-gradient-to-br from-[#7CC2FF] via-[#38BDF8] to-[#0066FF] flex items-center justify-center relative overflow-hidden shrink-0 shadow-xs border-2 border-white/80 cursor-pointer group"
                        >
                          <AnimatePresence mode="wait">
                            {!stageThumbPopped ? (
                              <motion.img
                                key="thumb-intact"
                                src="/assets/aistudio/balloon_variant.png"
                                alt=""
                                referrerPolicy="no-referrer"
                                initial={{ scale: 0.4, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{
                                  scale: [1, 1.4, 0],
                                  opacity: [1, 1, 0],
                                  transition: { duration: 0.18 },
                                }}
                                className="w-10 h-12 object-contain drop-shadow transition-transform group-hover:scale-110"
                              />
                            ) : (
                              <motion.div
                                key="thumb-popped"
                                initial={{ scale: 0.5, opacity: 1 }}
                                animate={{ scale: 1.3, opacity: 0 }}
                                transition={{ duration: 0.55, ease: 'easeOut' }}
                                className="relative flex items-center justify-center"
                              >
                                <span className="text-2xl">💥</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <span className="absolute bottom-1 right-1.5 text-sm">
                            {targetLang.flag}
                          </span>
                        </button>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="font-display font-extrabold text-sm sm:text-base truncate">
                            {isCourseFullyCompleted
                              ? `🎓 ${certCopy.completedCertReadyBadge}`
                              : `${activeCourseStage.iconEmoji} ${activeCourseStage.title}`}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {activeCourseStage.subtitle}
                          </div>
                          <div className="flex items-center gap-3 pt-1.5">
                            <div className="flex-1 max-w-xs h-2.5 rounded-full bg-white/80 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isCourseFullyCompleted
                                    ? 'bg-emerald-500'
                                    : 'bg-[#0066FF]'
                                }`}
                                style={{
                                  width: `${
                                    isCourseFullyCompleted
                                      ? 100
                                      : Math.max(8, activeCourseStage.pct)
                                  }%`,
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {isCourseFullyCompleted
                                ? '100%'
                                : `${activeCourseStage.pct}%`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {isCourseFullyCompleted && (
                          <>
                            <button
                              type="button"
                              disabled={isDownloadingCert}
                              onClick={handleDirectDownloadCertificate}
                              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:brightness-105 text-slate-950 font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(245,158,11,0.4)] border-2 border-white cursor-pointer whitespace-nowrap transition-transform hover:scale-[1.02] active:scale-95"
                            >
                              <Download className="w-4 h-4 stroke-[2.5]" />
                              <span>🎓 {certCopy.downloadCertDirectBtn}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenHubTab('certificate')}
                              className="px-3.5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>{t.certCardTitle}</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => onStartStage(activeCourseStage.id)}
                          className="px-6 py-2.5 rounded-full bg-[#0066FF] hover:bg-blue-600 text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{t.startPracticeBtn}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. FOUR PASTEL BALLOON LEARNING SKILL CARDS */}
                  <div dir={t.rtl ? 'rtl' : 'ltr'} className="space-y-2.5">
                    <h2 className="font-display font-extrabold text-sm sm:text-base">
                      {t.skillsHeading}
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Skill 1: 90 Conversation Topics Path (Soft Purple) */}
                      <button
                        type="button"
                        onClick={() => onStartStage('CONVERSATION_GAME')}
                        className={`p-3.5 rounded-2xl border text-left transition-transform hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between gap-2 ${
                          isDark
                            ? 'bg-purple-950/35 border-purple-800/50 hover:border-purple-500'
                            : 'bg-[#EFE7FF] border-purple-100 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-[#9B72FF] text-white flex items-center justify-center shrink-0">
                            <Volume2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                              {t.navConversation}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              90 · 15/15
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end text-[11px] font-bold text-purple-600 dark:text-purple-300 pt-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {/* Skill 2: Live Mic Speaking (Soft Coral/Pink) */}
                      <button
                        type="button"
                        onClick={() => onStartStage(activeCourseStage.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-transform hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between gap-2 ${
                          isDark
                            ? 'bg-rose-950/35 border-rose-800/50 hover:border-rose-500'
                            : 'bg-[#FFE6E2] border-rose-100 hover:border-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-[#FF6B5B] text-white flex items-center justify-center shrink-0">
                            <Mic className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                              {t.skill4Title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t.skill4Sub(currentLevelNumber)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end text-[11px] font-bold text-rose-600 dark:text-rose-300 pt-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {/* Skill 3: Vocabulary Words (Soft Mint Green) */}
                      <button
                        type="button"
                        onClick={() => onStartStage('WORDS_GAME')}
                        className={`p-3.5 rounded-2xl border text-left transition-transform hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between gap-2 ${
                          isDark
                            ? 'bg-emerald-950/35 border-emerald-800/50 hover:border-emerald-500'
                            : 'bg-[#E0F8E3] border-emerald-100 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-[#34C759] text-white flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                              {t.skill2Title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t.skill2Sub(wordsCompleted, wordsTotal)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end text-[11px] font-bold text-emerald-600 dark:text-emerald-300 pt-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {/* Skill 4: Sentence Builder & Conversation (Soft Warm Peach) */}
                      <button
                        type="button"
                        onClick={() => onStartStage('CONVERSATION_GAME')}
                        className={`p-3.5 rounded-2xl border text-left transition-transform hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between gap-2 ${
                          isDark
                            ? 'bg-amber-950/35 border-amber-800/50 hover:border-amber-500'
                            : 'bg-[#FFF0D6] border-amber-100 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-[#FF9F1C] text-white flex items-center justify-center shrink-0">
                            <Puzzle className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                              {t.skill3Title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t.skill3Sub(
                                conversationsCompleted,
                                conversationsTotal
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end text-[11px] font-bold text-amber-600 dark:text-amber-300 pt-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 4. POPULAR LANGUAGES STRIP (With Instant Spoken Language / Learning Language Toggle) */}
                  <div dir={t.rtl ? 'rtl' : 'ltr'} className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display font-extrabold text-sm sm:text-base">
                          {t.languagesHeading}
                        </h2>
                        <div
                          className={`inline-flex p-0.5 rounded-full border text-[11px] font-bold ${
                            isDark
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200/80'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setLangStripMode('native')}
                            className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                              langStripMode === 'native'
                                ? 'bg-[#0066FF] text-white'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                            }`}
                          >
                            🗣️ {t.spokenLangBadge(nativeLang.nativeName)}
                          </button>
                          <button
                            type="button"
                            onClick={() => setLangStripMode('target')}
                            className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                              langStripMode === 'target'
                                ? 'bg-[#0066FF] text-white'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                            }`}
                          >
                            🎯 {t.learningLangBadge(targetLang.nativeName)}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenLanguageModal(langStripMode)}
                        className="text-xs font-bold text-[#0066FF] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        {t.seeAllLangsBtn}
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5">
                      {popularLanguages.map((lang, idx) => {
                        const isSelected =
                          langStripMode === 'native'
                            ? lang.code === nativeLang.code
                            : lang.code === targetLang.code;
                        const rating = idx % 2 === 0 ? '4.9' : '4.8';
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              if (langStripMode === 'native') {
                                onSelectNativeLang(lang);
                              } else {
                                onSelectTargetLang(lang);
                              }
                            }}
                            className={`px-3.5 py-2.5 rounded-2xl border flex items-center gap-2.5 shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? isDark
                                  ? 'bg-sky-950/60 border-sky-400 shadow-xs'
                                  : 'bg-[#E3F2FD] border-[#0066FF] shadow-xs'
                                : isDark
                                ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <span className="text-xl leading-none">
                              {lang.flag}
                            </span>
                            <div className="text-left">
                              <div className="font-display font-bold text-xs sm:text-sm leading-tight">
                                {lang.nativeName}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <span>{rating}</span>
                                <Star className="w-2.5 h-2.5 fill-[#0066FF] text-[#0066FF]" />
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => onOpenLanguageModal(langStripMode)}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 5. CENTER OFFICIAL LANGUAGE DIPLOMA / CERTIFICATE MILESTONE CARD */}
                  <div
                    dir={t.rtl ? 'rtl' : 'ltr'}
                    onClick={() =>
                      onOpenHubTab(
                        isCourseFullyCompleted ? 'certificate' : 'streak_level'
                      )
                    }
                    className={`p-4 sm:p-5 rounded-[24px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-transform hover:scale-[1.005] ${
                      isDark
                        ? 'bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border-sky-800/60'
                        : 'bg-gradient-to-r from-[#D4EAFF] to-[#E5F2FF] border-sky-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {isCourseFullyCompleted && certThumbDataUrl ? (
                        <img
                          src={certThumbDataUrl}
                          alt="Localized Certificate Preview"
                          referrerPolicy="no-referrer"
                          className="w-20 h-14 object-cover rounded-xl border-2 border-amber-400 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/25 border border-amber-400/40 flex items-center justify-center shrink-0">
                          <Gift className="w-6 h-6 text-amber-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {isCourseFullyCompleted
                            ? t.certRewardUnlockedDesc(localizedTargetLangName)
                            : t.certRewardLockedDesc(localizedTargetLangName)}
                        </div>
                        <div className="font-display font-extrabold text-xs sm:text-base truncate">
                          {t.certRewardTitle} ({nativeLang.nativeName}) 🎓
                        </div>
                        <div className="flex items-center gap-3 pt-0.5">
                          <div className="flex-1 max-w-md h-2 rounded-full bg-white/80 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#0066FF]"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((stagesCompletedCount / 2) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                          <span
                            className="text-[11px] font-mono font-bold shrink-0"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {t.stagesCompletedLabel(stagesCompletedCount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isCourseFullyCompleted && (
                      <button
                        type="button"
                        disabled={isDownloadingCert}
                        onClick={handleDirectDownloadCertificate}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:brightness-105 text-slate-950 font-display font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm border border-white cursor-pointer shrink-0"
                      >
                        <Download className="w-4 h-4 stroke-[2.5]" />
                        <span>🎓 {certCopy.downloadCertDirectBtn}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ===============================================================
                RIGHT SIDEBAR COLUMN (4 COLS: Daily Streak Ring + Star Leaderboard + Compact Achievements)
                =============================================================== */}
            <div dir={t.rtl ? 'rtl' : 'ltr'} className="xl:col-span-4 space-y-4">
              {/* WIDGET 1: DAILY STREAK GOAL RING + 7-DAY CHECKMARKS */}
              <div
                onClick={() => onOpenHubTab('streak_level')}
                className={`p-4 sm:p-5 rounded-[24px] border cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200/70 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-extrabold text-sm sm:text-base">
                    {t.dailyGoalHeading}
                  </h3>
                  <span className="text-[11px] font-bold text-[#0066FF] dark:text-sky-400">
                    {t.streakDaysCount(streakDays)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Circular SVG Ring Gauge */}
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r={circleRadius}
                        fill="transparent"
                        stroke={isDark ? '#1E293B' : '#E2E8F0'}
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={circleRadius}
                        fill="transparent"
                        stroke="#0066FF"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={circleStrokeOffset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <Flame className="w-4 h-4 fill-orange-500 text-orange-500 mb-0.5" />
                      <span
                        dir="ltr"
                        className="font-display font-extrabold text-xs sm:text-sm leading-none"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {streakDays} / {streakGoalDays}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {t.todayPracticeLabel}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-display font-extrabold text-xs sm:text-sm">
                      {t.goalGreatJobTitle}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t.goalStreakDesc(streakDays, streakGoalDays)}
                    </p>
                  </div>
                </div>

                {/* 7-Day Week Checkmarks (Starts from the exact weekday the learner logged in / started their streak!) */}
                <div className="grid grid-cols-7 gap-1 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
                  {(() => {
                    // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat -> convert to t.weekDaysShort index (0=Mon .. 6=Sun)
                    const todayMonZeroIdx = (new Date().getDay() + 6) % 7;
                    const cycleDaysFilled = Math.min(
                      7,
                      Math.max(1, ((Math.max(1, streakDays) - 1) % 7) + 1)
                    );
                    // The weekday on which this 7-day streak cycle started (e.g. if today is Sunday and streakDays=1, starts on Sunday!)
                    const startWeekdayIdx =
                      (todayMonZeroIdx - (cycleDaysFilled - 1) + 7) % 7;

                    return [0, 1, 2, 3, 4, 5, 6].map((slotIdx) => {
                      const weekdayIdx = (startWeekdayIdx + slotIdx) % 7;
                      const dayLabel = t.weekDaysShort[weekdayIdx];
                      const isChecked = slotIdx < cycleDaysFilled;
                      const isTodaySlot = slotIdx === cycleDaysFilled - 1;

                      return (
                        <div
                          key={slotIdx}
                          className="flex flex-col items-center gap-1"
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                              isChecked
                                ? isTodaySlot
                                  ? 'bg-[#0066FF] text-white ring-2 ring-sky-400/70 shadow-xs scale-105'
                                  : 'bg-[#0066FF] text-white'
                                : isDark
                                ? 'bg-slate-800 text-slate-500'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isChecked ? <Check className="w-3.5 h-3.5" /> : null}
                          </div>
                          <span
                            className={`text-[10px] truncate max-w-[42px] ${
                              isTodaySlot
                                ? 'text-[#0066FF] dark:text-sky-400 font-extrabold'
                                : isChecked
                                ? 'text-slate-700 dark:text-slate-200 font-bold'
                                : 'text-slate-400 font-medium'
                            }`}
                          >
                            {dayLabel}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Daily Login Balloon Bonus Banner inside Daily Goal Card */}
                {onOpenDailyBalloonBonus && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDailyBalloonBonus();
                    }}
                    className={`mt-3.5 w-full py-2.5 px-3.5 rounded-2xl border flex items-center justify-between gap-2 font-display font-extrabold text-xs transition-all cursor-pointer ${
                      !dailyBonusClaimedToday
                        ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 border-amber-300 text-slate-950 shadow-sm hover:brightness-105'
                        : isDark
                        ? 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-950/60'
                        : 'bg-amber-50/90 border-amber-200 text-amber-900 hover:bg-amber-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none">🎈</span>
                      <span className="truncate">
                        {!dailyBonusClaimedToday
                          ? nativeLang.code === 'ur'
                            ? 'آج کا ڈیلی بلون بونس پاپ کریں!'
                            : nativeLang.code === 'hi'
                            ? 'आज का डेली बैलून बोनस फोड़ें!'
                            : 'Pop Your Daily Balloon Bonus!'
                          : nativeLang.code === 'ur'
                          ? 'آج کا بلون بونس وصول ہو گیا ✓'
                          : nativeLang.code === 'hi'
                          ? 'आज का बैलून बोनस मिल गया ✓'
                          : 'Daily Balloon Bonus Claimed ✓'}
                      </span>
                    </div>
                    <span
                      dir="ltr"
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                        !dailyBonusClaimedToday
                          ? 'bg-slate-950 text-amber-300'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                      }`}
                    >
                      +{dailyBonusStarsAmount} ⭐
                    </span>
                  </button>
                )}
              </div>

              {/* WIDGET 2: STAR CHAMPIONS LEADERBOARD (With "You" Highlighted) */}
              <div
                className={`p-4 sm:p-5 rounded-[24px] border ${
                  isDark
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200/70 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-extrabold text-sm sm:text-base">
                    {t.leaderboardHeading}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onOpenHubTab('leaderboard')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.thisWeekBadge}
                  </button>
                </div>

                <div className="space-y-2">
                  {dashboardLeaders.map((item, idx) => {
                    const rank = idx + 1;
                    return (
                      <div
                        key={item.id}
                        onClick={() => onOpenHubTab('leaderboard')}
                        className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          item.isYou
                            ? isDark
                              ? 'bg-sky-500/20 border border-sky-500/40'
                              : 'bg-[#DCEBFF]'
                            : isDark
                            ? 'hover:bg-slate-800/60'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                              rank === 1
                                ? 'bg-amber-400 text-slate-950'
                                : rank === 2
                                ? 'bg-slate-300 text-slate-900'
                                : rank === 3
                                ? 'bg-orange-400 text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            {rank}
                          </span>
                          <div
                            className={`w-7 h-7 rounded-full bg-gradient-to-br ${item.avatarBg} text-white font-display font-bold text-[10px] flex items-center justify-center shrink-0`}
                          >
                            {item.initials}
                          </div>
                          <span
                            className={`font-display text-xs sm:text-sm truncate ${
                              item.isYou
                                ? 'font-extrabold text-[#0066FF] dark:text-sky-400'
                                : 'font-semibold'
                            }`}
                          >
                            {item.name} {rank === 1 ? '👑' : ''}
                          </span>
                        </div>

                        <span
                          dir="ltr"
                          className="text-xs font-mono font-bold text-amber-500 flex items-center gap-1 shrink-0"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {item.stars}
                        </span>
                      </div>
                    );
                  })}
                  <div className="pt-1 text-[11px] font-semibold text-slate-400 text-center">
                    {t.noOtherLearnersNotice}
                  </div>
                </div>
              </div>

              {/* WIDGET 2.5: COMPACT MILESTONE ACHIEVEMENTS & VISUAL BADGES (Clicks open full 30 Achievements modal) */}
              <div
                onClick={() => onOpenHubTab('achievements')}
                className={`p-4 sm:p-5 rounded-[24px] border cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200/70 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{t.navAchievements}</span>
                  </h3>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 ${
                      t.rtl ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Badge 1: 10 Words Mastered */}
                  <div
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                      wordsCompleted >= 10
                        ? isDark
                          ? 'bg-emerald-950/40 border-emerald-500/50'
                          : 'bg-emerald-50 border-emerald-200'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-800 opacity-75'
                        : 'bg-slate-50 border-slate-200/70 opacity-80'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        wordsCompleted >= 10
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="text-[10px] font-bold leading-tight line-clamp-1">
                      {nativeLang.code === 'ur'
                        ? '10 الفاظ'
                        : nativeLang.code === 'fa'
                        ? '۱۰ واژه'
                        : nativeLang.code === 'fr'
                        ? '10 Mots'
                        : nativeLang.code === 'hi'
                        ? '10 शब्द'
                        : '10 Words'}
                    </div>
                  </div>

                  {/* Badge 2: 5 Day Streak */}
                  <div
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                      streakDays >= 5
                        ? isDark
                          ? 'bg-amber-950/40 border-amber-500/50'
                          : 'bg-amber-50 border-amber-200'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-800 opacity-75'
                        : 'bg-slate-50 border-slate-200/70 opacity-80'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        streakDays >= 5
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="text-[10px] font-bold leading-tight line-clamp-1">
                      {nativeLang.code === 'ur'
                        ? '5 دن اسٹریک'
                        : nativeLang.code === 'fa'
                        ? '۵ روز پیاپی'
                        : nativeLang.code === 'fr'
                        ? 'Série 5J'
                        : nativeLang.code === 'hi'
                        ? '5 दिन स्ट्रीक'
                        : '5 Day Streak'}
                    </div>
                  </div>

                  {/* Badge 3: First Certificate Earned */}
                  <div
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                      isCourseFullyCompleted
                        ? isDark
                          ? 'bg-indigo-950/40 border-indigo-400/50'
                          : 'bg-sky-50 border-sky-200'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-800 opacity-75'
                        : 'bg-slate-50 border-slate-200/70 opacity-80'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isCourseFullyCompleted
                          ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-indigo-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="text-[10px] font-bold leading-tight line-clamp-1">
                      {nativeLang.code === 'ur'
                        ? 'فرسٹ سرٹیفکیٹ'
                        : nativeLang.code === 'fa'
                        ? 'گواهینامه اول'
                        : nativeLang.code === 'fr'
                        ? 'Certificat'
                        : nativeLang.code === 'hi'
                        ? 'सर्टिफिकेट'
                        : 'Certificate'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
