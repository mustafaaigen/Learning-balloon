'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Mic,
  Volume2,
  Star,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Award,
  Globe,
  AlertCircle,
  Loader2,
  MessageCircle,
  ListFilter,
  X,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Puzzle,
  Lock,
  Flame,
  ShieldCheck,
  LogIn,
  LogOut,
  UserCheck,
  QrCode,
  Calendar,
  Sun,
  Moon,
  Download,
  Gift,
} from 'lucide-react';
import {
  WORLD_LANGUAGES,
  LanguageInfo,
  LanguageCurriculum,
  ConversationItem,
  BALLOON_COLORS,
  getConversationsForLanguage,
} from '@/lib/languages';
import { getUIPrompts } from '@/lib/ui-translations';
import { getBuiltInCurriculum } from '@/lib/curricula-extra';
import {
  getSharedAudioContext,
  playBalloonSwirlSound,
  playBalloonPopSound,
  triggerBalloonPopVibration,
  playMicStartChime,
  playStarRewardFanfare,
  playGentleRetryTone,
  pronounceText,
  preloadPronounceText,
  setStudioVoicePersona,
  setAudioPlaybackSpeed,
} from '@/lib/audio-engine';
import {
  auth,
  onAuthStateChanged,
  User,
  DifficultyLevel,
  BOOTSTRAPPED_ADMIN_EMAIL,
  isUserAdmin,
  signInWithGooglePopup,
  signOutLearner,
  getTodayDateString,
  getYesterdayDateString,
  syncLearnerProfileToFirestore,
} from '@/lib/firebase-client';
import GameWorldBackdrop from './GameWorldBackdrop';
import BalloonGraphic, { CarouselBalloonItem } from './BalloonGraphic';
import LanguageSelectionScreen, {
  OnboardingStepId,
} from './LanguageSelectionScreen';
import InlineConversationWordAssembler from './DuolingoBuilderStage';
import AdminStreakCertificateModal from './AdminStreakCertificateModal';
import LearningBalloonDashboard from './LearningBalloonDashboard';
import ConversationTopicPath from './ConversationTopicPath';
import {
  NINETY_CONVERSATION_TOPICS,
  ROUNDS_PER_TOPIC,
  getNinetyPlusConversationsForLang,
  getSentencesForTopicRound,
  getTopicPathUICopy,
  localizeUsernameForSpokenLanguage,
} from '@/lib/conversation-topics-90';
import { getDashboardTranslations } from '@/lib/dashboard-translations';
import {
  CertificateLanguageMode,
  getCertificateCopyForLang,
} from '@/lib/certificate-translations';
import {
  renderLocalizedCertificateCanvas,
  downloadLocalizedCertificatePdf,
} from '@/lib/certificate-renderer';
import {
  getOnboardingWizardCopy,
  OnboardingProfileData,
} from '@/lib/onboarding-translations';
import {
  SecurityIncident,
  getSecurityIncidents,
  inspectAndGuardInput,
  attachGlobalSecurityMonitors,
  subscribeToSecurityIncidents,
} from '@/lib/security-monitor';

type GameScreenState =
  | 'AUTH_ONBOARDING'
  | 'LANGUAGE_SELECT'
  | 'WORLD_START'
  | 'ALPHABET_GAME'
  | 'WORDS_GAME'
  | 'CONVERSATION_GAME'
  | 'REVIEW_GAME'
  | 'VICTORY_CELEBRATION';

export interface ReviewMistakeItem {
  id: string;
  kind: 'word' | 'phrase';
  mainText: string;
  pronunciation: string;
  nativeMeaning: string;
  englishMeaning: string;
  acceptedMatches: string[];
  color: string;
  icon?: string;
  situation?: string;
  wrongHeardSample?: string;
  mistakeCount: number;
}

type LessonPhase =
  | 'swirling'
  | 'speaking'
  | 'mic_ready'
  | 'listening'
  | 'verifying'
  | 'celebrating'
  | 'retry';

const STORAGE_KEY = 'balloony_lang_prefs_v3';
const THEME_STORAGE_KEY = 'balloony_theme_dark_v1';
const PROGRESS_STORAGE_KEY = 'balloony_progress_v1';
const ONBOARDING_STORAGE_KEY = 'balloony_onboarding_wizard_v3';
const DAILY_BALLOON_BONUS_KEY = 'balloony_daily_balloon_bonus_v1';
const DAILY_STREAK_LEDGER_KEY = 'balloony_daily_streak_ledger_v3';
const DAILY_BONUS_TIERS = [15, 20, 25, 30, 35, 45, 60] as const;

export default function LanguageGameApp({
  initialAdminCommand = false,
}: {
  initialAdminCommand?: boolean;
} = {}) {
  const [nativeLang, setNativeLang] = useState<LanguageInfo>(
    () => WORLD_LANGUAGES.find((l) => l.code === 'en') || WORLD_LANGUAGES[0]
  );
  const [targetLang, setTargetLang] = useState<LanguageInfo>(
    () => WORLD_LANGUAGES.find((l) => l.code === 'fr') || WORLD_LANGUAGES[0]
  );
  const [hasSavedLangs, setHasSavedLangs] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Start on 5-Step Onboarding Wizard (LANGUAGE_SELECT) -> Sign-In (AUTH_ONBOARDING) -> 3-Column Learning Balloon Dashboard (WORLD_START)
  const [screen, setScreen] = useState<GameScreenState>('LANGUAGE_SELECT');
  const [langModalInitialStep, setLangModalInitialStep] =
    useState<OnboardingStepId>('native');
  const [curriculum, setCurriculum] = useState<LanguageCurriculum>(
    () => getBuiltInCurriculum('fr') || getBuiltInCurriculum('en')!
  );
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  // Lesson state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<LessonPhase>('swirling');
  const [stars, setStars] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [heardTranscript, setHeardTranscript] = useState('');
  const [isMistake, setIsMistake] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [poppedByMode, setPoppedByMode] = useState<Record<string, number[]>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [convStepModeOverride, setConvStepModeOverride] = useState<
    'auto' | 'assemble' | 'voice'
  >('auto');
  const [lockNotice, setLockNotice] = useState<string>('');
  const lockNoticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Daily Streak, Difficulty Level (Easy -> Medium -> Hard), Certificate & Admin State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [learnerName, setLearnerName] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>(getTodayDateString());
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [onboardingError, setOnboardingError] = useState<string>('');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('easy');
  const [streakDays, setStreakDays] = useState<number>(1);
  const [streakGoalDays, setStreakGoalDays] = useState<number>(7);
  const [lastActiveDate, setLastActiveDate] = useState<string>(getTodayDateString());
  const [adminCommandUnlocked, setAdminCommandUnlocked] =
    useState<boolean>(false);
  const [hubModalOpen, setHubModalOpen] = useState<boolean>(false);
  const [hubModalTab, setHubModalTab] = useState<
    | 'streak_level'
    | 'achievements'
    | 'leaderboard'
    | 'analytics'
    | 'certificate'
    | 'admin'
  >('streak_level');
  const [certLanguageMode, setCertLanguageMode] =
    useState<CertificateLanguageMode>('spoken');
  const [signInCustomQrText, setSignInCustomQrText] = useState<string>('');
  const [signInCertPreviewUrl, setSignInCertPreviewUrl] = useState<string>('');
  const [signInQrPreviewUrl, setSignInQrPreviewUrl] = useState<string>('');
  const commandBufferRef = useRef<string>('');

  // 90-Topic, 5-Round Conversation Path & Step-by-Step + Admin Unlock State
  const [convViewMode, setConvViewMode] = useState<'PATH' | 'ROUND_PLAY'>('PATH');
  const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);
  const [activeRoundNumber, setActiveRoundNumber] = useState<number>(1);
  const [topicRoundsByLang, setTopicRoundsByLang] = useState<
    Record<string, Record<number, number>>
  >({});
  const [claimedChests, setClaimedChests] = useState<number[]>([]);
  const [adminUnlockedWordsCount, setAdminUnlockedWordsCount] = useState<number>(1);
  const [adminUnlockedTopicsCount, setAdminUnlockedTopicsCount] = useState<number>(1);
  const [lastCompletedBanner, setLastCompletedBanner] = useState<string>('');
  const [onboardingData, setOnboardingData] = useState<OnboardingProfileData>({
    referralSource: 'youtube',
    proficiencyType: 'scratch',
    conversationAbility: 'level_1_basic',
    motivation: 'travel',
    dailyMinutes: 10,
    completedAt: '',
  });
  const [goalAchievedModal, setGoalAchievedModal] = useState<{
    days: number;
    nextGoal: number;
  } | null>(null);
  // Daily 'Balloon Bonus' State (First Login Each Day Extra Stars Reward)
  const [dailyBonusModalOpen, setDailyBonusModalOpen] = useState<boolean>(false);
  const [dailyBonusClaimedDate, setDailyBonusClaimedDate] = useState<string>('');
  const [dailyBonusPoppedIndex, setDailyBonusPoppedIndex] = useState<
    number | null
  >(null);
  const [dailyBonusAwardedStars, setDailyBonusAwardedStars] =
    useState<number>(15);
  const [handHoldingTeacherOverride, setHandHoldingTeacherOverride] = useState<
    boolean | null
  >(null);
  const [activeTeacherChunkIdx, setActiveTeacherChunkIdx] = useState<number | null>(
    null
  );
  const sessionPopCountRef = useRef<number>(0);
  const hasHydratedProgressRef = useRef<boolean>(false);

  // Daily Session Mistake Review Mode State
  const [sessionMistakes, setSessionMistakes] = useState<ReviewMistakeItem[]>([]);
  const sessionMistakesRef = useRef<ReviewMistakeItem[]>([]);

  // Real-Time Anti-Hack & Intrusion Detection Alert State
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>(
    () => getSecurityIncidents()
  );
  const [activeSecurityAlert, setActiveSecurityAlert] =
    useState<SecurityIncident | null>(null);

  useEffect(() => {
    const unsub = subscribeToSecurityIncidents((updated) => {
      setSecurityIncidents(updated);
      if (updated.length > 0 && !updated[0].readByAdmin) {
        setActiveSecurityAlert(updated[0]);
      }
    });
    const detachMonitors = attachGlobalSecurityMonitors(
      () => ({
        name: learnerName || currentUser?.displayName || 'Visitor',
        email: currentUser?.email || 'Unauthenticated',
      }),
      (incident) => {
        setActiveSecurityAlert(incident);
      }
    );
    return () => {
      unsub();
      detachMonitors();
    };
  }, [learnerName, currentUser?.displayName, currentUser?.email]);

  useEffect(() => {
    sessionMistakesRef.current = sessionMistakes;
  }, [sessionMistakes]);
  const [reviewReturnScreen, setReviewReturnScreen] = useState<
    'WORDS_GAME' | 'CONVERSATION_GAME' | 'WORLD_START'
  >('WORLD_START');

  const isAdminUser = isUserAdmin(currentUser);
  const signInCertCopy = useMemo(
    () => getCertificateCopyForLang(nativeLang),
    [nativeLang]
  );
  const obCopy = useMemo(
    () => getOnboardingWizardCopy(nativeLang),
    [nativeLang]
  );

  // Persistent refs so microphone permission is ONLY requested ONCE and never garbage-collected
  const activeLessonIdRef = useRef(0);
  const persistentStreamRef = useRef<MediaStream | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const listenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interimMatchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mistakeSettleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentRmsLevelRef = useRef<number>(0);

  const prompts = useMemo(() => getUIPrompts(nativeLang.code), [nativeLang.code]);
  const dashT = useMemo(() => getDashboardTranslations(nativeLang), [nativeLang]);
  const pathCopy = useMemo(() => getTopicPathUICopy(nativeLang), [nativeLang]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next ? '1' : '0');
        document.documentElement.classList.toggle('dark', next);
      } catch {}
      return next;
    });
  }, []);

  // 90+ localized conversation sentences across 90 Traveler-to-Resident topics
  const conversationsList = useMemo<ConversationItem[]>(() => {
    const base =
      curriculum.conversations && curriculum.conversations.length > 0
        ? curriculum.conversations
        : getConversationsForLanguage(targetLang.code);
    return getNinetyPlusConversationsForLang(targetLang, base);
  }, [curriculum.conversations, targetLang]);

  // Load curriculum for a target language
  const loadCurriculumForTarget = useCallback(
    async (native: LanguageInfo, target: LanguageInfo) => {
      const builtIn = getBuiltInCurriculum(target.code);
      if (builtIn) {
        setCurriculum(builtIn);
        builtIn.words.slice(0, 3).forEach((item) => {
          preloadPronounceText(item.word, target.bcp47, target.name);
        });
        getConversationsForLanguage(target.code)
          .slice(0, 3)
          .forEach((item) => {
            preloadPronounceText(item.phrase, target.bcp47, target.name);
          });
        return;
      }

      setLoadingCurriculum(true);
      try {
        const res = await fetch('/api/curriculum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLangName: target.name,
            targetLangCode: target.code,
            nativeLangName: native.name,
            nativeLangCode: native.code,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.alphabet?.length > 0) {
            setCurriculum(data);
            data.alphabet.slice(0, 3).forEach((item: any) => {
              preloadPronounceText(
                item.ttsPrompt || item.letter,
                target.bcp47,
                target.name
              );
            });
            setLoadingCurriculum(false);
            return;
          }
        }
      } catch {
        // Fallback to built-in curriculum
      }
      setCurriculum(getBuiltInCurriculum('en')!);
      setLoadingCurriculum(false);
    },
    []
  );

  // Restore saved language selection, progress, streak, level, and theme from localStorage asynchronously
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setStudioVoicePersona('Giusy');
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === '1') {
          setIsDark(true);
          document.documentElement.classList.add('dark');
        }
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();
        const savedProg = localStorage.getItem(PROGRESS_STORAGE_KEY);
        if (savedProg) {
          const parsedProg = JSON.parse(savedProg);
          if (typeof parsedProg.stars === 'number') {
            setStars(parsedProg.stars);
          }
          if (
            parsedProg.poppedByMode &&
            typeof parsedProg.poppedByMode === 'object'
          ) {
            setPoppedByMode(parsedProg.poppedByMode);
          }
          if (typeof parsedProg.learnerName === 'string' && parsedProg.learnerName.trim()) {
            const cleanedSavedName = parsedProg.learnerName
              .replace(/\s*\(Learning Balloon\)\s*/gi, '')
              .replace(/\s*Learning Balloon Learner\s*/gi, '')
              .replace(/\s*Learning Balloon Student\s*/gi, '')
              .replace(/\s*Family Learner\s*/gi, '')
              .trim();
            if (cleanedSavedName) {
              setLearnerName(cleanedSavedName);
            }
          }
          if (
            typeof parsedProg.completionDate === 'string' &&
            parsedProg.completionDate.trim()
          ) {
            setCompletionDate(parsedProg.completionDate.trim());
          }
          if (
            parsedProg.difficultyLevel === 'easy' ||
            parsedProg.difficultyLevel === 'medium' ||
            parsedProg.difficultyLevel === 'hard'
          ) {
            setDifficultyLevel(parsedProg.difficultyLevel);
          }
          if (typeof parsedProg.streakGoalDays === 'number' && parsedProg.streakGoalDays >= 1) {
            setStreakGoalDays(parsedProg.streakGoalDays);
          }
          if (
            parsedProg.certLanguageMode === 'spoken' ||
            parsedProg.certLanguageMode === 'bilingual'
          ) {
            setCertLanguageMode(parsedProg.certLanguageMode);
          } else {
            setCertLanguageMode('spoken');
          }
          if (
            parsedProg.topicRoundsByLang &&
            typeof parsedProg.topicRoundsByLang === 'object'
          ) {
            setTopicRoundsByLang(parsedProg.topicRoundsByLang);
          }
          if (Array.isArray(parsedProg.claimedChests)) {
            setClaimedChests(parsedProg.claimedChests);
          }
          if (
            typeof parsedProg.adminUnlockedWordsCount === 'number' &&
            parsedProg.adminUnlockedWordsCount >= 1
          ) {
            setAdminUnlockedWordsCount(parsedProg.adminUnlockedWordsCount);
          }
          if (
            typeof parsedProg.adminUnlockedTopicsCount === 'number' &&
            parsedProg.adminUnlockedTopicsCount >= 1
          ) {
            setAdminUnlockedTopicsCount(parsedProg.adminUnlockedTopicsCount);
          }

          if (
            parsedProg.onboardingData &&
            typeof parsedProg.onboardingData === 'object'
          ) {
            setOnboardingData(parsedProg.onboardingData);
          }

          const savedStreak =
            typeof parsedProg.streakDays === 'number' && parsedProg.streakDays >= 0
              ? parsedProg.streakDays
              : 1;
          const savedGoal =
            typeof parsedProg.streakGoalDays === 'number' &&
            parsedProg.streakGoalDays >= 1
              ? parsedProg.streakGoalDays
              : 7;
          const savedLastDate =
            typeof parsedProg.lastActiveDate === 'string'
              ? parsedProg.lastActiveDate
              : today;

          // Check if the learner already has prior gameplay activity (played yesterday + playing today)
          const hasPriorPoppedItems =
            parsedProg.poppedByMode &&
            typeof parsedProg.poppedByMode === 'object' &&
            Object.values(parsedProg.poppedByMode).some(
              (arr) => Array.isArray(arr) && arr.length > 0
            );
          const hasPriorRounds =
            parsedProg.topicRoundsByLang &&
            typeof parsedProg.topicRoundsByLang === 'object' &&
            Object.keys(parsedProg.topicRoundsByLang).length > 0;
          const hasPriorActivity =
            (typeof parsedProg.stars === 'number' && parsedProg.stars > 0) ||
            Boolean(hasPriorPoppedItems) ||
            Boolean(hasPriorRounds) ||
            localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1';

          let nextAutoStreak = savedStreak;
          let resolvedGoal = savedGoal;
          let shouldShowMilestoneModal = false;

          try {
            const rawLedger = localStorage.getItem(DAILY_STREAK_LEDGER_KEY);
            if (rawLedger) {
              const parsedLedger = JSON.parse(rawLedger);
              const ledgerStreak =
                typeof parsedLedger?.streakDays === 'number' &&
                parsedLedger.streakDays >= 1
                  ? parsedLedger.streakDays
                  : savedStreak;
              const ledgerLastInc =
                typeof parsedLedger?.lastIncrementDate === 'string'
                  ? parsedLedger.lastIncrementDate
                  : savedLastDate;
              const ledgerDates: string[] = Array.isArray(
                parsedLedger?.activeDates
              )
                ? parsedLedger.activeDates
                : [];

              if (ledgerLastInc === today) {
                nextAutoStreak = Math.max(1, ledgerStreak, savedStreak);
              } else if (
                ledgerLastInc === yesterday ||
                savedLastDate === yesterday
              ) {
                nextAutoStreak = Math.max(1, ledgerStreak, savedStreak) + 1;
                shouldShowMilestoneModal = true;
              } else {
                nextAutoStreak = 1;
              }

              const updatedDates = Array.from(
                new Set([...ledgerDates, today])
              ).slice(-365);
              localStorage.setItem(
                DAILY_STREAK_LEDGER_KEY,
                JSON.stringify({
                  streakDays: nextAutoStreak,
                  streakGoalDays: resolvedGoal,
                  lastIncrementDate: today,
                  activeDates: updatedDates,
                  lastCelebratedDate: parsedLedger?.lastCelebratedDate || '',
                  lastCelebratedStreakDays:
                    parsedLedger?.lastCelebratedStreakDays || 0,
                })
              );
            } else {
              // First initialization of the dedicated Streak Ledger:
              // If learner played yesterday (or has prior gameplay activity that was stuck at 1d due to the old mount overwrite), credit their 2-Day Streak!
              if (savedLastDate === yesterday) {
                nextAutoStreak = Math.max(1, savedStreak) + 1;
                shouldShowMilestoneModal = true;
              } else if (hasPriorActivity && savedStreak <= 1) {
                nextAutoStreak = 2;
                shouldShowMilestoneModal = true;
              } else {
                nextAutoStreak = Math.max(1, savedStreak);
              }

              localStorage.setItem(
                DAILY_STREAK_LEDGER_KEY,
                JSON.stringify({
                  streakDays: nextAutoStreak,
                  streakGoalDays: resolvedGoal,
                  lastIncrementDate: today,
                  activeDates:
                    nextAutoStreak >= 2 ? [yesterday, today] : [today],
                  lastCelebratedDate: shouldShowMilestoneModal ? today : '',
                  lastCelebratedStreakDays: nextAutoStreak,
                })
              );
            }
          } catch {}

          setStreakDays(nextAutoStreak);
          setLastActiveDate(today);

          // Automatically scale streakGoalDays to the next milestone tier (7 -> 14 -> 30 -> 60 -> 100 -> 365)
          const milestoneTiers = [7, 14, 30, 60, 100, 365];
          const nextAutoGoal =
            milestoneTiers.find((t) => t > nextAutoStreak) ||
            Math.max(savedGoal, nextAutoStreak + 7);
          if (nextAutoStreak >= savedGoal) {
            resolvedGoal = nextAutoGoal;
            setStreakGoalDays(nextAutoGoal);
            setGoalAchievedModal({
              days: nextAutoStreak,
              nextGoal: nextAutoGoal,
            });
          }
        } else {
          // Brand new learner with no saved progress yet: initialize Day 1 in the Streak Ledger
          try {
            if (!localStorage.getItem(DAILY_STREAK_LEDGER_KEY)) {
              localStorage.setItem(
                DAILY_STREAK_LEDGER_KEY,
                JSON.stringify({
                  streakDays: 1,
                  streakGoalDays: 7,
                  lastIncrementDate: today,
                  activeDates: [today],
                  lastCelebratedDate: '',
                  lastCelebratedStreakDays: 1,
                })
              );
            }
          } catch {}
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        let restoredLangs = false;
        if (raw) {
          const parsed = JSON.parse(raw);
          const foundNative =
            WORLD_LANGUAGES.find((l) => l.code === parsed.nativeCode) ||
            parsed.nativeObj;
          const foundTarget =
            WORLD_LANGUAGES.find((l) => l.code === parsed.targetCode) ||
            parsed.targetObj;

          if (foundNative && foundTarget) {
            setNativeLang(foundNative);
            setTargetLang(foundTarget);
            setHasSavedLangs(true);
            restoredLangs = true;
            loadCurriculumForTarget(foundNative, foundTarget);
          }
        }
        const onboardingDone =
          localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1';
        if (onboardingDone) {
          setHasCompletedOnboarding(true);
        }
        // Restore Daily Balloon Bonus status for today
        try {
          const rawBonus = localStorage.getItem(DAILY_BALLOON_BONUS_KEY);
          if (rawBonus) {
            const parsedBonus = JSON.parse(rawBonus);
            if (typeof parsedBonus?.claimedDate === 'string') {
              setDailyBonusClaimedDate(parsedBonus.claimedDate);
            }
            if (typeof parsedBonus?.awardedStars === 'number') {
              setDailyBonusAwardedStars(parsedBonus.awardedStars);
            }
            if (parsedBonus?.claimedDate !== today && onboardingDone) {
              setTimeout(() => setDailyBonusModalOpen(true), 450);
            }
          } else if (onboardingDone) {
            setTimeout(() => setDailyBonusModalOpen(true), 450);
          }
        } catch {}

        // Show the 5-Step Onboarding Wizard whenever onboarding is not completed (first visit or after Sign Out)
        if (!onboardingDone) {
          setLangModalInitialStep('native');
          setScreen('LANGUAGE_SELECT');
        } else {
          setScreen('WORLD_START');
        }

        // Check URL path, query, or hash for `/mustafa` command (only opens Admin Panel if signed in as Admin email)
        if (typeof window !== 'undefined') {
          const fullUrlCheck =
            `${window.location.pathname}${window.location.search}${window.location.hash}`.toLowerCase();
          if (
            (initialAdminCommand ||
              fullUrlCheck.includes('/mustafa') ||
              fullUrlCheck.includes('mustafa')) &&
            isUserAdmin(auth.currentUser)
          ) {
            setAdminCommandUnlocked(true);
            setHubModalTab('admin');
            setHubModalOpen(true);
          }
        }
        hasHydratedProgressRef.current = true;
      } catch {
        hasHydratedProgressRef.current = true;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [initialAdminCommand, loadCurriculumForTarget]);

  // Global keyboard listener so typing `/mustafa` opens the Admin Panel ONLY for the verified Admin email
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key || e.key.length !== 1) return;
      commandBufferRef.current = (commandBufferRef.current + e.key.toLowerCase()).slice(-16);
      if (
        commandBufferRef.current.endsWith('/mustafa') ||
        commandBufferRef.current.endsWith('/مصطفی')
      ) {
        commandBufferRef.current = '';
        if (isUserAdmin(currentUser)) {
          setAdminCommandUnlocked(true);
          setHubModalTab('admin');
          setHubModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  // Listen to Firebase Auth state for Cloud Learner Tracking & Admin Panel
  const lastAutoFilledUidRef = useRef<string | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user?.uid && user.uid !== lastAutoFilledUidRef.current) {
        lastAutoFilledUidRef.current = user.uid;
        if (user.displayName) {
          setLearnerName((prev) => (!prev.trim() ? user.displayName! : prev));
        }
      } else if (!user) {
        lastAutoFilledUidRef.current = null;
      }
      const adminMatch = isUserAdmin(user);
      setAdminCommandUnlocked(adminMatch);
      if (!adminMatch) {
        setHubModalTab((prevTab) =>
          prevTab === 'admin' || prevTab === 'analytics'
            ? 'streak_level'
            : prevTab
        );
      }
    });
    return () => unsubscribe();
  }, []);

  // 100% Automatic Streak Watcher: checks date rollover on tab focus & every 60s and auto-scales streakGoalDays
  useEffect(() => {
    const checkAutoDailyStreak = () => {
      const today = getTodayDateString();
      const yesterday = getYesterdayDateString();
      setLastActiveDate((prevDate) => {
        if (prevDate === today) {
          setStreakDays((s) => Math.max(1, s));
          return today;
        }
        if (prevDate === yesterday) {
          setStreakDays((s) => {
            const nextS = Math.max(1, s) + 1;
            const milestoneTiers = [7, 14, 30, 60, 100, 365];
            setStreakGoalDays((g) =>
              nextS >= g
                ? milestoneTiers.find((t) => t > nextS) || nextS + 7
                : g
            );
            return nextS;
          });
          return today;
        }
        setStreakDays(1);
        return today;
      });
    };

    const intervalId = setInterval(checkAutoDailyStreak, 60000);
    const onVisChange = () => {
      if (document.visibilityState === 'visible') {
        checkAutoDailyStreak();
      }
    };
    window.addEventListener('visibilitychange', onVisChange);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  // Persist stars, popped balloons, streak, difficulty level, completionDate, learnerName, and 90-topic progress
  useEffect(() => {
    if (!hasHydratedProgressRef.current) return;
    try {
      localStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({
          stars,
          poppedByMode,
          learnerName,
          completionDate,
          difficultyLevel,
          streakDays,
          streakGoalDays,
          lastActiveDate,
          certLanguageMode,
          topicRoundsByLang,
          claimedChests,
          adminUnlockedWordsCount,
          adminUnlockedTopicsCount,
          onboardingData,
        })
      );
    } catch {}
  }, [
    stars,
    poppedByMode,
    learnerName,
    completionDate,
    difficultyLevel,
    streakDays,
    streakGoalDays,
    lastActiveDate,
    certLanguageMode,
    topicRoundsByLang,
    claimedChests,
    adminUnlockedWordsCount,
    adminUnlockedTopicsCount,
    onboardingData,
  ]);

  // Render live localized Certificate + QR Code preview on the Sign-In (AUTH_ONBOARDING) screen
  useEffect(() => {
    if (screen !== 'AUTH_ONBOARDING') return;
    let cancelled = false;
    (async () => {
      try {
        const rendered = await renderLocalizedCertificateCanvas({
          recipientName:
            learnerName.trim() ||
            currentUser?.displayName ||
            'Mustafa',
          nativeLang,
          targetLang,
          certLanguageMode,
          completionDate: completionDate || getTodayDateString(),
          selectedTemplate: 'template_1',
          customQrText: signInCustomQrText.trim() || undefined,
        });
        if (!cancelled) {
          setSignInCertPreviewUrl(rendered.canvas.toDataURL('image/jpeg', 0.92));
          setSignInQrPreviewUrl(rendered.qrDataUrl);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [
    screen,
    learnerName,
    currentUser,
    completionDate,
    targetLang,
    nativeLang,
    certLanguageMode,
    signInCustomQrText,
  ]);

  // Stop active listening helpers WITHOUT closing the persistent mic stream
  const stopCurrentListeningAttempt = useCallback(() => {
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
    if (interimMatchTimerRef.current) {
      clearTimeout(interimMatchTimerRef.current);
      interimMatchTimerRef.current = null;
    }
    if (mistakeSettleTimerRef.current) {
      clearTimeout(mistakeSettleTimerRef.current);
      mistakeSettleTimerRef.current = null;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    currentRmsLevelRef.current = 0;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
  }, []);

  // Cleanup persistent stream ONLY when the entire app unmounts
  useEffect(() => {
    return () => {
      stopCurrentListeningAttempt();
      if (persistentStreamRef.current) {
        persistentStreamRef.current.getTracks().forEach((t) => t.stop());
        persistentStreamRef.current = null;
      }
    };
  }, [stopCurrentListeningAttempt]);

  // Acquire or reuse the single persistent microphone MediaStream (asks permission ONLY ONCE!)
  const ensurePersistentMicStream = useCallback(async (): Promise<MediaStream | null> => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    if (
      persistentStreamRef.current &&
      persistentStreamRef.current.active &&
      persistentStreamRef.current
        .getAudioTracks()
        .some((t) => t.readyState === 'live' && t.enabled)
    ) {
      if (ctx && (!analyserRef.current || !micSourceNodeRef.current)) {
        try {
          const source = ctx.createMediaStreamSource(
            persistentStreamRef.current
          );
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.45;
          source.connect(analyser);
          micSourceNodeRef.current = source;
          analyserRef.current = analyser;
        } catch {}
      }
      return persistentStreamRef.current;
    }

    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        persistentStreamRef.current = stream;

        if (ctx) {
          const source = ctx.createMediaStreamSource(stream);
          const gainNode = ctx.createGain();
          // Boost microphone input power by 2.8x so even quiet voices or phone speakers are detected with strong energy
          gainNode.gain.value = 2.8;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.35;
          source.connect(gainNode);
          gainNode.connect(analyser);
          // Store source in a ref so Chromium NEVER garbage-collects the audio graph!
          micSourceNodeRef.current = source;
          analyserRef.current = analyser;
        }
        return stream;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const handleOfficialGoogleSignIn = useCallback(async () => {
    setOnboardingError('');
    setIsSigningInGoogle(true);
    try {
      const signedInUser = await signInWithGooglePopup();
      if (signedInUser) {
        setCurrentUser(signedInUser);
        if (signedInUser.displayName) {
          setLearnerName(signedInUser.displayName);
        }
        const adminMatch = isUserAdmin(signedInUser);
        setAdminCommandUnlocked(adminMatch);
        if (!adminMatch) {
          setHubModalTab((prevTab) =>
            prevTab === 'admin' ? 'streak_level' : prevTab
          );
        }
      }
    } catch (err: any) {
      const code = String(err?.code || '');
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setOnboardingError(
        err?.message ||
          'Could not open the official Google Sign-In window. Please allow popups and try again.'
      );
    } finally {
      setIsSigningInGoogle(false);
    }
  }, []);

  const handleGoogleSignOut = useCallback(async () => {
    stopCurrentListeningAttempt();
    setOnboardingError('');
    setHasCompletedOnboarding(false);
    setHasSavedLangs(false);
    setAdminCommandUnlocked(false);
    setHubModalOpen(false);
    setHubModalTab('streak_level');
    setLangModalInitialStep('native');
    setScreen('LANGUAGE_SELECT');
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    try {
      await signOutLearner();
      setCurrentUser(null);
    } catch {}
  }, [stopCurrentListeningAttempt]);

  const handleConfirmLanguages = async (
    selectedNative: LanguageInfo,
    selectedTarget: LanguageInfo,
    fromLanguageModal = true,
    submittedOnboarding?: OnboardingProfileData
  ) => {
    getSharedAudioContext();
    stopCurrentListeningAttempt();
    setNativeLang(selectedNative);
    setTargetLang(selectedTarget);
    setHasSavedLangs(true);
    setCurrentIndex(0);

    const wasAlreadyOnboarded = hasCompletedOnboarding;

    if (submittedOnboarding) {
      setOnboardingData(submittedOnboarding);
      // Automatically unlock Words & Topics according to the learner's chosen Conversation Level!
      if (submittedOnboarding.proficiencyType === 'scratch') {
        setDifficultyLevel('easy');
      } else if (submittedOnboarding.conversationAbility === 'level_1_basic') {
        setDifficultyLevel('medium');
        setAdminUnlockedWordsCount((prev) => Math.max(prev, 25));
        setAdminUnlockedTopicsCount((prev) => Math.max(prev, 10));
      } else if (submittedOnboarding.conversationAbility === 'level_2_medium') {
        setDifficultyLevel('medium');
        setAdminUnlockedWordsCount((prev) => Math.max(prev, 60));
        setAdminUnlockedTopicsCount((prev) => Math.max(prev, 35));
      } else if (submittedOnboarding.conversationAbility === 'level_3_full') {
        setDifficultyLevel('hard');
        setAdminUnlockedWordsCount(100);
        setAdminUnlockedTopicsCount(90);
      }
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          nativeCode: selectedNative.code,
          targetCode: selectedTarget.code,
          nativeObj: selectedNative,
          targetObj: selectedTarget,
        })
      );
    } catch {}

    // After finishing the 5 onboarding questions (first visit or after Sign Out), go to Step 6: Sign-In & Username (AUTH_ONBOARDING)
    if (fromLanguageModal && (!wasAlreadyOnboarded || !currentUser)) {
      setScreen('AUTH_ONBOARDING');
    } else if (fromLanguageModal) {
      setHasCompletedOnboarding(true);
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
      } catch {}
      setScreen('WORLD_START');
    }

    await loadCurriculumForTarget(selectedNative, selectedTarget);
  };

  // Current lesson mode & item calculations (Words, Conversation & Daily Session Mistake Review Mode)
  const isWordsMode = screen === 'WORDS_GAME';
  const isConversationMode = screen === 'CONVERSATION_GAME';
  const isReviewMode = screen === 'REVIEW_GAME';
  const isLessonScreen =
    screen === 'WORDS_GAME' ||
    screen === 'CONVERSATION_GAME' ||
    screen === 'REVIEW_GAME';
  const isPlayableBalloonLesson =
    screen === 'WORDS_GAME' ||
    screen === 'REVIEW_GAME' ||
    (screen === 'CONVERSATION_GAME' && convViewMode === 'ROUND_PLAY');

  // 5 sentences for the currently active Topic (0..89) and Round (1..15)
  const currentRoundSentences = useMemo<ConversationItem[]>(() => {
    return getSentencesForTopicRound(
      conversationsList,
      activeTopicIndex,
      activeRoundNumber,
      nativeLang
    );
  }, [conversationsList, activeTopicIndex, activeRoundNumber, nativeLang]);

  // Active Review Items: uses exact words/phrases missed during the session, or a 3-item review drill if opened manually with 0 mistakes
  const activeReviewItems = useMemo<ReviewMistakeItem[]>(() => {
    if (sessionMistakes.length > 0) {
      return sessionMistakes;
    }
    const sampleWords = curriculum.words.slice(0, 2).map((w, idx) => ({
      id: `sample_word_${idx}`,
      kind: 'word' as const,
      mainText: w.word,
      pronunciation: w.pronunciation || w.word,
      nativeMeaning: w.translations?.[nativeLang.code] || w.englishMeaning,
      englishMeaning: w.englishMeaning,
      acceptedMatches: w.acceptedMatches || [],
      color: w.color || BALLOON_COLORS[idx % BALLOON_COLORS.length],
      icon: w.icon,
      mistakeCount: 1,
    }));
    const sampleConv = currentRoundSentences.slice(0, 1).map((c, idx) => ({
      id: `sample_phrase_${idx}`,
      kind: 'phrase' as const,
      mainText: c.phrase,
      pronunciation: c.pronunciation || c.phrase,
      nativeMeaning:
        c.translations?.[nativeLang.code] || c.urduMeaning || c.englishMeaning,
      englishMeaning: c.englishMeaning,
      acceptedMatches: c.acceptedMatches || [],
      color: c.color || BALLOON_COLORS[(idx + 2) % BALLOON_COLORS.length],
      icon: c.icon,
      situation: c.situation,
      mistakeCount: 1,
    }));
    return [...sampleWords, ...sampleConv];
  }, [curriculum.words, currentRoundSentences, nativeLang.code, sessionMistakes]);

  const currentList = isReviewMode
    ? activeReviewItems
    : isConversationMode
    ? currentRoundSentences
    : curriculum.words;

  const safeIndex = Math.min(currentIndex, Math.max(0, currentList.length - 1));
  const isCurrentConvAssembleStep =
    isConversationMode &&
    convViewMode === 'ROUND_PLAY' &&
    convStepModeOverride === 'assemble';
  const currentReviewItem = isReviewMode
    ? activeReviewItems[safeIndex] || activeReviewItems[0] || null
    : null;
  const currentWordItem = isWordsMode ? curriculum.words[safeIndex] : null;
  const currentConvItem = isConversationMode
    ? currentRoundSentences[safeIndex]
    : null;

  const targetDisplayMain = isReviewMode
    ? currentReviewItem?.mainText || 'Apple'
    : isConversationMode
    ? currentConvItem?.phrase || 'Hello!'
    : currentWordItem?.word || 'Apple';

  const targetFullLabel = isReviewMode
    ? currentReviewItem?.kind === 'phrase'
      ? `${currentReviewItem?.pronunciation || currentReviewItem?.mainText}`
      : `${currentReviewItem?.mainText} (${currentReviewItem?.pronunciation})`
    : isConversationMode
    ? `${currentConvItem?.pronunciation || currentConvItem?.phrase}`
    : `${currentWordItem?.word} (${currentWordItem?.pronunciation})`;

  const targetSpeechText = isReviewMode
    ? currentReviewItem?.mainText || 'Apple'
    : isConversationMode
    ? currentConvItem?.phrase || 'Hello, how are you?'
    : currentWordItem?.word || 'Apple';

  const targetPhonetic = isReviewMode
    ? currentReviewItem?.pronunciation || ''
    : isConversationMode
    ? currentConvItem?.pronunciation || ''
    : currentWordItem?.pronunciation || '';

  const targetAcceptedMatches = useMemo(() => {
    if (isReviewMode) return currentReviewItem?.acceptedMatches || [];
    if (isConversationMode) return currentConvItem?.acceptedMatches || [];
    return currentWordItem?.acceptedMatches || [];
  }, [
    currentConvItem?.acceptedMatches,
    currentReviewItem?.acceptedMatches,
    currentWordItem?.acceptedMatches,
    isConversationMode,
    isReviewMode,
  ]);

  const balloonColor = isReviewMode
    ? currentReviewItem?.color || BALLOON_COLORS[safeIndex % BALLOON_COLORS.length]
    : isConversationMode
    ? currentConvItem?.color || BALLOON_COLORS[safeIndex % BALLOON_COLORS.length]
    : currentWordItem?.color || BALLOON_COLORS[safeIndex % BALLOON_COLORS.length];

  const currentModeKey = isReviewMode
    ? `${targetLang.code}:REVIEW_GAME`
    : isConversationMode
    ? `${targetLang.code}:CONV_T${activeTopicIndex}_R${activeRoundNumber}`
    : `${targetLang.code}:WORDS_GAME`;
  const currentPoppedIndices = useMemo(
    () => poppedByMode[currentModeKey] || [],
    [poppedByMode, currentModeKey]
  );

  // Words & Conversation sections are BOTH unlocked from the start on the dashboard!
  const poppedAlphabets = useMemo(() => [] as number[], []);
  const poppedWords = useMemo(
    () => poppedByMode[`${targetLang.code}:WORDS_GAME`] || [],
    [poppedByMode, targetLang.code]
  );
  const poppedConversations = useMemo(
    () => poppedByMode[`${targetLang.code}:CONVERSATION_GAME`] || [],
    [poppedByMode, targetLang.code]
  );

  const currentTopicRoundsMap = useMemo(
    () => topicRoundsByLang[targetLang.code] || {},
    [topicRoundsByLang, targetLang.code]
  );

  const completedTopicsCount = useMemo(() => {
    return Object.values(currentTopicRoundsMap).filter(
      (r) => r >= ROUNDS_PER_TOPIC
    ).length;
  }, [currentTopicRoundsMap]);

  const totalRoundStarsCompleted = useMemo(() => {
    const roundSum = Object.values(currentTopicRoundsMap).reduce(
      (acc, r) => acc + r,
      0
    );
    return Math.max(poppedConversations.length, roundSum * 2);
  }, [currentTopicRoundsMap, poppedConversations.length]);

  const isWordsUnlocked = true;
  const isConversationUnlocked = true;
  const isCourseFullyCompleted =
    (curriculum.words.length > 0 &&
      poppedWords.length >= curriculum.words.length &&
      completedTopicsCount >= 1) ||
    completedTopicsCount >= 90;

  // Step-by-Step Item Locking inside Words or active Conversation Round (plus Admin Unlock override):
  const maxUnlockedIndex = useMemo(() => {
    if (isReviewMode) {
      return Math.max(0, currentList.length - 1);
    }
    let idx = 0;
    while (
      idx < currentList.length - 1 &&
      currentPoppedIndices.includes(idx)
    ) {
      idx++;
    }
    if (isWordsMode) {
      return Math.min(
        Math.max(0, currentList.length - 1),
        Math.max(idx, adminUnlockedWordsCount - 1)
      );
    }
    return idx;
  }, [
    currentList.length,
    currentPoppedIndices,
    isReviewMode,
    isWordsMode,
    adminUnlockedWordsCount,
  ]);

  const isCurrentItemCompleted =
    currentPoppedIndices.includes(safeIndex) ||
    (isWordsMode && safeIndex < adminUnlockedWordsCount - 1);
  const canGoNext =
    isReviewMode ||
    (isCurrentItemCompleted &&
      (safeIndex < maxUnlockedIndex || safeIndex === currentList.length - 1));

  const showLockToast = useCallback((msg: string) => {
    playGentleRetryTone();
    setLockNotice(msg);
    if (lockNoticeTimerRef.current) {
      clearTimeout(lockNoticeTimerRef.current);
    }
    lockNoticeTimerRef.current = setTimeout(() => {
      setLockNotice('');
    }, 3400);
  }, []);

  const getResumeIndexForList = useCallback(
    (listLen: number, poppedIndices: number[]) => {
      for (let i = 0; i < listLen; i++) {
        if (!poppedIndices.includes(i)) return i;
      }
      return 0;
    },
    []
  );

  const tryOpenMode = useCallback(
    async (
      targetMode:
        | 'ALPHABET_GAME'
        | 'WORDS_GAME'
        | 'CONVERSATION_GAME'
        | 'REVIEW_GAME',
      withMicWarmup = false
    ) => {
      getSharedAudioContext();
      stopCurrentListeningAttempt();
      if (withMicWarmup) {
        await ensurePersistentMicStream();
      }

      if (targetMode === 'REVIEW_GAME') {
        const revKey = `${targetLang.code}:REVIEW_GAME`;
        setPoppedByMode((prev) => ({ ...prev, [revKey]: [] }));
        setCurrentIndex(0);
        setReviewReturnScreen(
          screen === 'WORDS_GAME' || screen === 'CONVERSATION_GAME'
            ? screen
            : 'WORLD_START'
        );
        setScreen('REVIEW_GAME');
        return;
      }

      // Redirect any legacy ALPHABET_GAME call to WORDS_GAME
      const resolvedMode =
        targetMode === 'ALPHABET_GAME' ? 'WORDS_GAME' : targetMode;

      if (resolvedMode === 'CONVERSATION_GAME') {
        setDifficultyLevel('hard');
        setConvViewMode('PATH');
        setScreen('CONVERSATION_GAME');
        return;
      }

      if (difficultyLevel === 'easy') {
        setDifficultyLevel('medium');
      }

      setCurrentIndex(
        getResumeIndexForList(curriculum.words.length, poppedWords)
      );
      setScreen('WORDS_GAME');
    },
    [
      curriculum.words.length,
      difficultyLevel,
      ensurePersistentMicStream,
      getResumeIndexForList,
      poppedWords,
      screen,
      stopCurrentListeningAttempt,
      targetLang.code,
    ]
  );

  // Start a specific Round (1..5) of one of the 90 Conversation Topics
  const handleStartTopicRound = useCallback(
    async (topicIndex: number, roundNumber: number) => {
      getSharedAudioContext();
      stopCurrentListeningAttempt();
      await ensurePersistentMicStream();
      setActiveTopicIndex(topicIndex);
      setActiveRoundNumber(roundNumber);
      setCurrentIndex(0);
      setLastCompletedBanner('');
      const roundKey = `${targetLang.code}:CONV_T${topicIndex}_R${roundNumber}`;
      setPoppedByMode((prev) => ({ ...prev, [roundKey]: [] }));
      setConvViewMode('ROUND_PLAY');
      setScreen('CONVERSATION_GAME');
    },
    [ensurePersistentMicStream, stopCurrentListeningAttempt, targetLang.code]
  );

  // Sync learner progress, streak, and difficulty level to Firestore for the Admin Panel
  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) return;
    const syncTimer = setTimeout(() => {
      const stageForRecord =
        poppedConversations.length >= conversationsList.length &&
        isConversationUnlocked
          ? 'COMPLETED'
          : isConversationMode
          ? 'CONVERSATION_GAME'
          : isWordsMode
          ? 'WORDS_GAME'
          : 'ALPHABET_GAME';

      syncLearnerProfileToFirestore({
        uid: currentUser.uid,
        displayName: learnerName || currentUser.displayName || 'Learner',
        nativeLangCode: nativeLang.code,
        nativeLangName: nativeLang.name,
        targetLangCode: targetLang.code,
        targetLangName: targetLang.name,
        difficultyLevel,
        currentStage: stageForRecord,
        alphabetsCompleted: poppedAlphabets.length,
        alphabetsTotal: curriculum.alphabet.length,
        wordsCompleted: poppedWords.length,
        wordsTotal: curriculum.words.length,
        conversationsCompleted: poppedConversations.length,
        conversationsTotal: conversationsList.length,
        stars,
        streakDays,
        streakGoalDays,
        lastActiveDate,
        certificateEarned:
          poppedConversations.length >= conversationsList.length &&
          isConversationUnlocked,
      }).catch(() => {});
    }, 600);

    return () => clearTimeout(syncTimer);
  }, [
    conversationsList.length,
    currentUser,
    curriculum.alphabet.length,
    curriculum.words.length,
    difficultyLevel,
    isConversationMode,
    isConversationUnlocked,
    isWordsMode,
    lastActiveDate,
    learnerName,
    nativeLang.code,
    nativeLang.name,
    poppedAlphabets.length,
    poppedConversations.length,
    poppedWords.length,
    stars,
    streakDays,
    streakGoalDays,
    targetLang.code,
    targetLang.name,
  ]);

  const carouselItems = useMemo<CarouselBalloonItem[]>(() => {
    if (isReviewMode) {
      return activeReviewItems.map((r, idx) => ({
        label: r.kind === 'phrase' ? `R${idx + 1}` : r.mainText,
        color: r.color || BALLOON_COLORS[idx % BALLOON_COLORS.length],
        icon: r.icon || '🎯',
      }));
    }
    if (isConversationMode) {
      return currentRoundSentences.map((c, idx) => ({
        label: `${idx + 1}`,
        color: c.color || BALLOON_COLORS[idx % BALLOON_COLORS.length],
        icon: c.icon,
      }));
    }
    return curriculum.words.map((w, idx) => ({
      label: w.word,
      color: w.color || BALLOON_COLORS[idx % BALLOON_COLORS.length],
      icon: w.icon,
    }));
  }, [
    activeReviewItems,
    currentRoundSentences,
    curriculum.words,
    isConversationMode,
    isReviewMode,
  ]);

  // Universal Multi-Language Phonetic & Homophone Map so single letters (like "A", "B", "الف", "بے", "あ", "अ")
  // Strict Full-Word & Full-Phrase Pronunciation Matcher across all 65+ languages:
  // Ensures the user speaks the FULL proper letter, word, or conversation sentence before popping!
  const doesSpokenCandidateMatch = useCallback(
    (spokenRaw: string): boolean => {
      const normalizeToken = (str: string) =>
        str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f\u093C]/g, '')
          .replace(/\u0901/g, '\u0902')
          .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
          .replace(/[أإآٱ]/g, 'ا')
          .replace(/[ةۀہھ]/g, 'ه')
          .replace(/[يئىے]/g, 'ی')
          .replace(/ں/g, 'ن')
          .replace(/ك/g, 'ک')
          .replace(/[.,!?؟،"'()[\]{}\-_/\\+:;|~`@#$%^&*=<>«»„“”]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      const cleaned = normalizeToken(spokenRaw);
      if (!cleaned) return false;

      // Helper for full-word Levenshtein edit distance calibrated by difficultyLevel (easy -> medium -> hard)
      const isCloseFullWord = (spoken: string, target: string): boolean => {
        if (spoken === target) return true;
        if (target.length <= 2) {
          return (
            spoken === target ||
            spoken.startsWith(target) ||
            target.startsWith(spoken)
          );
        }
        const minLenRatio =
          difficultyLevel === 'easy'
            ? 0.62
            : difficultyLevel === 'medium'
            ? 0.72
            : 0.82;
        if (spoken.length < Math.ceil(target.length * minLenRatio)) {
          return false;
        }
        const maxLengthDiff =
          difficultyLevel === 'easy' ? 3 : difficultyLevel === 'medium' ? 2 : 1;
        if (Math.abs(spoken.length - target.length) > maxLengthDiff) return false;

        const m = spoken.length;
        const n = target.length;
        const dp: number[][] = Array.from({ length: m + 1 }, () =>
          Array(n + 1).fill(0)
        );
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const cost = spoken[i - 1] === target[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
              dp[i - 1][j] + 1,
              dp[i][j - 1] + 1,
              dp[i - 1][j - 1] + cost
            );
          }
        }
        const maxAllowedDistance =
          difficultyLevel === 'easy'
            ? target.length >= 5
              ? 2
              : 1
            : difficultyLevel === 'medium'
            ? target.length >= 6
              ? 2
              : 1
            : target.length >= 7
            ? 1
            : 1;
        return dp[m][n] <= maxAllowedDistance;
      };

      const splitTargetVariants = (sources: string[]): string[] => {
        const set = new Set<string>();
        for (const src of sources) {
          if (!src) continue;
          const withoutParens = normalizeToken(src.replace(/\([^)]*\)/g, ' '));
          if (withoutParens) set.add(withoutParens);

          const parenMatches = src.match(/\(([^)]+)\)/g);
          if (parenMatches) {
            for (const pm of parenMatches) {
              const inner = normalizeToken(pm);
              if (inner) set.add(inner);
            }
          }
        }
        return Array.from(set).filter(Boolean);
      };

      const spokenWords = cleaned.split(' ').filter(Boolean);

      // =====================================================================
      // MODE 0: REVIEW MODE — Match either Phrase or Word from Session Mistakes
      // =====================================================================
      if (isReviewMode && currentReviewItem) {
        if (currentReviewItem.kind === 'phrase') {
          const phraseNorm = normalizeToken(
            currentReviewItem.mainText.replace(/\([^)]*\)/g, ' ')
          );
          const pronNorm = normalizeToken(
            (currentReviewItem.pronunciation || '').replace(/\([^)]*\)/g, ' ')
          );
          const refWords = phraseNorm.split(' ').filter((w) => w.length >= 2);
          if (cleaned === phraseNorm || cleaned === pronNorm) return true;
          if (refWords.length <= 1) {
            return spokenWords.some(
              (sw) =>
                isCloseFullWord(sw, phraseNorm) || isCloseFullWord(sw, pronNorm)
            );
          }
          const minWordsRequired = Math.max(2, Math.ceil(refWords.length * 0.55));
          if (spokenWords.length >= minWordsRequired) {
            const matchedCount = refWords.filter((rw) =>
              spokenWords.some((sw) => isCloseFullWord(sw, rw))
            ).length;
            if (matchedCount >= minWordsRequired) return true;
          }
          return false;
        } else {
          if (spokenWords.length > 4) return false;
          const wordTargets = splitTargetVariants([
            currentReviewItem.mainText,
            currentReviewItem.pronunciation,
            ...targetAcceptedMatches,
          ]);
          for (const target of wordTargets) {
            if (!target) continue;
            if (cleaned === target || isCloseFullWord(cleaned, target)) {
              return true;
            }
            const targetTokens = target.split(' ').filter(Boolean);
            if (
              targetTokens.length === 1 &&
              spokenWords.some((sw) => isCloseFullWord(sw, target))
            ) {
              return true;
            }
          }
          return false;
        }
      }

      // =====================================================================
      // MODE 1: CONVERSATION MODE (Baatcheet) — Calibrated by Difficulty Level
      // =====================================================================
      if (isConversationMode && currentConvItem) {
        const phraseNorm = normalizeToken(
          currentConvItem.phrase.replace(/\([^)]*\)/g, ' ')
        );
        const pronNorm = normalizeToken(
          (currentConvItem.pronunciation || '').replace(/\([^)]*\)/g, ' ')
        );

        const ratioLong =
          difficultyLevel === 'easy'
            ? 0.5
            : difficultyLevel === 'medium'
            ? 0.6
            : 0.75;
        const ratioShort =
          difficultyLevel === 'easy'
            ? 0.6
            : difficultyLevel === 'medium'
            ? 0.75
            : 0.85;

        const checkPhraseCompletion = (refNorm: string): boolean => {
          if (!refNorm) return false;
          if (cleaned === refNorm) return true;
          const refWords = refNorm.split(' ').filter((w) => w.length >= 2);
          if (refWords.length === 0) return false;
          if (refWords.length === 1) {
            return spokenWords.some((sw) => isCloseFullWord(sw, refWords[0]));
          }
          const minWordsRequired =
            refWords.length >= 6
              ? Math.max(2, Math.ceil(refWords.length * ratioLong))
              : Math.max(2, Math.ceil(refWords.length * ratioShort));
          if (spokenWords.length < minWordsRequired) return false;

          const matchedCount = refWords.filter((rw) =>
            spokenWords.some((sw) => isCloseFullWord(sw, rw))
          ).length;
          return matchedCount >= minWordsRequired;
        };

        if (checkPhraseCompletion(phraseNorm)) return true;
        if (checkPhraseCompletion(pronNorm)) return true;

        // Also check acceptedMatches only if they represent the full sentence
        const fullPhraseWordCount = phraseNorm.split(' ').filter(Boolean).length;
        const minAcceptedWords =
          fullPhraseWordCount >= 6
            ? Math.max(2, Math.ceil(fullPhraseWordCount * ratioLong))
            : Math.max(2, Math.ceil(fullPhraseWordCount * ratioShort));
        for (const acc of targetAcceptedMatches) {
          const accNorm = normalizeToken(acc);
          const accWords = accNorm.split(' ').filter(Boolean);
          if (accWords.length >= minAcceptedWords && checkPhraseCompletion(accNorm)) {
            return true;
          }
        }

        return false;
      }

      // =====================================================================
      // MODE 2: WORDS MODE — Require Full Proper Word (NEVER just the letter or prefix!)
      // =====================================================================
      if (isWordsMode && currentWordItem) {
        if (spokenWords.length > 4) return false;

        // Do NOT include currentWordItem.letter here! User must say the FULL word (e.g. "Apple", not "A" or "Ap")
        const wordTargets = splitTargetVariants([
          currentWordItem.word,
          currentWordItem.pronunciation,
          ...targetAcceptedMatches,
        ]);

        for (const target of wordTargets) {
          if (!target) continue;
          // Reject single-letter targets if the word itself is longer than 1 character
          if (target.length === 1 && currentWordItem.word.trim().length > 1) {
            continue;
          }

          // 1. Exact full match
          if (cleaned === target) return true;

          // 2. Close full-word match (only when >= 80% of the word's length is spoken)
          if (isCloseFullWord(cleaned, target)) return true;

          // 3. If user said "A for Apple" or "الف سے انار", check if the full target word is one of the spoken words
          const targetTokens = target.split(' ').filter(Boolean);
          if (
            targetTokens.length === 1 &&
            spokenWords.some((sw) => isCloseFullWord(sw, target))
          ) {
            return true;
          }
        }

        return false;
      }

      return false;
    },
    [
      currentConvItem,
      currentReviewItem,
      currentWordItem,
      difficultyLevel,
      isConversationMode,
      isReviewMode,
      isWordsMode,
      targetAcceptedMatches,
    ]
  );

  // Automatic Success -> POP the Main Balloon + Star Reward + Advance to Next Balloon in Same Mode (or Trigger Daily Session Review Mode!)
  const triggerSuccessAndAdvance = useCallback(
    (lessonId: number, spokenText?: string) => {
      if (activeLessonIdRef.current !== lessonId) return;
      stopCurrentListeningAttempt();
      setVoiceLevel(0);
      setIsMistake(false);

      setHeardTranscript(spokenText || targetDisplayMain);
      setPhase('celebrating');
      setStars((prev) => prev + (isReviewMode ? 2 : 1));

      // 100% Automatic Streak Update on every balloon pop & milestone completion
      if (!isReviewMode) {
        sessionPopCountRef.current += 1;
      }
      const todayStr = getTodayDateString();
      const yesterdayStr = getYesterdayDateString();
      let updatedStreakForSession = streakDays;
      let alreadyCelebratedToday = false;

      try {
        const rawLedger = localStorage.getItem(DAILY_STREAK_LEDGER_KEY);
        const parsedLedger = rawLedger ? JSON.parse(rawLedger) : null;
        const ledgerStreak =
          typeof parsedLedger?.streakDays === 'number' &&
          parsedLedger.streakDays >= 1
            ? parsedLedger.streakDays
            : streakDays;
        const ledgerLastInc =
          typeof parsedLedger?.lastIncrementDate === 'string'
            ? parsedLedger.lastIncrementDate
            : lastActiveDate;
        const ledgerDates: string[] = Array.isArray(parsedLedger?.activeDates)
          ? parsedLedger.activeDates
          : [todayStr];
        alreadyCelebratedToday =
          parsedLedger?.lastCelebratedDate === todayStr &&
          parsedLedger?.lastCelebratedStreakDays ===
            Math.max(streakDays, ledgerStreak);

        if (ledgerLastInc === yesterdayStr || lastActiveDate === yesterdayStr) {
          updatedStreakForSession = Math.max(1, streakDays, ledgerStreak) + 1;
          alreadyCelebratedToday = false;
        } else if (ledgerLastInc === todayStr) {
          updatedStreakForSession = Math.max(1, streakDays, ledgerStreak);
        } else {
          updatedStreakForSession = 1;
          alreadyCelebratedToday = false;
        }

        const completedBatch =
          !isReviewMode &&
          sessionPopCountRef.current > 0 &&
          sessionPopCountRef.current % 5 === 0;

        const nextDates = Array.from(new Set([...ledgerDates, todayStr])).slice(
          -365
        );
        localStorage.setItem(
          DAILY_STREAK_LEDGER_KEY,
          JSON.stringify({
            streakDays: updatedStreakForSession,
            streakGoalDays,
            lastIncrementDate: todayStr,
            activeDates: nextDates,
            lastCelebratedDate:
              completedBatch && sessionPopCountRef.current === 5
                ? todayStr
                : parsedLedger?.lastCelebratedDate || '',
            lastCelebratedStreakDays:
              completedBatch && sessionPopCountRef.current === 5
                ? updatedStreakForSession
                : parsedLedger?.lastCelebratedStreakDays ||
                  updatedStreakForSession,
          })
        );
      } catch {}

      setLastActiveDate(todayStr);
      setStreakDays(updatedStreakForSession);
      const milestoneTiers = [7, 14, 30, 60, 100, 365];
      setStreakGoalDays((g) => {
        if (updatedStreakForSession >= g) {
          const nextGoal =
            milestoneTiers.find((t) => t > updatedStreakForSession) ||
            updatedStreakForSession + 7;
          setGoalAchievedModal({
            days: updatedStreakForSession,
            nextGoal,
          });
          return nextGoal;
        }
        return g;
      });

      // Celebrate once per day when the learner completes their 5th balloon in a daily session (with their true multi-day streak!)
      const completedDailySessionBatch =
        !isReviewMode &&
        sessionPopCountRef.current > 0 &&
        sessionPopCountRef.current % 5 === 0;

      if (
        completedDailySessionBatch &&
        sessionPopCountRef.current === 5 &&
        !alreadyCelebratedToday
      ) {
        const nextGoal =
          milestoneTiers.find((t) => t > updatedStreakForSession) ||
          Math.max(streakGoalDays, updatedStreakForSession + 7);
        setGoalAchievedModal({
          days: Math.max(1, updatedStreakForSession),
          nextGoal,
        });
      }

      setPoppedByMode((prev) => {
        const existing = prev[currentModeKey] || [];
        const updatedMode = existing.includes(safeIndex)
          ? existing
          : [...existing, safeIndex];

        if (isConversationMode) {
          const globalConvKey = `${targetLang.code}:CONVERSATION_GAME`;
          const globalExisting = prev[globalConvKey] || [];
          const globalIndex =
            (activeTopicIndex * 5 +
              (activeRoundNumber - 1) * 2 +
              safeIndex) %
            Math.max(1, conversationsList.length);
          const updatedGlobal = globalExisting.includes(globalIndex)
            ? globalExisting
            : [...globalExisting, globalIndex];
          return {
            ...prev,
            [currentModeKey]: updatedMode,
            [globalConvKey]: updatedGlobal,
          };
        }

        return { ...prev, [currentModeKey]: updatedMode };
      });

      // Step-by-step Word Unlock: completing word `safeIndex` unlocks word `safeIndex + 1`
      if (isWordsMode) {
        setAdminUnlockedWordsCount((prev) =>
          Math.max(prev, Math.min(curriculum.words.length, safeIndex + 2))
        );
      }

      setStatusMessage(`💥 POP! ${prompts.correctPraise}`);
      triggerBalloonPopVibration([45, 25, 65]);
      playBalloonPopSound();
      playStarRewardFanfare();

      setTimeout(() => {
        if (activeLessonIdRef.current !== lessonId) return;
        const totalItems = currentList.length;

        if (isReviewMode) {
          if (safeIndex + 1 < totalItems) {
            setCurrentIndex((prev) => prev + 1);
          } else {
            // Completed all items in Daily Session Mistake Review Mode!
            setStars((prev) => prev + 15);
            setSessionMistakes([]);
            const revKey = `${targetLang.code}:REVIEW_GAME`;
            setPoppedByMode((prev) => ({ ...prev, [revKey]: [] }));
            setLastCompletedBanner(
              nativeLang.code === 'ur'
                ? '🎯 شاباش! آپ نے آج کے سیشن کی تمام غلطیوں کی دہرائی مکمل کر لی (+15 ⭐ انعام)!'
                : nativeLang.code === 'hi'
                ? '🎯 शाबाश! आपने आज के सेशन की सभी गलतियों का रिव्यू पूरा कर लिया (+15 ⭐ बोनस)!'
                : '🎯 Awesome! You mastered all mistakes from your daily session (+15 ⭐ Bonus)!'
            );
            if (reviewReturnScreen === 'CONVERSATION_GAME') {
              setConvViewMode('PATH');
              setScreen('CONVERSATION_GAME');
            } else {
              setScreen('VICTORY_CELEBRATION');
            }
          }
          return;
        }

        // If user just completed their daily 5-balloon session in Words Mode AND has mistakes from this session, automatically launch Review Mode!
        if (
          isWordsMode &&
          completedDailySessionBatch &&
          sessionMistakesRef.current.length > 0
        ) {
          const revKey = `${targetLang.code}:REVIEW_GAME`;
          setPoppedByMode((prev) => ({ ...prev, [revKey]: [] }));
          setReviewReturnScreen('WORDS_GAME');
          setCurrentIndex(0);
          setScreen('REVIEW_GAME');
          return;
        }

        if (safeIndex + 1 < totalItems) {
          setCurrentIndex((prev) => prev + 1);
        } else if (isConversationMode) {
          // Completed all 5 sentences of this Round!
          // Update the topic's round progress (1/15 -> ... -> 15/15)
          const nextCompletedRound = Math.min(
            ROUNDS_PER_TOPIC,
            activeRoundNumber
          );
          setTopicRoundsByLang((prev) => {
            const langMap = prev[targetLang.code] || {};
            const currentBest = langMap[activeTopicIndex] || 0;
            const updatedBest = Math.max(currentBest, nextCompletedRound);
            return {
              ...prev,
              [targetLang.code]: {
                ...langMap,
                [activeTopicIndex]: updatedBest,
              },
            };
          });
          setStars((prev) => prev + 5);

          // Step-by-step Topic Unlock: when Topic `activeTopicIndex` finishes all 15 rounds, unlock Topic `activeTopicIndex + 2` (1-based)
          if (nextCompletedRound >= ROUNDS_PER_TOPIC) {
            setAdminUnlockedTopicsCount((prev) =>
              Math.max(prev, Math.min(90, activeTopicIndex + 2))
            );
          }

          setLastCompletedBanner(
            pathCopy.roundCompletedBanner(activeTopicIndex + 1, activeRoundNumber)
          );

          // If the user got any words/phrases wrong during this session, automatically trigger 'REVIEW_GAME'!
          if (sessionMistakesRef.current.length > 0) {
            const revKey = `${targetLang.code}:REVIEW_GAME`;
            setPoppedByMode((prev) => ({ ...prev, [revKey]: [] }));
            setReviewReturnScreen('CONVERSATION_GAME');
            setCurrentIndex(0);
            setScreen('REVIEW_GAME');
          } else {
            setConvViewMode('PATH');
          }
        } else {
          setDifficultyLevel('hard');
          if (sessionMistakesRef.current.length > 0) {
            const revKey = `${targetLang.code}:REVIEW_GAME`;
            setPoppedByMode((prev) => ({ ...prev, [revKey]: [] }));
            setReviewReturnScreen('WORLD_START');
            setCurrentIndex(0);
            setScreen('REVIEW_GAME');
          } else {
            setScreen('VICTORY_CELEBRATION');
          }
        }
      }, 420);
    },
    [
      activeRoundNumber,
      activeTopicIndex,
      conversationsList.length,
      currentList.length,
      currentModeKey,
      curriculum.words.length,
      isConversationMode,
      isReviewMode,
      isWordsMode,
      nativeLang.code,
      pathCopy,
      prompts.correctPraise,
      reviewReturnScreen,
      safeIndex,
      stopCurrentListeningAttempt,
      streakDays,
      streakGoalDays,
      targetDisplayMain,
      targetLang.code,
    ]
  );

  const startListeningSessionRef = useRef<(lessonId: number) => Promise<void>>(
    async () => {}
  );

  // Mistake Handler -> Stops the user after they finish speaking a wrong answer, records the item for Daily Session Review Mode, shows clear correction feedback, replays the teacher voice, and gives a fresh turn
  const triggerMistakeRetry = useCallback(
    async (lessonId: number, wrongSpokenText: string) => {
      if (activeLessonIdRef.current !== lessonId) return;
      stopCurrentListeningAttempt();
      setVoiceLevel(0);
      setIsMistake(true);
      setHeardTranscript(wrongSpokenText || '...');
      setPhase('retry');

      // Record this missed word or phrase for the Daily Session 'Review' Game Mode!
      if (!isReviewMode) {
        const mistakeId = isConversationMode
          ? `phrase:${targetLang.code}:${activeTopicIndex}:${activeRoundNumber}:${safeIndex}`
          : `word:${targetLang.code}:${safeIndex}`;
        const itemMeaning = isConversationMode
          ? currentConvItem?.translations?.[nativeLang.code] ||
            currentConvItem?.urduMeaning ||
            currentConvItem?.englishMeaning ||
            targetFullLabel
          : currentWordItem?.translations?.[nativeLang.code] ||
            currentWordItem?.englishMeaning ||
            targetFullLabel;
        const itemEngMeaning = isConversationMode
          ? currentConvItem?.englishMeaning || targetFullLabel
          : currentWordItem?.englishMeaning || targetFullLabel;

        setSessionMistakes((prev) => {
          const existingIdx = prev.findIndex((m) => m.id === mistakeId);
          if (existingIdx >= 0) {
            const copy = [...prev];
            copy[existingIdx] = {
              ...copy[existingIdx],
              wrongHeardSample:
                wrongSpokenText || copy[existingIdx].wrongHeardSample,
              mistakeCount: copy[existingIdx].mistakeCount + 1,
            };
            return copy;
          }
          return [
            ...prev,
            {
              id: mistakeId,
              kind: isConversationMode ? 'phrase' : 'word',
              mainText: targetDisplayMain,
              pronunciation: targetPhonetic || targetDisplayMain,
              nativeMeaning: itemMeaning,
              englishMeaning: itemEngMeaning,
              acceptedMatches: targetAcceptedMatches,
              color: balloonColor,
              icon: isConversationMode
                ? currentConvItem?.icon
                : currentWordItem?.icon,
              situation: isConversationMode
                ? currentConvItem?.situation
                : undefined,
              wrongHeardSample: wrongSpokenText || undefined,
              mistakeCount: 1,
            },
          ];
        });
      }

      setStatusMessage(
        wrongSpokenText
          ? prompts.mistakeWithHeard(wrongSpokenText, targetFullLabel)
          : prompts.mistakeUnclear(targetFullLabel)
      );
      playGentleRetryTone();

      // Hold the stop/correction message clearly for 1.5s before the teacher speaks again
      await new Promise((r) => setTimeout(r, 1500));
      if (activeLessonIdRef.current !== lessonId) return;

      setPhase('speaking');
      setStatusMessage(
        prompts.listenAgainPrompt(`${targetDisplayMain} — ${targetFullLabel}`)
      );
      await pronounceText(
        targetSpeechText,
        targetLang.bcp47,
        targetLang.name,
        targetPhonetic
      );
      if (activeLessonIdRef.current !== lessonId) return;

      // Ultra-short 80ms guard after teacher finishes speaking so microphone is ready virtually instantly!
      await new Promise((r) => setTimeout(r, 80));
      if (activeLessonIdRef.current !== lessonId) return;

      startListeningSessionRef.current(lessonId);
    },
    [
      activeRoundNumber,
      activeTopicIndex,
      balloonColor,
      currentConvItem,
      currentWordItem,
      isConversationMode,
      isReviewMode,
      nativeLang.code,
      prompts,
      safeIndex,
      stopCurrentListeningAttempt,
      targetAcceptedMatches,
      targetDisplayMain,
      targetFullLabel,
      targetLang.bcp47,
      targetLang.code,
      targetLang.name,
      targetPhonetic,
      targetSpeechText,
    ]
  );

  // Start Listening Session:
  // 1. Opens AFTER teacher voice has completely finished (+ 450ms echo guard).
  // 2. Uses continuous recognition so the user gets full uninterrupted time to speak.
  // 3. Only stops & corrects (triggerMistakeRetry) AFTER the user finishes speaking a wrong answer and pauses!
  const startListeningSession = useCallback(
    async (lessonId: number) => {
      if (activeLessonIdRef.current !== lessonId) return;
      getSharedAudioContext();
      stopCurrentListeningAttempt();

      setPhase('listening');
      setIsMistake(false);
      setHeardTranscript('');
      const askPrompt = isConversationMode
        ? prompts.repeatPhrasePrompt(targetDisplayMain)
        : isWordsMode
        ? prompts.repeatWordPrompt(targetFullLabel)
        : prompts.repeatLetterPrompt(targetFullLabel);
      setStatusMessage(askPrompt);
      playMicStartChime();

      let resolved = false;
      let sessionExpired = false;
      let latestWrongHeard = '';
      const sessionStartTime = Date.now();
      const capturedTranscripts: string[] = [];

      const stream = await ensurePersistentMicStream();
      if (activeLessonIdRef.current !== lessonId) return;

      if (!stream) {
        setStatusMessage(
          'Microphone permission is blocked. Please allow microphone access in your browser.'
        );
        setPhase('mic_ready');
        return;
      }

      const SpeechRecognitionAPI =
        typeof window !== 'undefined'
          ? (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition
          : null;

      if (!SpeechRecognitionAPI) {
        setStatusMessage(
          'Speech recognition requires Google Chrome, Safari, or Edge.'
        );
        setPhase('mic_ready');
        return;
      }

      const schedulePostSpeechMistakeCheck = () => {
        if (mistakeSettleTimerRef.current) {
          clearTimeout(mistakeSettleTimerRef.current);
          mistakeSettleTimerRef.current = null;
        }
        // Give the user plenty of time to finish their full word or sentence before stopping them
        const pauseWaitMs = isConversationMode ? 3200 : isWordsMode ? 2300 : 2000;

        const evaluateAfterSilence = () => {
          if (resolved || activeLessonIdRef.current !== lessonId) return;

          // If the user is still actively speaking into the microphone, give them more time!
          if (currentRmsLevelRef.current > 14) {
            mistakeSettleTimerRef.current = setTimeout(evaluateAfterSilence, 900);
            return;
          }

          // Re-verify if any captured transcript or combined utterance matched
          for (const candidate of capturedTranscripts) {
            if (doesSpokenCandidateMatch(candidate)) {
              resolved = true;
              triggerSuccessAndAdvance(lessonId, targetDisplayMain);
              return;
            }
          }

          if (latestWrongHeard) {
            resolved = true;
            triggerMistakeRetry(lessonId, latestWrongHeard);
          }
        };

        mistakeSettleTimerRef.current = setTimeout(
          evaluateAfterSilence,
          pauseWaitMs
        );
      };

      try {
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.lang = targetLang.bcp47;
        // In Alphabet and Words mode, continuous=false forces browser to dispatch interim results in < 100ms!
        recognition.continuous = isConversationMode;
        recognition.interimResults = true;
        recognition.maxAlternatives = 10;

        recognition.onresult = (event: any) => {
          if (resolved || activeLessonIdRef.current !== lessonId) return;

          const primarySegments: string[] = [];
          let matchedCandidate = '';

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            const topText = (result[0]?.transcript || '').trim();
            if (topText) {
              primarySegments.push(topText);
            }

            for (let j = 0; j < result.length; j++) {
              const t = (result[j]?.transcript || '').trim();
              if (!t) continue;
              if (!capturedTranscripts.includes(t)) {
                capturedTranscripts.push(t);
              }
              if (!matchedCandidate && doesSpokenCandidateMatch(t)) {
                matchedCandidate = t;
                break;
              }
            }
            if (matchedCandidate) break;
          }

          const fullUtterance = primarySegments.join(' ').trim();
          if (fullUtterance) {
            setHeardTranscript(fullUtterance);
            latestWrongHeard = fullUtterance;
            if (!capturedTranscripts.includes(fullUtterance)) {
              capturedTranscripts.push(fullUtterance);
            }
            if (!matchedCandidate && doesSpokenCandidateMatch(fullUtterance)) {
              matchedCandidate = fullUtterance;
            }
          }

          // INSTANT POP! The moment candidate matches, trigger success immediately with zero artificial delay!
          if (matchedCandidate) {
            resolved = true;
            triggerSuccessAndAdvance(lessonId, matchedCandidate);
            return;
          }

          // User is speaking something that hasn't matched yet -> wait until silence before retry
          if (latestWrongHeard) {
            schedulePostSpeechMistakeCheck();
          }
        };

        recognition.onerror = (event: any) => {
          if (resolved || activeLessonIdRef.current !== lessonId) return;
          const err = event?.error || '';
          if (err === 'aborted' || err === 'no-speech') return;
          if (err === 'not-allowed' || err === 'service-not-allowed') {
            resolved = true;
            stopCurrentListeningAttempt();
            setVoiceLevel(0);
            setPhase('mic_ready');
            setStatusMessage(
              'Microphone permission blocked. Please allow microphone access.'
            );
          }
        };

        recognition.onend = () => {
          if (resolved || activeLessonIdRef.current !== lessonId) return;

          // 1. Check if any captured transcript matched the target
          for (const candidate of capturedTranscripts) {
            if (doesSpokenCandidateMatch(candidate)) {
              resolved = true;
              triggerSuccessAndAdvance(lessonId, targetDisplayMain);
              return;
            }
          }

          // 2. Seamlessly restart recognition loop without delay so microphone stays 100% automatic & hands-free!
          if (!sessionExpired && activeLessonIdRef.current === lessonId) {
            try {
              recognition.start();
              return;
            } catch {}
          }

          // 3. Fallback if browser blocked restart
          resolved = true;
          stopCurrentListeningAttempt();
          setVoiceLevel(0);
          setPhase('mic_ready');
          setStatusMessage(prompts.tapMicPrompt(targetFullLabel));
        };

        recognition.start();
      } catch {
        setPhase('mic_ready');
        setStatusMessage(prompts.tapMicPrompt(targetFullLabel));
        return;
      }

      // Live Time-Domain RMS Voice Waveform Meter (Visual indicator + active speech guard)
      if (analyserRef.current) {
        const analyser = analyserRef.current;
        const timeData = new Uint8Array(analyser.fftSize);

        const monitorMic = () => {
          if (resolved || activeLessonIdRef.current !== lessonId) return;
          analyser.getByteTimeDomainData(timeData);

          let sumSquares = 0;
          for (let i = 0; i < timeData.length; i++) {
            const centered = (timeData[i] - 128) / 128;
            sumSquares += centered * centered;
          }
          const rms = Math.sqrt(sumSquares / timeData.length);
          // Enhanced human voice logarithmic scaling for ultra-responsive visual meter
          const levelPercent = Math.min(100, Math.round(Math.pow(rms * 980, 0.85)));
          currentRmsLevelRef.current = levelPercent;
          setVoiceLevel(levelPercent);

          rafIdRef.current = requestAnimationFrame(monitorMic);
        };

        rafIdRef.current = requestAnimationFrame(monitorMic);
      }

      // Keep automatic hands-free listening alive; only trigger mistake retry if wrong speech was heard
      listenTimeoutRef.current = setTimeout(
        () => {
          if (resolved || activeLessonIdRef.current !== lessonId) return;
          if (latestWrongHeard) {
            sessionExpired = true;
            resolved = true;
            triggerMistakeRetry(lessonId, latestWrongHeard);
            return;
          }
          // Otherwise keep listening automatically without dropping out of listening phase!
          setStatusMessage(prompts.micOnSpeak(targetDisplayMain));
        },
        isConversationMode ? 28000 : 22000
      );
    },
    [
      doesSpokenCandidateMatch,
      ensurePersistentMicStream,
      isConversationMode,
      isWordsMode,
      prompts,
      stopCurrentListeningAttempt,
      targetDisplayMain,
      targetFullLabel,
      targetLang.bcp47,
      triggerMistakeRetry,
      triggerSuccessAndAdvance,
    ]
  );

  useEffect(() => {
    startListeningSessionRef.current = startListeningSession;
  }, [startListeningSession]);

  // Turn-Taking Sequence for Each Letter / Word / Conversation Phrase:
  // 0. Preload current & upcoming 5 TTS items in background immediately
  // 1. Snappy 0.15s 3D Balloon Swirl
  // 2. Teacher voice speaks FIRST clearly
  // 3. Wait 450ms after teacher finishes so zero speaker echo enters the mic, then give user full time to speak!
  useEffect(() => {
    if (!isPlayableBalloonLesson) {
      stopCurrentListeningAttempt();
      return;
    }

    const lessonId = ++activeLessonIdRef.current;

    // Preload current + next 5 items immediately so TTS is 0ms instant!
    for (let offset = 0; offset <= 5; offset++) {
      const idx = safeIndex + offset;
      if (idx < currentList.length) {
        const item = currentList[idx] as any;
        const txt = isReviewMode
          ? item.mainText
          : isConversationMode
          ? item.phrase
          : item.word;
        if (txt) {
          preloadPronounceText(txt, targetLang.bcp47, targetLang.name);
        }
      }
    }

    const runStep = async () => {
      setConvStepModeOverride('auto');
      setHeardTranscript('');
      setIsMistake(false);
      setPhase('swirling');
      setStatusMessage(`${targetDisplayMain} — ${targetFullLabel}`);
      playBalloonSwirlSound();

      // Step 1: Fast 0.15s 3D Carousel Swirl
      await new Promise((r) => setTimeout(r, 150));
      if (activeLessonIdRef.current !== lessonId) return;

      // Step 2: Teacher voice speaks FIRST clearly & loudly!
      setPhase('speaking');
      setStatusMessage(
        prompts.listenPrompt(`${targetDisplayMain} — ${targetFullLabel}`)
      );
      await pronounceText(
        targetSpeechText,
        targetLang.bcp47,
        targetLang.name,
        targetPhonetic
      );
      if (activeLessonIdRef.current !== lessonId) return;

      // Wait 450ms after teacher finishes speaking so speaker echo completely clears before opening the mic automatically
      await new Promise((r) => setTimeout(r, 450));
      if (activeLessonIdRef.current !== lessonId) return;

      // Step 3: 100% Automatic Speak System — immediately open microphone for both Words and Conversation!
      startListeningSession(lessonId);
    };

    const startTimeout = setTimeout(() => {
      runStep();
    }, 0);

    return () => {
      clearTimeout(startTimeout);
      stopCurrentListeningAttempt();
    };
  }, [
    isPlayableBalloonLesson,
    isConversationMode,
    isReviewMode,
    isWordsMode,
    currentList,
    safeIndex,
    prompts,
    dashT,
    targetDisplayMain,
    targetFullLabel,
    targetSpeechText,
    targetPhonetic,
    targetLang.bcp47,
    targetLang.name,
    startListeningSession,
    stopCurrentListeningAttempt,
  ]);

  const handleManualReplaySound = async () => {
    const lessonId = ++activeLessonIdRef.current;
    getSharedAudioContext();
    stopCurrentListeningAttempt();
    setPhase('speaking');
    setStatusMessage(
      prompts.listenPrompt(`${targetDisplayMain} — ${targetFullLabel}`)
    );
    await pronounceText(
      targetSpeechText,
      targetLang.bcp47,
      targetLang.name,
      targetPhonetic
    );
    if (activeLessonIdRef.current !== lessonId) return;

    await new Promise((r) => setTimeout(r, 450));
    if (activeLessonIdRef.current !== lessonId) return;

    startListeningSession(lessonId);
  };

  // Guaranteed Meaning in the User's Spoken Language (nativeLang) for Words, Conversations, and Review Mode
  const nativeMeaningText = useMemo(() => {
    if (isReviewMode && currentReviewItem) {
      return currentReviewItem.nativeMeaning || currentReviewItem.englishMeaning || '';
    }
    if (isConversationMode && currentConvItem) {
      const directTrans = currentConvItem.translations?.[nativeLang.code];
      if (directTrans) return directTrans;
      if (nativeLang.code === 'ur' && currentConvItem.urduMeaning) {
        return currentConvItem.urduMeaning;
      }
      const nativeBaseConvs = getConversationsForLanguage(nativeLang.code);
      const native90 = getNinetyPlusConversationsForLang(
        nativeLang,
        nativeBaseConvs
      );
      const nativeRound = getSentencesForTopicRound(
        native90,
        activeTopicIndex,
        activeRoundNumber,
        nativeLang
      );
      if (nativeRound[safeIndex]?.phrase) {
        return nativeRound[safeIndex].phrase;
      }
      return currentConvItem.englishMeaning || '';
    }
    if (isWordsMode && currentWordItem) {
      const directWordTrans = currentWordItem.translations?.[nativeLang.code];
      if (directWordTrans) return directWordTrans;
      const nativeBuiltIn = getBuiltInCurriculum(nativeLang.code);
      if (nativeBuiltIn?.words) {
        const byMeaning = nativeBuiltIn.words.find(
          (w) =>
            w.englishMeaning.toLowerCase() ===
            currentWordItem.englishMeaning.toLowerCase()
        );
        if (byMeaning?.word) return byMeaning.word;
        if (nativeBuiltIn.words[safeIndex]?.word) {
          return nativeBuiltIn.words[safeIndex].word;
        }
      }
      return currentWordItem.englishMeaning || '';
    }
    return '';
  }, [
    activeRoundNumber,
    activeTopicIndex,
    currentConvItem,
    currentReviewItem,
    currentWordItem,
    isConversationMode,
    isReviewMode,
    isWordsMode,
    nativeLang,
    safeIndex,
  ]);

  // Hand-Holding Teacher Mode ("ایک جو ٹیچر ہاتھ پکڑ کے بچوں کو سکھاتی ہے نا، ویسے")
  const isHandHoldingTeacherMode =
    handHoldingTeacherOverride !== null
      ? handHoldingTeacherOverride
      : onboardingData.proficiencyType === 'scratch' ||
        difficultyLevel === 'easy';

  // Break target word or conversation sentence into bite-sized child-friendly stepping stones (words)
  const teacherSyllableChunks = useMemo<string[]>(() => {
    const raw = (targetDisplayMain || '').trim();
    if (!raw) return [];
    // If phrase has multiple words, each word is a stepping stone
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      return words.slice(0, 6);
    }
    const single = words[0];
    // Never slice non-Latin scripts (Arabic, Urdu, Persian, Pashto, Sindhi, Hindi, Bengali, Tamil, etc.)
    // in half because slicing breaks connected ligatures, diacritics, and vowel matras and ruins pronunciation!
    if (/[^\u0000-\u007F]/.test(single) || single.length <= 4) {
      return [single];
    }
    const mid = Math.ceil(single.length / 2);
    if (single.length <= 7) {
      return [single.slice(0, mid), single.slice(mid)];
    }
    const third = Math.ceil(single.length / 3);
    return [
      single.slice(0, third),
      single.slice(third, third * 2),
      single.slice(third * 2),
    ].filter(Boolean);
  }, [targetDisplayMain]);

  const [studioSpeedMode, setStudioSpeedMode] = useState<1.0 | 0.78>(1.0);

  const handleToggleStudioSpeed = useCallback((speed: 1.0 | 0.78) => {
    setStudioSpeedMode(speed);
    setAudioPlaybackSpeed(speed);
  }, []);

  // High-clarity neural teacher voice for Beginner Hand-Holding Mode (uses pitch-preserved 0.78x slow studio audio)
  const speakSlowTeacherChunk = useCallback(
    async (chunkText: string, chunkIdx: number | null = null) => {
      getSharedAudioContext();
      setActiveTeacherChunkIdx(chunkIdx);
      await pronounceText(
        chunkText,
        targetLang.bcp47,
        targetLang.name,
        targetPhonetic,
        0.78
      );
      setActiveTeacherChunkIdx(null);
    },
    [targetLang.bcp47, targetLang.name, targetPhonetic]
  );

  // Studio Keyboard Shortcuts during playable balloon lessons ([Space] Mic, [R] Replay, [←/→] Navigate)
  useEffect(() => {
    if (!isPlayableBalloonLesson || isDrawerOpen || hubModalOpen) return;
    const onLessonKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        getSharedAudioContext();
        startListeningSession(activeLessonIdRef.current);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleManualReplaySound();
      } else if (e.key === 'ArrowLeft') {
        if (safeIndex > 0) {
          e.preventDefault();
          getSharedAudioContext();
          stopCurrentListeningAttempt();
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      } else if (e.key === 'ArrowRight') {
        if (canGoNext && safeIndex + 1 < currentList.length) {
          e.preventDefault();
          getSharedAudioContext();
          stopCurrentListeningAttempt();
          setCurrentIndex((prev) => Math.min(maxUnlockedIndex, prev + 1));
        }
      }
    };
    window.addEventListener('keydown', onLessonKeyDown);
    return () => window.removeEventListener('keydown', onLessonKeyDown);
  }, [
    isPlayableBalloonLesson,
    isDrawerOpen,
    hubModalOpen,
    phase,
    safeIndex,
    canGoNext,
    currentList.length,
    maxUnlockedIndex,
    targetDisplayMain,
    startListeningSession,
    stopCurrentListeningAttempt,
    triggerSuccessAndAdvance,
  ]);

  // Is the user currently in the standalone Onboarding or Sign-In Gate?
  const isInStandaloneGate =
    !hasCompletedOnboarding ||
    screen === 'LANGUAGE_SELECT' ||
    screen === 'AUTH_ONBOARDING';

  return (
    <div className="relative w-full min-h-dvh overflow-x-hidden">
      {/* =====================================================================
          STANDALONE FULL-SCREEN ONBOARDING & MANDATORY SIGN-IN GATE
          (Until the learner completes all 5 Onboarding Steps AND Signs In /
          Enters Full Details, the main Dashboard & Lessons DO NOT open!)
          ===================================================================== */}
      {isInStandaloneGate ? (
        <div
          className={`relative min-h-dvh w-full flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300 ${
            isDark
              ? 'bg-[#060B16] text-white'
              : 'bg-gradient-to-br from-[#BAE0FF] via-[#DCEEFF] to-[#F2F8FF] text-slate-900'
          }`}
        >
          {/* Scenic Backdrop (Sun in Light Mode, Uploaded 3D Moon in Dark Mode) */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div className={isDark ? 'opacity-85' : 'opacity-75'}>
              <GameWorldBackdrop isDark={isDark} />
            </div>
          </div>

          {/* Minimal Top Brand Bar for Standalone Onboarding Gate */}
          <div className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#0066FF] p-0.5 shadow-sm flex items-center justify-center">
                <div
                  className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                    isDark ? 'bg-slate-900' : 'bg-white'
                  }`}
                >
                  <img
                    src="/assets/aistudio/balloon_variant.png"
                    alt="Learning Balloon"
                    referrerPolicy="no-referrer"
                    className="w-6 h-7 object-contain"
                  />
                </div>
              </div>
              <div>
                <div className="font-display font-extrabold text-base sm:text-lg tracking-tight leading-none">
                  Learning Balloon
                </div>
                <div className="text-[11px] font-bold opacity-70 mt-0.5">
                  Voice-Powered Language Studio
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => setScreen('AUTH_ONBOARDING')}
                    className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {currentUser.displayName ||
                        currentUser.email ||
                        'Signed In'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleSignOut}
                    className="px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-display font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isSigningInGoogle}
                  onClick={handleOfficialGoogleSignIn}
                  className="px-3.5 py-2 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <span className="w-4 h-4 rounded-full bg-white text-[#0066FF] font-black text-[10px] flex items-center justify-center shrink-0">
                    G
                  </span>
                  <span>
                    {isSigningInGoogle ? 'Opening Google...' : 'Sign in with Google'}
                  </span>
                </button>
              )}
              {hasCompletedOnboarding && (
                <button
                  type="button"
                  onClick={() => setScreen('WORLD_START')}
                  className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-display font-extrabold text-xs shadow-sm cursor-pointer"
                >
                  {prompts.backToGame}
                </button>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-3.5 py-2 rounded-full border flex items-center gap-1.5 font-display font-bold text-xs cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-amber-300'
                    : 'bg-white/90 border-sky-200 text-slate-700 shadow-2xs'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Center Standalone Screen: Either 5-Step Sequential Onboarding OR Step 6 Mandatory Sign-In */}
          <div className="relative z-10 flex-1 flex items-center justify-center w-full py-2">
            {screen === 'LANGUAGE_SELECT' ? (
              <LanguageSelectionScreen
                key={`${langModalInitialStep}-${targetLang.code}`}
                initialNative={nativeLang}
                initialTarget={targetLang}
                initialStep={langModalInitialStep}
                initialOnboardingData={onboardingData}
                hasCompletedOnboarding={hasCompletedOnboarding}
                onSelectNative={(selectedLang) => {
                  setNativeLang(selectedLang);
                }}
                onConfirm={(selectedNative, selectedTarget, submittedOb) => {
                  handleConfirmLanguages(
                    selectedNative,
                    selectedTarget,
                    true,
                    submittedOb
                  );
                }}
                onOpenSignIn={() => setScreen('AUTH_ONBOARDING')}
                onCancel={
                  hasSavedLangs && hasCompletedOnboarding
                    ? () => setScreen('WORLD_START')
                    : undefined
                }
                isDark={isDark}
              />
            ) : (
              /* SCREEN 6: MANDATORY SIGN-IN & LEARNER REGISTRATION GATE */
              <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.24 }}
                  dir={signInCertCopy.rtl ? 'rtl' : 'ltr'}
                  className={`w-full rounded-[32px] p-5 sm:p-8 border transition-all duration-300 ${
                    isDark
                      ? 'bg-[#0F172A]/95 border-slate-700/80 text-white shadow-[0_24px_60px_rgba(0,0,0,0.55)]'
                      : 'bg-white border-sky-100 text-slate-900 shadow-[0_24px_60px_rgba(14,116,144,0.14)]'
                  }`}
                >
                  {/* Top Back to Step 5 Button + Final Step Badge */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (hasCompletedOnboarding || hasSavedLangs) {
                          setScreen('WORLD_START');
                        } else {
                          setLangModalInitialStep('daily_goal');
                          setScreen('LANGUAGE_SELECT');
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>
                        {hasCompletedOnboarding || hasSavedLangs
                          ? prompts.backToGame
                          : obCopy.backBtn}
                      </span>
                    </button>

                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-extrabold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>FINAL STEP · SIGN IN & PROFILE</span>
                    </span>
                  </div>

                  {/* Soft-Blue Hero Header inside Sign-In Card */}
                  <div
                    className={`flex flex-col items-center text-center mb-5 p-5 rounded-2xl border ${
                      isDark
                        ? 'bg-gradient-to-r from-[#0F172A] via-[#1E3A5F] to-[#1E293B] border-sky-500/30'
                        : 'bg-gradient-to-r from-[#DCEBFF] via-[#C3E0FF] to-[#9AD0FF] border-white'
                    }`}
                  >
                    <div className="inline-flex flex-wrap items-center justify-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-sky-200 dark:border-slate-700 mb-2.5 shadow-xs">
                      <img
                        src="/assets/aistudio/balloon_variant.png"
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-6 h-8 object-contain"
                      />
                      <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-[#0066FF] dark:text-sky-400">
                        Sign in with Google · {dashT.brandTitle}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] dark:text-sky-300 text-xs font-extrabold">
                        {nativeLang.flag} {nativeLang.nativeName} →{' '}
                        {targetLang.flag} {targetLang.nativeName}
                      </span>
                    </div>
                    <h1 className="font-display text-lg sm:text-2xl font-extrabold">
                      {signInCertCopy.signInTitle}
                    </h1>
                    <p
                      className={`text-xs sm:text-sm mt-1 font-medium ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {signInCertCopy.signInSubtitle}
                    </p>
                  </div>

                  {/* Step 1: Official Sign in with Google + Sign Out Controls */}
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-extrabold mb-1.5">
                      {signInCertCopy.step1GoogleLabel}
                    </label>
                    {currentUser ? (
                      <div
                        className={`p-4 rounded-2xl border space-y-3 ${
                          isDark
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            {currentUser.photoURL ? (
                              <img
                                src={currentUser.photoURL}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-full border-2 border-emerald-400 object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-display font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                {(
                                  currentUser.displayName ||
                                  currentUser.email ||
                                  'G'
                                )
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="text-xs sm:text-sm font-extrabold truncate">
                                  {currentUser.displayName || 'Google Account'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                                  ✓ Google Verified
                                </span>
                              </div>
                              <div
                                dir="ltr"
                                className="text-xs font-bold opacity-85 truncate mt-0.5"
                              >
                                {currentUser.email || ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {isUserAdmin(currentUser) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminCommandUnlocked(true);
                                  setHubModalTab('admin');
                                  setHubModalOpen(true);
                                }}
                                className="px-3.5 py-2 rounded-full bg-[#0066FF] text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#0052CC]"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>👑 {dashT.navAdmin}</span>
                              </button>
                            )}

                            {/* Official Google Sign-In Popup Button (Switch / Choose Official Google Account) */}
                            <button
                              type="button"
                              disabled={isSigningInGoogle}
                              onClick={handleOfficialGoogleSignIn}
                              className="px-4 py-2 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-xs font-extrabold border border-slate-300 shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                              <span className="w-4 h-4 rounded-full bg-[#4285F4] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                G
                              </span>
                              <span>
                                {isSigningInGoogle
                                  ? signInCertCopy.googleConnectingText
                                  : 'Sign in with Google'}
                              </span>
                            </button>

                            {/* Sign Out Button */}
                            <button
                              type="button"
                              onClick={handleGoogleSignOut}
                              className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Sign out</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Primary Official Google Sign-In Button (Opens Official Google Popup Window) */}
                        <button
                          type="button"
                          disabled={isSigningInGoogle}
                          onClick={handleOfficialGoogleSignIn}
                          className="w-full py-3.5 px-5 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-extrabold text-sm sm:text-base shadow-[0_8px_20px_rgba(0,102,255,0.3)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 transition-transform active:scale-[0.99]"
                        >
                          <span className="w-7 h-7 rounded-full bg-white text-[#4285F4] font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                            G
                          </span>
                          <span>
                            {isSigningInGoogle
                              ? signInCertCopy.googleConnectingText
                              : 'Sign in with Google'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Username Input Box */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="block text-xs sm:text-sm font-extrabold">
                        {signInCertCopy.step2UsernameLabel}
                      </label>
                      {isUserAdmin(currentUser) && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdminCommandUnlocked(true);
                            setHubModalTab('admin');
                            setHubModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs cursor-pointer hover:bg-emerald-500"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>👑 {dashT.navAdmin}</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="text"
                          value={learnerName}
                          onChange={(e) => {
                            const val = e.target.value;
                            const secCheck = inspectAndGuardInput(
                              val,
                              'Sign-In Username Field',
                              {
                                name:
                                  learnerName ||
                                  currentUser?.displayName ||
                                  'Login Visitor',
                                email: currentUser?.email || 'Unauthenticated',
                              }
                            );
                            if (secCheck.blocked && secCheck.incident) {
                              setActiveSecurityAlert(secCheck.incident);
                              setOnboardingError(
                                '🚨 SECURITY ALERT: Hack / Script Injection attempt blocked and reported to Admin!'
                              );
                              return;
                            }
                            const lowerVal = val.toLowerCase();
                            if (
                              lowerVal.includes('/mustafa') ||
                              val.includes('/مصطفی')
                            ) {
                              const cleanedName = val
                                .replace(/\/mustafa/gi, '')
                                .replace(/\/مصطفی/g, '')
                                .trim();
                              setLearnerName(cleanedName);
                              if (isUserAdmin(currentUser)) {
                                setAdminCommandUnlocked(true);
                                setHubModalTab('admin');
                                setHubModalOpen(true);
                              }
                              return;
                            }
                            setLearnerName(val);
                            if (onboardingError) setOnboardingError('');
                          }}
                          placeholder={signInCertCopy.usernamePlaceholder}
                          className={`w-full pl-4 pr-10 py-3 rounded-2xl border text-sm sm:text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                            isDark
                              ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-400'
                              : 'bg-[#F3F8FF] border-sky-100 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                          }`}
                        />
                        {learnerName.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setLearnerName('');
                              if (onboardingError) setOnboardingError('');
                            }}
                            title="Clear name"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200/80 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-black flex items-center justify-center cursor-pointer transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
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
                            rec.onresult = (ev: any) => {
                              const transcript = (
                                ev.results?.[0]?.[0]?.transcript || ''
                              ).trim();
                              if (transcript) {
                                setLearnerName(transcript);
                              }
                            };
                            rec.start();
                          } catch {}
                        }}
                        className="px-4 py-3 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Mic className="w-4 h-4" />
                        <span>{pathCopy.speakUsernameBtn}</span>
                      </button>
                    </div>
                    {learnerName.trim() && (
                      <div className="mt-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span>✓ {pathCopy.usernameBadgeLabel}</span>
                        <span>
                          {localizeUsernameForSpokenLanguage(
                            learnerName,
                            nativeLang,
                            dashT.defaultLearnerName
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {onboardingError && (
                    <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-500 dark:text-rose-300 text-xs font-extrabold text-center">
                      {onboardingError}
                    </div>
                  )}

                  {/* Continue to Unlock Learning Balloon Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const finalName =
                          learnerName.trim() ||
                          currentUser?.displayName?.trim() ||
                          '';
                        if (!finalName) {
                          setOnboardingError(
                            signInCertCopy.usernameRequiredError
                          );
                          return;
                        }
                        setLearnerName(finalName);
                        setHasCompletedOnboarding(true);
                        try {
                          localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
                        } catch {}
                        setScreen('WORLD_START');
                        if (dailyBonusClaimedDate !== getTodayDateString()) {
                          setTimeout(() => setDailyBonusModalOpen(true), 380);
                        }
                      }}
                      className="flex-1 py-4 px-6 rounded-full bg-gradient-to-r from-[#0066FF] via-indigo-600 to-emerald-600 hover:brightness-110 text-white font-display font-extrabold text-sm sm:text-base shadow-[0_10px_24px_rgba(0,102,255,0.34)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{signInCertCopy.continueButton}</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          <div className="relative z-10 text-center text-[11px] font-bold opacity-60 py-1">
            Learning Balloon · Step-by-Step Voice Language Studio
          </div>
        </div>
      ) : (
      /* Unified 3-Column Learning Balloon Theme Shell (ONLY opens AFTER Onboarding + Sign-In are completed!) */
      <LearningBalloonDashboard
        isDark={isDark}
        onToggleTheme={toggleTheme}
        currentUser={currentUser}
        onGoogleSignIn={handleOfficialGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        isSigningInGoogle={isSigningInGoogle}
        learnerName={learnerName}
        onChangeLearnerName={setLearnerName}
        nativeLang={nativeLang}
        targetLang={targetLang}
        onSelectNativeLang={(selectedLang) => {
          handleConfirmLanguages(selectedLang, targetLang, false);
        }}
        onSelectTargetLang={(selectedLang) => {
          handleConfirmLanguages(nativeLang, selectedLang, false);
        }}
        onOpenLanguageModal={(initialStep = 'native') => {
          stopCurrentListeningAttempt();
          setLangModalInitialStep(initialStep);
          setScreen('LANGUAGE_SELECT');
        }}
        onOpenSignInModal={() => {
          stopCurrentListeningAttempt();
          setScreen('AUTH_ONBOARDING');
        }}
        difficultyLevel={difficultyLevel}
        streakDays={streakDays}
        streakGoalDays={streakGoalDays}
        stars={stars}
        alphabetsCompleted={completedTopicsCount}
        alphabetsTotal={NINETY_CONVERSATION_TOPICS.length}
        wordsCompleted={poppedWords.length}
        wordsTotal={curriculum.words.length}
        conversationsCompleted={totalRoundStarsCompleted}
        conversationsTotal={conversationsList.length}
        reviewMistakesCount={sessionMistakes.length}
        isWordsUnlocked={isWordsUnlocked}
        isConversationUnlocked={isConversationUnlocked}
        isCourseFullyCompleted={isCourseFullyCompleted}
        loadingCurriculum={loadingCurriculum}
        canOpenAdminPanel={isAdminUser}
        activeScreen={screen}
        onNavigateHome={() => {
          stopCurrentListeningAttempt();
          setScreen('WORLD_START');
        }}
        onStartStage={(stage) => {
          tryOpenMode(stage, true);
        }}
        onOpenHubTab={(tab) => {
          setHubModalTab(
            (tab === 'admin' || tab === 'analytics') && !isAdminUser
              ? 'streak_level'
              : tab === 'analytics'
              ? 'admin'
              : tab
          );
          setHubModalOpen(true);
        }}
        dailyBonusClaimedToday={dailyBonusClaimedDate === getTodayDateString()}
        dailyBonusStarsAmount={
          DAILY_BONUS_TIERS[
            Math.min(
              6,
              Math.max(0, (Math.max(1, streakDays) - 1) % 7)
            )
          ] || 15
        }
        onOpenDailyBalloonBonus={() => {
          setDailyBonusPoppedIndex(null);
          setDailyBonusModalOpen(true);
        }}
      >
        {/* Progression Lock Notice Banner */}
        <AnimatePresence>
          {lockNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              dir={dashT.rtl ? 'rtl' : 'ltr'}
              className="relative z-40 mx-auto mb-3 px-4 py-2 rounded-2xl bg-[#0066FF] text-white text-xs sm:text-sm font-extrabold shadow-[0_8px_20px_rgba(0,102,255,0.3)] flex items-center justify-center gap-2 border border-white/60 w-full text-center pointer-events-auto"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{lockNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCREEN: 90 CONVERSATION TOPICS PATH (15 ROUNDS PER TOPIC CIRCLE, DUOLINGO STYLE) */}
        {screen === 'CONVERSATION_GAME' && convViewMode === 'PATH' && (
          <div className="w-full flex flex-col gap-3">
            {lastCompletedBanner && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                dir={nativeLang.rtl ? 'rtl' : 'ltr'}
                className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-display font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{lastCompletedBanner}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLastCompletedBanner('')}
                  className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}
            <ConversationTopicPath
              nativeLang={nativeLang}
              targetLang={targetLang}
              isDark={isDark}
              learnerName={learnerName}
              onChangeLearnerName={setLearnerName}
              allConversations={conversationsList}
              topicRounds={currentTopicRoundsMap}
              maxUnlockedTopicId={adminUnlockedTopicsCount}
              claimedChests={claimedChests}
              onClaimChest={(unitNum) => {
                if (claimedChests.includes(unitNum)) return;
                setClaimedChests((prev) => [...prev, unitNum]);
                setStars((prev) => prev + 10);
                playStarRewardFanfare();
              }}
              onStartTopicRound={handleStartTopicRound}
              onBackHome={() => {
                stopCurrentListeningAttempt();
                setScreen('WORLD_START');
              }}
              onOpenWordsMode={() => tryOpenMode('WORDS_GAME')}
            />
          </div>
        )}

        {/* FULL-SCREEN DEDICATED BALLOON LESSON INTERFACE (Words & Active Conversation Round Play) */}
        {isPlayableBalloonLesson && (
          <div
            className={`fixed inset-0 z-50 w-full h-dvh overflow-hidden flex flex-col justify-between transition-colors duration-300 ${
              isDark
                ? 'bg-[#060B16] text-white'
                : 'bg-gradient-to-b from-[#BAE0FF] via-[#DFF0FF] to-[#F4F9FF] text-slate-900'
            }`}
          >
            {/* Atmospheric Scenic & Architectural Studio Backdrop (Sun in Light Mode, Uploaded 3D Moon in Dark Mode) */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
              <div className={isDark ? 'opacity-80' : 'opacity-70'}>
                <GameWorldBackdrop isDark={isDark} />
              </div>
              <div
                className={`absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] ${
                  isDark ? 'opacity-10' : 'opacity-15'
                }`}
              />
              <div
                className={`absolute -top-28 left-1/2 -translate-x-1/2 w-[680px] h-[340px] rounded-full blur-3xl transition-all duration-700 ${
                  phase === 'listening'
                    ? 'bg-rose-500/25 dark:bg-rose-500/20'
                    : phase === 'speaking'
                    ? 'bg-sky-400/30 dark:bg-sky-500/20'
                    : phase === 'celebrating'
                    ? 'bg-amber-400/35 dark:bg-amber-400/25'
                    : 'bg-indigo-400/20 dark:bg-sky-600/15'
                }`}
              />
            </div>

            {/* Main Studio Container — Strictly Fits 100dvh on Mobile & Desktop So Bottom Footer Is Never Clipped */}
            <div className="relative z-10 max-w-6xl w-full h-full mx-auto flex flex-col justify-between gap-1 sm:gap-2 px-1.5 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] sm:p-3 overflow-hidden">
              {/* 1. COMPACT SINGLE-ROW PRO STUDIO TOP COMMAND BAR */}
              <header
                dir={dashT.rtl ? 'rtl' : 'ltr'}
                className={`shrink-0 w-full rounded-xl sm:rounded-2xl px-2 py-1 sm:px-3.5 sm:py-2 border backdrop-blur-xl transition-all ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-700/80 shadow-[0_8px_24px_rgba(0,0,0,0.45)]'
                    : 'bg-white/90 border-white shadow-[0_8px_24px_rgba(14,116,144,0.1)]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  {/* Left Cluster: Home, 90 Topics Map & Segmented Mode Switcher */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        stopCurrentListeningAttempt();
                        setScreen('WORLD_START');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer border ${
                        isDark
                          ? 'bg-slate-800/90 text-white hover:bg-slate-700 border-slate-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900 shadow-2xs'
                      }`}
                    >
                      <span>🏠</span>
                      <span>{dashT.navHome}</span>
                    </button>

                    {isConversationMode && (
                      <button
                        type="button"
                        onClick={() => {
                          stopCurrentListeningAttempt();
                          setConvViewMode('PATH');
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <span>🗺️</span>
                        <span className="hidden sm:inline">
                          {pathCopy.backToPathBtn}
                        </span>
                      </button>
                    )}

                    {/* Compact Segmented Mode Switcher */}
                    <div
                      className={`inline-flex items-center p-0.5 rounded-lg border ${
                        isDark
                          ? 'bg-slate-950/80 border-slate-800'
                          : 'bg-sky-50/90 border-sky-200/70'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => tryOpenMode('WORDS_GAME')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                          screen === 'WORDS_GAME'
                            ? 'bg-[#0066FF] text-white shadow-xs'
                            : isDark
                            ? 'text-slate-300 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🍎</span>
                        <span>{dashT.navWords} (100)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          stopCurrentListeningAttempt();
                          setConvViewMode('PATH');
                          setScreen('CONVERSATION_GAME');
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                          screen === 'CONVERSATION_GAME'
                            ? 'bg-[#0066FF] text-white shadow-xs'
                            : isDark
                            ? 'text-slate-300 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>💬</span>
                        <span>{dashT.navConversation} (90)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => tryOpenMode('REVIEW_GAME')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                          screen === 'REVIEW_GAME'
                            ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xs'
                            : sessionMistakes.length > 0
                            ? 'bg-rose-500/15 text-rose-500 dark:text-rose-300 hover:bg-rose-500/25'
                            : isDark
                            ? 'text-slate-300 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>🎯</span>
                        <span>
                          {nativeLang.code === 'ur'
                            ? 'دہرائی'
                            : nativeLang.code === 'hi'
                            ? 'रिव्यू'
                            : 'Review'}{' '}
                          ({sessionMistakes.length})
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Center Cluster: Compact Step Pills + Stage Counter + Automatic Streak & Stars */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Compact 5-step sliding window around current item */}
                    <div className="hidden xl:flex items-center gap-1">
                      {(() => {
                        const total = currentList.length;
                        const windowSize = Math.min(5, total);
                        const startIdx = Math.max(
                          0,
                          Math.min(
                            safeIndex - Math.floor(windowSize / 2),
                            total - windowSize
                          )
                        );
                        return Array.from({ length: windowSize }, (_, i) => {
                          const idx = startIdx + i;
                          const isDone = currentPoppedIndices.includes(idx);
                          const isCurrent = idx === safeIndex;
                          const isUnlocked = idx <= maxUnlockedIndex;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (!isUnlocked) {
                                  showLockToast(
                                    `🔒 ${prompts.tapMicSay(targetDisplayMain)}`
                                  );
                                  return;
                                }
                                getSharedAudioContext();
                                stopCurrentListeningAttempt();
                                setCurrentIndex(idx);
                              }}
                              className={`h-6 min-w-[24px] px-1.5 rounded-md text-[10px] font-extrabold flex items-center justify-center gap-0.5 transition-all cursor-pointer tabular-nums border ${
                                isCurrent
                                  ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                                  : isDone
                                  ? isDark
                                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isUnlocked
                                  ? isDark
                                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                                    : 'bg-white text-slate-700 border-slate-200'
                                  : 'opacity-45 cursor-not-allowed border-slate-700/40'
                              }`}
                            >
                              {isDone ? '✓' : ''}
                              {idx + 1}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Stage Counter & See All Stages Button Inline */}
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerSearch('');
                        setIsDrawerOpen(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer tabular-nums ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-sky-300 hover:bg-slate-700'
                          : 'bg-sky-50 border-sky-200 text-[#0066FF] hover:bg-sky-100'
                      }`}
                    >
                      <ListFilter className="w-3 h-3" />
                      <span>
                        {safeIndex + 1}/{currentList.length}
                      </span>
                      <span className="hidden sm:inline">
                        · {dashT.seeAllStagesBtn}
                      </span>
                    </button>

                    {isConversationMode &&
                      NINETY_CONVERSATION_TOPICS[activeTopicIndex] && (
                        <div
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 ${
                            isDark
                              ? 'bg-purple-950/60 border-purple-500/40 text-purple-200'
                              : 'bg-purple-50 border-purple-200 text-purple-900'
                          }`}
                        >
                          <span>
                            {NINETY_CONVERSATION_TOPICS[activeTopicIndex].icon}
                          </span>
                          <span>
                            #{activeTopicIndex + 1} · R{activeRoundNumber}/
                            {ROUNDS_PER_TOPIC}
                          </span>
                        </div>
                      )}

                    {/* Automatic Streak Badge */}
                    <div
                      title="100% Automatic Daily Streak"
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 tabular-nums ${
                        isDark
                          ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                      <span>{streakDays}d</span>
                    </div>

                    {/* Stars Score Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 tabular-nums ${
                        isDark
                          ? 'bg-yellow-950/50 border-yellow-500/40 text-yellow-300'
                          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      }`}
                    >
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>{stars}</span>
                    </div>
                  </div>

                  {/* Right Cluster: Studio Speed Selector + Teacher Hand-Holding Guide Toggle + Studio Theme Toggle */}
                  <div className="flex items-center gap-1.5">
                    {/* Segmented Studio Speed Control (1.0x Normal vs 0.78x Slow Clear) */}
                    <div
                      className={`inline-flex items-center p-0.5 rounded-lg border text-[10px] font-extrabold ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                      title="Audio Pronunciation Speed (1.0x Normal vs 0.78x Slow Clear)"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleStudioSpeed(1.0)}
                        className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                          studioSpeedMode === 1.0
                            ? 'bg-[#0066FF] text-white shadow-2xs'
                            : 'hover:text-[#0066FF] dark:hover:text-sky-300'
                        }`}
                      >
                        1.0x
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStudioSpeed(0.78)}
                        className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors flex items-center gap-0.5 ${
                          studioSpeedMode === 0.78
                            ? 'bg-amber-500 text-slate-950 shadow-2xs'
                            : 'hover:text-amber-600 dark:hover:text-amber-300'
                        }`}
                      >
                        <span>🐢</span>
                        <span>0.78x</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setHandHoldingTeacherOverride(
                          !isHandHoldingTeacherMode
                        )
                      }
                      title="Toggle Child-Friendly Hand-Holding Teacher Guide"
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        isHandHoldingTeacherMode
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50'
                      }`}
                    >
                      <span>👩‍🏫</span>
                      <span className="hidden sm:inline">Teacher Guide</span>
                    </button>

                    {/* Studio Dark/Light Mode Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isDark;
                        setIsDark(next);
                        try {
                          localStorage.setItem(
                            THEME_STORAGE_KEY,
                            next ? '1' : '0'
                          );
                        } catch {}
                      }}
                      title={
                        isDark
                          ? 'Switch to Light Studio'
                          : 'Switch to Dark Studio'
                      }
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50 shadow-2xs'
                      }`}
                    >
                      {isDark ? (
                        <Sun className="w-3.5 h-3.5" />
                      ) : (
                        <Moon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </header>

              {/* 2. CENTER INTERACTIVE 3D BALLOON & BILINGUAL SPOTLIGHT STAGE (flex-1 min-h-0 with mobile-optimized padding so footer never clips) */}
              <div
                className={`relative flex-1 min-h-0 rounded-2xl sm:rounded-[24px] px-2 py-1 sm:px-5 sm:py-3 border overflow-y-auto sm:overflow-hidden flex flex-col items-center justify-between gap-1 sm:gap-1.5 transition-all ${
                  isDark
                    ? 'bg-gradient-to-b from-slate-900/90 via-[#0F1E36]/90 to-slate-950/95 border-sky-500/25 shadow-[0_14px_36px_rgba(0,0,0,0.5)]'
                    : 'bg-gradient-to-b from-white/75 via-[#E8F3FF]/85 to-[#D0E8FF]/90 border-white shadow-[0_14px_36px_rgba(14,116,144,0.12)] backdrop-blur-md'
                }`}
              >
                {/* Studio Spotlight Beams */}
                <div
                  className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
                    phase === 'listening'
                      ? 'bg-rose-400/30 scale-110'
                      : phase === 'speaking'
                      ? 'bg-sky-400/35 scale-105'
                      : 'bg-sky-300/25'
                  }`}
                />

                {/* Top Floating Real-Time Phase Status Pill */}
                <div className="shrink-0 relative z-20 flex flex-wrap items-center justify-center gap-1.5">
                  <div
                    dir={nativeLang.rtl ? 'rtl' : 'ltr'}
                    className={`px-3.5 py-1 rounded-full border text-xs font-display font-extrabold flex items-center gap-1.5 shadow-xs transition-all ${
                      isMistake
                        ? 'bg-rose-500 text-white border-rose-300'
                        : phase === 'listening'
                        ? 'bg-gradient-to-r from-[#FF5E7E] to-[#E11D48] text-white border-rose-300'
                        : phase === 'speaking'
                        ? 'bg-[#0066FF] text-white border-sky-300'
                        : phase === 'celebrating'
                        ? 'bg-emerald-500 text-white border-emerald-300'
                        : isDark
                        ? 'bg-slate-800/90 text-sky-200 border-slate-700'
                        : 'bg-white/95 text-slate-800 border-sky-200'
                    }`}
                  >
                    {phase === 'listening' && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300" />
                      </span>
                    )}
                    {phase === 'speaking' && (
                      <Volume2 className="w-3.5 h-3.5 animate-bounce shrink-0" />
                    )}
                    {isMistake && (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate max-w-[250px] sm:max-w-[440px]">
                      {statusMessage}
                    </span>
                  </div>

                  {isReviewMode && currentReviewItem && (
                    <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xs flex items-center gap-1.5">
                      <span>🎯</span>
                      <span>
                        {nativeLang.code === 'ur'
                          ? `سیشن کی غلطیوں کی دہرائی (${safeIndex + 1}/${currentList.length})`
                          : nativeLang.code === 'hi'
                          ? `डेली सेशन रिव्यू मोड (${safeIndex + 1}/${currentList.length})`
                          : `Daily Session Mistake Review (${safeIndex + 1}/${currentList.length})`}
                      </span>
                      {currentReviewItem.wrongHeardSample && (
                        <span className="px-1.5 py-0.2 rounded bg-black/25 text-[10px]">
                          🎙️ {currentReviewItem.wrongHeardSample}
                        </span>
                      )}
                    </span>
                  )}

                  {isConversationMode && currentConvItem?.situation && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                        isDark
                          ? 'bg-slate-900/80 border-sky-500/30 text-sky-300'
                          : 'bg-white/90 border-sky-200 text-[#0066FF]'
                      }`}
                    >
                      {currentConvItem.situation}
                    </span>
                  )}
                </div>

                {/* Center 3D Swirling Balloon with Voice-Modulated Circular Wave */}
                <div className="my-auto w-full flex flex-col items-center justify-center relative z-10 min-h-0">
                  <BalloonGraphic
                    color={balloonColor}
                    mainText={targetDisplayMain}
                    subText={targetFullLabel}
                    icon={
                      isReviewMode
                        ? currentReviewItem?.icon || '🎯'
                        : isConversationMode
                        ? currentConvItem?.icon
                        : isWordsMode
                        ? currentWordItem?.icon
                        : undefined
                    }
                    meaningText={
                      nativeMeaningText
                        ? `${nativeLang.flag} ${nativeMeaningText}`
                        : undefined
                    }
                    voiceLevel={voiceLevel}
                    state={
                      phase === 'verifying'
                        ? 'listening'
                        : (phase as
                            | 'swirling'
                            | 'speaking'
                            | 'mic_ready'
                            | 'listening'
                            | 'celebrating'
                            | 'retry')
                    }
                    onReplaySound={() => {
                      handleManualReplaySound();
                    }}
                    rtl={targetLang.rtl}
                    carouselItems={carouselItems}
                    activeIndex={safeIndex}
                    poppedIndices={currentPoppedIndices}
                  />

                  {/* Star Celebration Pop Overlay */}
                  <AnimatePresence>
                    {phase === 'celebrating' && (
                      <motion.div
                        initial={{ scale: 0.4, opacity: 0, y: 16 }}
                        animate={{ scale: 1.1, opacity: 1, y: -12 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center z-40"
                      >
                        <div className="bg-gradient-to-b from-[#FEF08A] via-[#FACC15] to-[#F97316] text-slate-950 font-display font-extrabold px-5 py-2.5 rounded-3xl shadow-[0_8px_0_#C2410C,0_20px_40px_rgba(245,158,11,0.5)] flex items-center gap-2 text-base sm:text-lg border-2 border-white">
                          <span className="text-xl">💥</span>
                          <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-amber-700 animate-spin" />
                          <span>{prompts.popShabash}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* PRO BILINGUAL PRONUNCIATION & SPOKEN MEANING SPOTLIGHT CARD */}
                <div className="shrink-0 relative z-20 w-full max-w-3xl mx-auto">
                  <div
                    className={`w-full rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2.5 border transition-all grid grid-cols-1 md:grid-cols-12 gap-1.5 sm:gap-2 items-center ${
                      isDark
                        ? 'bg-slate-900/95 border-slate-700/90 shadow-md'
                        : 'bg-white/95 border-sky-200/90 shadow-sm'
                    }`}
                  >
                    {/* Target Language Column (What I'm Learning) */}
                    <div
                      dir={targetLang.rtl ? 'rtl' : 'ltr'}
                      className="md:col-span-6 flex items-center justify-between gap-2 px-1"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0066FF] dark:text-sky-400">
                          <span>{targetLang.flag}</span>
                          <span>{targetLang.nativeName}</span>
                          <span className="opacity-40">•</span>
                          <span>
                            {isConversationMode
                              ? prompts.sentenceLabel
                              : prompts.wordLabel}
                          </span>
                        </div>
                        <div className="font-display font-extrabold text-xs sm:text-lg md:text-xl leading-tight break-words line-clamp-2">
                          {targetDisplayMain}
                        </div>
                        {targetFullLabel &&
                          targetFullLabel !== targetDisplayMain && (
                            <div
                              className={`text-[10px] sm:text-[11px] font-bold truncate ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                              }`}
                            >
                              🗣️ {targetFullLabel}
                            </div>
                          )}
                      </div>

                      <button
                        type="button"
                        onClick={handleManualReplaySound}
                        title={prompts.hearAgain}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer border ${
                          phase === 'speaking'
                            ? 'bg-[#0066FF] text-white border-sky-300 shadow-[0_0_14px_rgba(0,102,255,0.5)] scale-105'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
                            : 'bg-sky-50 hover:bg-sky-100 text-[#0066FF] border-sky-200'
                        }`}
                      >
                        <Volume2
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            phase === 'speaking' ? 'animate-bounce' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Spoken Language Meaning Column (What I Speak — nativeLang) with Instant Audio Replay */}
                    <div
                      dir={nativeLang.rtl ? 'rtl' : 'ltr'}
                      className={`md:col-span-6 rounded-xl px-2.5 py-1 sm:px-3 sm:py-2 border flex items-center justify-between gap-2 ${
                        isDark
                          ? 'bg-emerald-950/45 border-emerald-500/40 text-white'
                          : 'bg-gradient-to-r from-emerald-50/90 to-sky-50/90 border-emerald-200/90 text-slate-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                          <span>{nativeLang.flag}</span>
                          <span>
                            {prompts.meaningLabel} ({nativeLang.nativeName})
                          </span>
                        </div>
                        <div className="font-display font-extrabold text-xs sm:text-base md:text-lg leading-tight break-words line-clamp-2">
                          {nativeMeaningText || targetFullLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          getSharedAudioContext();
                          const meaningToSpeak =
                            nativeMeaningText || targetFullLabel;
                          if (meaningToSpeak) {
                            pronounceText(
                              meaningToSpeak,
                              nativeLang.bcp47,
                              nativeLang.name
                            );
                          }
                        }}
                        title={`Hear meaning in ${nativeLang.nativeName}`}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer border ${
                          isDark
                            ? 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 border-emerald-700/60'
                            : 'bg-white/90 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* BEGINNER HAND-HOLDING TEACHER GUIDE STRIP ("ایک جو ٹیچر ہاتھ پکڑ کے بچوں کو سکھاتی ہے نا، ویسے") */}
                    {isHandHoldingTeacherMode && (
                      <div
                        dir={nativeLang.rtl ? 'rtl' : 'ltr'}
                        className={`md:col-span-12 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 border flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 ${
                          isDark
                            ? 'bg-amber-950/35 border-amber-500/40 text-amber-100'
                            : 'bg-amber-50/90 border-amber-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold text-amber-600 dark:text-amber-300">
                          <span>👩‍🏫</span>
                          <span className="line-clamp-1">
                            {nativeLang.code === 'ur'
                              ? 'ٹیچر گائیڈ (بچوں کی طرح آسان): ٹکڑوں کو چھو کر آہستہ سنیں اور ساتھ بولیں'
                              : nativeLang.code === 'hi'
                              ? 'टीचर गाइड (बच्चों की तरह आसान): टुकड़ों को छूकर धीरे सुनें और साथ बोलें'
                              : 'Teacher Guide: Tap each piece to hear slowly & repeat step-by-step'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              speakSlowTeacherChunk(targetSpeechText, -1)
                            }
                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold border flex items-center gap-1 cursor-pointer transition-all ${
                              activeTeacherChunkIdx === -1
                                ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105'
                                : isDark
                                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                                : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                            }`}
                          >
                            <span>🐢</span>
                            <span>
                              {nativeLang.code === 'ur'
                                ? 'آہستہ سنیں'
                                : nativeLang.code === 'hi'
                                ? 'धीरे सुनें'
                                : 'Slow Voice'}
                            </span>
                          </button>

                          {teacherSyllableChunks.map((chunk, cIdx) => (
                            <button
                              key={`${chunk}-${cIdx}`}
                              type="button"
                              onClick={() => speakSlowTeacherChunk(chunk, cIdx)}
                              dir={targetLang.rtl ? 'rtl' : 'ltr'}
                              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-display font-extrabold border flex items-center gap-1 cursor-pointer transition-all ${
                                activeTeacherChunkIdx === cIdx
                                  ? 'bg-[#0066FF] text-white border-sky-300 scale-105 shadow-xs'
                                  : isDark
                                  ? 'bg-slate-900 border-slate-700 text-sky-300 hover:border-sky-400'
                                  : 'bg-white border-sky-200 text-[#0066FF] hover:bg-sky-50'
                              }`}
                            >
                              <span className="opacity-65 text-[9px] sm:text-[10px]">
                                {cIdx + 1}.
                              </span>
                              <span>{chunk}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. STYLISH VOICE & MICROPHONE STUDIO CONSOLE (BOTTOM FOOTER — shrink-0, ALWAYS 100% ACCESSIBLE ON MOBILE) */}
              <footer
                dir={nativeLang.rtl ? 'rtl' : 'ltr'}
                className={`shrink-0 w-full rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-5 sm:py-2.5 border transition-all duration-300 ${
                  isDark
                    ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-[0_10px_28px_rgba(0,0,0,0.5)]'
                    : 'bg-white/95 border-white text-slate-900 shadow-[0_10px_28px_rgba(14,116,144,0.12)] backdrop-blur-xl'
                }`}
              >
                {/* Top Segmented Progress Bar inside Console */}
                <div className="w-full h-1 sm:h-1.5 rounded-full overflow-hidden bg-sky-100 dark:bg-slate-800 mb-1.5 sm:mb-2">
                  <div
                    style={{
                      width: `${Math.max(
                        3,
                        Math.round(
                          ((safeIndex + 1) / Math.max(1, currentList.length)) *
                            100
                        )
                      )}%`,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-[#0066FF] via-sky-400 to-emerald-400 transition-all duration-300"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  {/* Left Navigation: Previous Step + Live Heard Transcript Pill */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safeIndex === 0}
                      onClick={() => {
                        getSharedAudioContext();
                        stopCurrentListeningAttempt();
                        setCurrentIndex((prev) => Math.max(0, prev - 1));
                      }}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1 disabled:opacity-40 cursor-pointer transition-all ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                          : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{prompts.prevButton}</span>
                    </button>

                    {heardTranscript && (
                      <div
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-extrabold truncate max-w-[160px] sm:max-w-[230px] ${
                          isMistake
                            ? 'bg-rose-500/15 border-rose-400/50 text-rose-500 dark:text-rose-300'
                            : 'bg-emerald-500/15 border-emerald-400/50 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        🎙️ {prompts.heardLabel(heardTranscript)}
                      </div>
                    )}
                  </div>

                  {/* Center Voice Equalizer & Action Controls */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {phase === 'swirling' && (
                      <div className="text-xs font-extrabold text-[#0066FF] dark:text-sky-400 animate-pulse px-3 py-1.5">
                        {prompts.gettingReady(targetFullLabel)}
                      </div>
                    )}

                    {phase === 'speaking' && (
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-display font-extrabold text-xs ${
                          isDark
                            ? 'bg-sky-950/70 border-sky-500/60 text-sky-200'
                            : 'bg-sky-50 border-sky-300 text-[#0066FF]'
                        }`}
                      >
                        <Volume2 className="w-4 h-4 text-[#0066FF] dark:text-sky-300 animate-bounce shrink-0" />
                        <span className="truncate max-w-[220px] sm:max-w-[320px]">
                          {prompts.speakingNow(targetDisplayMain)}
                        </span>
                      </div>
                    )}

                    {phase === 'verifying' && (
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-display font-bold text-xs ${
                          isDark
                            ? 'bg-sky-950/60 border-sky-700 text-sky-200'
                            : 'bg-sky-50 border-sky-200 text-sky-900'
                        }`}
                      >
                        <Loader2 className="w-4 h-4 text-[#0066FF] animate-spin" />
                        <span>{prompts.checkingPronunciation}</span>
                      </div>
                    )}

                    {(phase === 'mic_ready' ||
                      phase === 'listening' ||
                      phase === 'retry') &&
                      (isCurrentConvAssembleStep && currentConvItem ? (
                        <InlineConversationWordAssembler
                          currentItem={currentConvItem}
                          allConversations={conversationsList}
                          words={curriculum.words}
                          currentIndex={safeIndex}
                          targetLang={targetLang}
                          nativeLang={nativeLang}
                          isDark={isDark}
                          onSuccessAssemble={(assembledText) =>
                            triggerSuccessAndAdvance(
                              activeLessonIdRef.current,
                              assembledText
                            )
                          }
                          onReplayTeacher={() =>
                            pronounceText(
                              targetSpeechText,
                              targetLang.bcp47,
                              targetLang.name,
                              targetPhonetic
                            )
                          }
                          onSwitchToVoice={() => {
                            setConvStepModeOverride('voice');
                            startListeningSession(activeLessonIdRef.current);
                          }}
                        />
                      ) : (
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {/* Primary Studio Microphone Button with Live 6-Bar Audio Spectrum */}
                          <button
                            type="button"
                            onClick={() => {
                              getSharedAudioContext();
                              startListeningSession(activeLessonIdRef.current);
                            }}
                            className={`relative px-5 py-2 rounded-xl font-display font-extrabold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              phase === 'listening'
                                ? 'bg-gradient-to-r from-[#FF5E7E] via-[#F43F5E] to-[#E11D48] shadow-[0_8px_22px_rgba(225,29,72,0.45)] scale-[1.02]'
                                : 'bg-gradient-to-r from-[#0066FF] to-[#0284C7] hover:from-[#0052CC] hover:to-[#0369A1] shadow-[0_8px_20px_rgba(0,102,255,0.35)] active:translate-y-0.5'
                            }`}
                          >
                            <Mic
                              className={`w-4 h-4 shrink-0 ${
                                phase === 'listening'
                                  ? 'animate-pulse text-yellow-200'
                                  : ''
                              }`}
                            />
                            <span className="truncate max-w-[180px] sm:max-w-[280px]">
                              {phase === 'listening'
                                ? prompts.micOnSpeak(targetDisplayMain)
                                : prompts.tapMicSay(targetDisplayMain)}
                            </span>

                            {phase === 'listening' && (
                              <div className="flex items-end gap-0.5 h-3.5 ml-1 shrink-0">
                                {[0.5, 0.85, 1, 0.7, 0.95, 0.6].map(
                                  (mult, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        height: `${Math.max(
                                          4,
                                          Math.min(
                                            16,
                                            voiceLevel * mult * 0.42 + 4
                                          )
                                        )}px`,
                                      }}
                                      className="w-1 bg-yellow-300 rounded-full transition-all duration-75"
                                    />
                                  )
                                )}
                              </div>
                            )}
                          </button>

                          {/* Hear Again Button */}
                          <button
                            type="button"
                            onClick={handleManualReplaySound}
                            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all active:translate-y-0.5 cursor-pointer border ${
                              isDark
                                ? 'bg-slate-800 text-sky-300 border-slate-700 hover:bg-slate-700'
                                : 'bg-sky-50 text-[#0066FF] border-sky-200 hover:bg-sky-100'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{prompts.hearAgain}</span>
                          </button>

                          {/* Word Assembly Puzzle Button (Conversation Mode) */}
                          {isConversationMode && (
                            <button
                              type="button"
                              onClick={() => {
                                stopCurrentListeningAttempt();
                                setVoiceLevel(0);
                                setConvStepModeOverride('assemble');
                                setPhase('mic_ready');
                                setStatusMessage(dashT.assembleSentencePrompt);
                              }}
                              className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all active:translate-y-0.5 cursor-pointer border ${
                                isDark
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              <Puzzle className="w-3.5 h-3.5" />
                              <span>{dashT.skill4Title}</span>
                            </button>
                          )}
                        </div>
                      ))}

                    {phase === 'celebrating' && (
                      <div className="text-emerald-500 font-display font-extrabold text-xs sm:text-sm px-3 py-1.5">
                        {prompts.loadingNextBalloon}
                      </div>
                    )}
                  </div>

                  {/* Right Navigation: Next Step / Finish Button */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        getSharedAudioContext();
                        if (!canGoNext) {
                          showLockToast(
                            `🔒 ${prompts.tapMicSay(targetDisplayMain)}`
                          );
                          return;
                        }
                        stopCurrentListeningAttempt();
                        if (safeIndex + 1 < currentList.length) {
                          setCurrentIndex((prev) =>
                            Math.min(maxUnlockedIndex, prev + 1)
                          );
                        } else {
                          setScreen('VICTORY_CELEBRATION');
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1 transition-all ${
                        !canGoNext
                          ? isDark
                            ? 'bg-slate-800/50 border-slate-700/70 text-slate-500 opacity-60 cursor-not-allowed'
                            : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-65 cursor-not-allowed'
                          : 'bg-[#0066FF] border-[#0066FF] text-white hover:bg-[#0052CC] cursor-pointer shadow-sm'
                      }`}
                    >
                      <span>{prompts.nextButton}</span>
                      {!canGoNext ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <>
                          <SkipForward className="w-3.5 h-3.5" />
                          <ChevronRight className="w-3.5 h-3.5 -ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Desktop Pro Studio Keyboard Shortcut Legend */}
                <div
                  dir="ltr"
                  className="hidden lg:flex items-center justify-center gap-4 pt-1.5 mt-1.5 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px] font-semibold text-slate-400 dark:text-slate-500"
                >
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px]">
                      Space
                    </kbd>{' '}
                    Speak with Mic
                  </span>
                  <span>·</span>
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px]">
                      R
                    </kbd>{' '}
                    Replay Native Voice
                  </span>
                  <span>·</span>
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px]">
                      ← / →
                    </kbd>{' '}
                    Previous / Next Step
                  </span>
                </div>
              </footer>
            </div>
          </div>
        )}

        {/* SCREEN: VICTORY CELEBRATION CARD IN SOFT-BLUE THEME */}
        {screen === 'VICTORY_CELEBRATION' && (
          <div className="w-full mx-auto py-4 text-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              dir={nativeLang.rtl ? 'rtl' : 'ltr'}
              className={`rounded-[28px] p-7 sm:p-10 border flex flex-col items-center ${
                isDark
                  ? 'bg-[#1E293B] border-slate-700 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
                  : 'bg-white border-sky-100 text-slate-900 shadow-[0_20px_50px_rgba(14,116,144,0.12)]'
              }`}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <img
                  src="/assets/aistudio/balloon_variant.png"
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-14 h-16 object-contain animate-gentle-bob"
                />
                <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#FEF08A] to-[#F59E0B] text-slate-950 flex items-center justify-center shadow-[0_6px_0_#B45309]">
                  <Award className="w-9 h-9" />
                </div>
                <img
                  src={
                    isDark
                      ? '/assets/aistudio/moon_variant.png'
                      : '/assets/aistudio/sun_variant.png'
                  }
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-contain"
                />
              </div>

              <h2
                className={`font-display text-2xl sm:text-4xl font-extrabold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {prompts.victoryTitle}
              </h2>
              <p
                className={`mt-2 text-sm sm:text-base ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {prompts.victorySubtitle(
                  `${targetLang.flag} ${targetLang.nativeName}`,
                  stars
                )}
              </p>

              {isCourseFullyCompleted ? (
                <div
                  className={`mt-4 w-full rounded-2xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-sky-950/40 border-sky-500/40 text-sky-100'
                      : 'bg-[#DCEBFF] border-sky-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/aistudio/1b02fee5-60f7-462a-a2c4-ac278b56ad5c_5b6b7b66.png"
                      alt="Certificate"
                      referrerPolicy="no-referrer"
                      className="w-16 h-11 object-cover rounded-lg border border-[#0066FF] shadow-xs shrink-0"
                    />
                    <div className="text-start">
                      <div className="text-xs sm:text-sm font-extrabold">
                        🎓 {learnerName || currentUser?.displayName || dashT.defaultLearnerName}
                      </div>
                      <div className="text-[11px] font-bold opacity-85">
                        📅 {completionDate} · {dashT.certCardTitle}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadLocalizedCertificatePdf({
                          recipientName:
                            learnerName ||
                            currentUser?.displayName ||
                            dashT.defaultLearnerName,
                          nativeLang,
                          targetLang,
                          certLanguageMode: 'spoken',
                          completionDate,
                          selectedTemplate: 'template_1',
                        });
                      } catch {}
                      setHubModalTab('certificate');
                      setHubModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:brightness-105 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-xs cursor-pointer shrink-0"
                  >
                    🎓 {signInCertCopy.downloadCertDirectBtn}
                  </button>
                </div>
              ) : (
                <div
                  className={`mt-4 w-full rounded-2xl p-3.5 border text-xs sm:text-sm font-extrabold ${
                    isDark
                      ? 'bg-slate-800/80 border-slate-700 text-sky-300'
                      : 'bg-[#EEF6FF] border-sky-200 text-[#0066FF]'
                  }`}
                >
                  🎯 {dashT.certCardLockedDesc}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => tryOpenMode('WORDS_GAME')}
                  className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-[0_6px_16px_rgba(0,102,255,0.3)] font-display font-extrabold text-sm rounded-full flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{dashT.navWords}</span>
                </button>

                <button
                  type="button"
                  onClick={() => tryOpenMode('CONVERSATION_GAME')}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white shadow-[0_6px_16px_rgba(147,51,234,0.3)] font-display font-extrabold text-sm rounded-full flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{dashT.navConversation} (90)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* QUICK-JUMP CURRICULUM DRAWER MODAL */}
        <AnimatePresence>
          {isDrawerOpen && isPlayableBalloonLesson && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 pointer-events-auto"
              onClick={() => setIsDrawerOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.94, y: 12, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.94, y: 12, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                dir={nativeLang.rtl ? 'rtl' : 'ltr'}
                className={`w-full max-w-3xl max-h-[82vh] rounded-[28px] border p-4 sm:p-6 flex flex-col shadow-2xl ${
                  isDark
                    ? 'bg-[#1E293B] border-slate-700 text-white'
                    : 'bg-white border-sky-100 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="font-display text-lg sm:text-2xl font-extrabold flex items-center gap-2">
                      <img
                        src="/assets/aistudio/balloon_variant.png"
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-6 h-7 object-contain"
                      />
                      <span>
                        {isReviewMode
                          ? '🎯 Review Mode'
                          : isConversationMode
                          ? dashT.navConversation
                          : isWordsMode
                          ? dashT.navWords
                          : dashT.navAlphabet}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#0066FF] dark:text-sky-400 tabular-nums">
                        ({currentPoppedIndices.length}/{currentList.length})
                      </span>
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Input inside Drawer */}
                <div className="my-3">
                  <input
                    type="text"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder={dashT.searchPlaceholder}
                    className={`w-full px-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400'
                        : 'bg-[#F3F8FF] border-sky-100 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                {/* Scrollable Items List */}
                <div
                  dir="ltr"
                  className={`flex-1 overflow-y-auto pr-1 grid gap-2.5 ${
                    isConversationMode || isReviewMode
                      ? 'grid-cols-1'
                      : isWordsMode
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6'
                  }`}
                >
                  {currentList.map((item: any, idx: number) => {
                    const isPopped = currentPoppedIndices.includes(idx);
                    const isCurrent = idx === safeIndex;
                    const isItemUnlocked = idx <= maxUnlockedIndex;
                    const mainLabel = isReviewMode
                      ? item.mainText
                      : isConversationMode
                      ? item.phrase
                      : isWordsMode
                      ? item.word
                      : item.letter;
                    const subLabel = isReviewMode
                      ? `${item.nativeMeaning} (${item.pronunciation})`
                      : isConversationMode
                      ? `${item.translations?.[nativeLang.code] || item.urduMeaning || item.englishMeaning}`
                      : isWordsMode
                      ? `${item.translations?.[nativeLang.code] || item.englishMeaning} (${item.pronunciation})`
                      : item.name;

                    const q = drawerSearch.trim().toLowerCase();
                    if (
                      q &&
                      !String(mainLabel).toLowerCase().includes(q) &&
                      !String(subLabel).toLowerCase().includes(q) &&
                      !String(item.englishMeaning || '').toLowerCase().includes(q) &&
                      !String(item.situation || '').toLowerCase().includes(q)
                    ) {
                      return null;
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          getSharedAudioContext();
                          if (!isItemUnlocked) {
                            showLockToast(
                              `🔒 ${prompts.tapMicSay(targetDisplayMain)}`
                            );
                            return;
                          }
                          stopCurrentListeningAttempt();
                          setCurrentIndex(idx);
                          setIsDrawerOpen(false);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2.5 ${
                          !isItemUnlocked
                            ? isDark
                              ? 'bg-slate-900/50 border-slate-800 opacity-55 cursor-not-allowed'
                              : 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                            : isCurrent
                            ? isDark
                              ? 'bg-[#0066FF]/25 border-[#0066FF] ring-2 ring-[#0066FF]/40 cursor-pointer'
                              : 'bg-[#DCEBFF] border-[#0066FF] cursor-pointer'
                            : isPopped
                            ? isDark
                              ? 'bg-emerald-950/35 border-emerald-700/60 hover:bg-emerald-950/60 cursor-pointer'
                              : 'bg-[#EAFAEA] border-emerald-300 hover:bg-emerald-100/70 cursor-pointer'
                            : isDark
                            ? 'bg-slate-800/80 border-slate-700 hover:border-sky-400 cursor-pointer'
                            : 'bg-white border-slate-200 hover:border-sky-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {item.icon && (
                            <span className="text-xl sm:text-2xl shrink-0">
                              {item.icon}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            {isConversationMode && item.situation && (
                              <div className="text-[11px] font-bold text-[#0066FF] dark:text-sky-400 truncate">
                                {idx + 1}. {item.situation}
                              </div>
                            )}
                            <div
                              dir={targetLang.rtl ? 'rtl' : 'ltr'}
                              className={`font-display font-extrabold truncate ${
                                isConversationMode
                                  ? 'text-sm sm:text-base'
                                  : 'text-base sm:text-lg'
                              } ${isDark ? 'text-white' : 'text-slate-900'}`}
                            >
                              {mainLabel}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              {subLabel}
                            </div>
                          </div>
                        </div>

                        {!isItemUnlocked ? (
                          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : isPopped ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </LearningBalloonDashboard>
      )}

      {/* ADMIN PANEL + DAILY STREAK + DIFFICULTY LEVEL + PDF CERTIFICATE MODAL */}
      <AdminStreakCertificateModal
        isOpen={hubModalOpen}
        initialTab={hubModalTab}
        onClose={() => setHubModalOpen(false)}
        onSignOut={handleGoogleSignOut}
        isDark={isDark}
        currentUser={currentUser}
        learnerName={learnerName}
        onChangeLearnerName={setLearnerName}
        nativeLang={nativeLang}
        targetLang={targetLang}
        certLanguageMode={certLanguageMode}
        onChangeCertLanguageMode={setCertLanguageMode}
        difficultyLevel={difficultyLevel}
        onChangeDifficultyLevel={setDifficultyLevel}
        easyCompleted={isWordsUnlocked}
        mediumCompleted={isConversationUnlocked}
        courseCompleted={isCourseFullyCompleted}
        completionDate={completionDate}
        onChangeCompletionDate={setCompletionDate}
        streakDays={streakDays}
        streakGoalDays={streakGoalDays}
        onUpdateStreakConfig={(days, goalDays) => {
          const safeDays = Math.max(0, days);
          const safeGoal = Math.max(1, goalDays);
          const todayStr = getTodayDateString();
          setStreakDays(safeDays);
          setStreakGoalDays(safeGoal);
          setLastActiveDate(todayStr);
          try {
            const rawLedger = localStorage.getItem(DAILY_STREAK_LEDGER_KEY);
            const parsedLedger = rawLedger ? JSON.parse(rawLedger) : null;
            const prevDates: string[] = Array.isArray(parsedLedger?.activeDates)
              ? parsedLedger.activeDates
              : [todayStr];
            localStorage.setItem(
              DAILY_STREAK_LEDGER_KEY,
              JSON.stringify({
                streakDays: safeDays,
                streakGoalDays: safeGoal,
                lastIncrementDate: todayStr,
                activeDates: Array.from(new Set([...prevDates, todayStr])).slice(
                  -365
                ),
                lastCelebratedDate: todayStr,
                lastCelebratedStreakDays: safeDays,
              })
            );
          } catch {}
          if (safeDays >= safeGoal && safeDays > 0) {
            const milestoneTiers = [7, 14, 30, 60, 100, 365];
            const nextGoal =
              milestoneTiers.find((t) => t > safeDays) || safeDays + 7;
            setGoalAchievedModal({ days: safeDays, nextGoal });
          }
        }}
        stars={stars}
        onChangeStars={setStars}
        alphabetsCompleted={completedTopicsCount}
        alphabetsTotal={NINETY_CONVERSATION_TOPICS.length}
        wordsCompleted={poppedWords.length}
        wordsTotal={curriculum.words.length}
        conversationsCompleted={totalRoundStarsCompleted}
        conversationsTotal={conversationsList.length}
        adminCommandUnlocked={isAdminUser}
        adminUnlockedWordsCount={adminUnlockedWordsCount}
        onChangeAdminUnlockedWordsCount={setAdminUnlockedWordsCount}
        adminUnlockedTopicsCount={adminUnlockedTopicsCount}
        onChangeAdminUnlockedTopicsCount={setAdminUnlockedTopicsCount}
        onAdminSetWordsCompleted={(count) => {
          const safeCount = Math.max(
            0,
            Math.min(curriculum.words.length, Math.floor(count))
          );
          const indices = Array.from({ length: safeCount }, (_, i) => i);
          setPoppedByMode((prev) => ({
            ...prev,
            [`${targetLang.code}:WORDS_GAME`]: indices,
          }));
          setAdminUnlockedWordsCount(
            Math.max(1, Math.min(curriculum.words.length, safeCount + 1))
          );
        }}
        onAdminSetConversationsCompleted={(count, markAllComplete) => {
          const safeCount = Math.max(
            0,
            Math.min(conversationsList.length, Math.floor(count))
          );
          const convIndices = Array.from({ length: safeCount }, (_, i) => i);
          setPoppedByMode((prev) => ({
            ...prev,
            [`${targetLang.code}:CONVERSATION_GAME`]: convIndices,
          }));

          setTopicRoundsByLang((prev) => {
            const nextLangMap: Record<number, number> = {};
            if (markAllComplete || safeCount >= conversationsList.length) {
              for (let tIdx = 0; tIdx < NINETY_CONVERSATION_TOPICS.length; tIdx++) {
                nextLangMap[tIdx] = ROUNDS_PER_TOPIC;
              }
            } else {
              let remainingRounds = safeCount;
              let tIdx = 0;
              while (
                remainingRounds > 0 &&
                tIdx < NINETY_CONVERSATION_TOPICS.length
              ) {
                const assign = Math.min(ROUNDS_PER_TOPIC, remainingRounds);
                nextLangMap[tIdx] = assign;
                remainingRounds -= assign;
                tIdx++;
              }
            }
            return {
              ...prev,
              [targetLang.code]: nextLangMap,
            };
          });

          if (markAllComplete || safeCount >= conversationsList.length) {
            setAdminUnlockedTopicsCount(NINETY_CONVERSATION_TOPICS.length);
          } else {
            const unlockedTopics = Math.min(
              NINETY_CONVERSATION_TOPICS.length,
              Math.max(1, Math.floor(safeCount / ROUNDS_PER_TOPIC) + 1)
            );
            setAdminUnlockedTopicsCount((prev) =>
              Math.max(prev, unlockedTopics)
            );
          }
        }}
        onboardingData={onboardingData}
        onTriggerGoalCelebration={() => {
          const milestoneTiers = [7, 14, 30, 60, 100, 365];
          const nextGoal =
            milestoneTiers.find((t) => t > streakDays) ||
            Math.max(streakGoalDays, streakDays + 7);
          triggerBalloonPopVibration([45, 25, 65]);
          playStarRewardFanfare();
          setGoalAchievedModal({
            days: Math.max(1, streakDays),
            nextGoal,
          });
        }}
        onOpenOnboardingStep={(targetStep) => {
          setLangModalInitialStep(targetStep);
          setScreen('LANGUAGE_SELECT');
        }}
      />

      {/* CELEBRATORY 'GOAL ACHIEVED' DAILY STREAK MILESTONE MODAL & ANIMATION */}
      <AnimatePresence>
        {goalAchievedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
            onClick={() => setGoalAchievedModal(null)}
          >
            <motion.div
              initial={{ scale: 0.82, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              dir={obCopy.rtl ? 'rtl' : 'ltr'}
              className={`relative w-full max-w-md rounded-[32px] border-2 p-6 sm:p-8 text-center overflow-hidden shadow-[0_24px_70px_rgba(245,158,11,0.4)] ${
                isDark
                  ? 'bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] border-amber-400/60 text-white'
                  : 'bg-gradient-to-b from-[#FFFBEB] via-white to-[#FFF7ED] border-amber-300 text-slate-900'
              }`}
            >
              {/* Animated Radial Glow & Confetti Sparkles */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.35, 0.6, 0.35],
                }}
                transition={{ duration: 2.6, repeat: Infinity }}
                className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-r from-amber-400/35 via-orange-500/30 to-rose-500/25 blur-2xl"
              />

              {/* Top Badge */}
              <div className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-600 dark:text-amber-300 text-xs font-extrabold tracking-wide mb-4">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{obCopy.goalAchievedBadge}</span>
              </div>

              {/* Animated Flame + Trophy Medallion */}
              <div className="relative z-10 mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/60"
                />
                <motion.div
                  initial={{ scale: 0.5, rotate: -12 }}
                  animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 text-slate-950 flex flex-col items-center justify-center shadow-[0_8px_0_#9A3412]"
                >
                  <Flame className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white drop-shadow-sm" />
                  <span
                    dir="ltr"
                    className="font-display font-black text-lg sm:text-xl text-white leading-none mt-0.5"
                  >
                    {goalAchievedModal.days}d
                  </span>
                </motion.div>
              </div>

              {/* Title & Subtitle in Spoken Language */}
              <h2 className="relative z-10 font-display text-xl sm:text-2xl font-extrabold leading-tight">
                {obCopy.goalAchievedTitle(goalAchievedModal.days)}
              </h2>
              <p
                className={`relative z-10 text-xs sm:text-sm mt-2 leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {obCopy.goalAchievedSubtitle(
                  goalAchievedModal.days,
                  goalAchievedModal.nextGoal
                )}
              </p>

              {/* Reward Pill + Auto-Streak Note */}
              <div className="relative z-10 mt-4 space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400/25 to-orange-500/25 border border-amber-400/60 text-amber-600 dark:text-amber-300 font-display font-extrabold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{obCopy.goalAchievedRewardLabel}</span>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {obCopy.goalAchievedAutoNote}
                </div>
              </div>

              {/* Claim Bonus & Continue CTA (+ Start Mistake Review if any mistakes occurred) */}
              <div className="relative z-10 mt-5 space-y-2.5">
                {sessionMistakes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStars((prev) => prev + 25);
                      triggerBalloonPopVibration([45, 25, 65]);
                      playStarRewardFanfare();
                      setGoalAchievedModal(null);
                      tryOpenMode('REVIEW_GAME');
                    }}
                    className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:brightness-105 text-white font-display font-extrabold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🎯</span>
                    <span>
                      {nativeLang.code === 'ur'
                        ? `آج کی غلطیوں کی دہرائی شروع کریں (${sessionMistakes.length})`
                        : nativeLang.code === 'hi'
                        ? `आज की गलतियों का रिव्यू शुरू करें (${sessionMistakes.length})`
                        : `Start Daily Session Mistake Review (${sessionMistakes.length})`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStars((prev) => prev + 25);
                    triggerBalloonPopVibration([45, 25, 65]);
                    playStarRewardFanfare();
                    setGoalAchievedModal(null);
                    if (sessionMistakes.length > 0) {
                      tryOpenMode('REVIEW_GAME');
                    }
                  }}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:brightness-105 text-slate-950 font-display font-extrabold text-sm sm:text-base shadow-[0_6px_0_#9A3412] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{obCopy.goalAchievedClaimBtn}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DAILY 'BALLOON BONUS' LOGIN REWARD MODAL (Extra Stars on First Login Each Day!) */}
      <AnimatePresence>
        {dailyBonusModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
            onClick={() => setDailyBonusModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.86, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              dir={obCopy.rtl ? 'rtl' : 'ltr'}
              className={`relative w-full max-w-lg rounded-[32px] border-2 p-5 sm:p-7 text-center overflow-hidden shadow-[0_24px_80px_rgba(245,158,11,0.45)] ${
                isDark
                  ? 'bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] border-amber-400/60 text-white'
                  : 'bg-gradient-to-b from-[#FFFBEB] via-white to-[#FFF7ED] border-amber-300 text-slate-900'
              }`}
            >
              {(() => {
                const todayStr = getTodayDateString();
                const isClaimedToday = dailyBonusClaimedDate === todayStr;
                const cycleSlot = Math.min(
                  7,
                  Math.max(1, ((Math.max(1, streakDays) - 1) % 7) + 1)
                );
                const todayBonusStars =
                  DAILY_BONUS_TIERS[cycleSlot - 1] || 15;
                const todayMonZeroIdx = (new Date().getDay() + 6) % 7;
                const startWeekdayIdx =
                  (todayMonZeroIdx - (cycleSlot - 1) + 7) % 7;

                const handleClaimDailyBalloon = (balloonIdx: number) => {
                  if (isClaimedToday) {
                    playBalloonPopSound();
                    setDailyBonusPoppedIndex(balloonIdx);
                    return;
                  }
                  setDailyBonusPoppedIndex(balloonIdx);
                  playBalloonPopSound();
                  playStarRewardFanfare();
                  triggerBalloonPopVibration([45, 25, 65]);
                  setStars((prev) => prev + todayBonusStars);
                  setDailyBonusClaimedDate(todayStr);
                  setDailyBonusAwardedStars(todayBonusStars);
                  try {
                    localStorage.setItem(
                      DAILY_BALLOON_BONUS_KEY,
                      JSON.stringify({
                        claimedDate: todayStr,
                        awardedStars: todayBonusStars,
                      })
                    );
                  } catch {}
                };

                const bonusBalloons = [
                  {
                    idx: 0,
                    label:
                      nativeLang.code === 'ur'
                        ? 'گولڈن غبارہ'
                        : nativeLang.code === 'hi'
                        ? 'गोल्डन गुब्बारा'
                        : 'Golden Balloon',
                    gradient: 'from-amber-300 via-yellow-400 to-orange-500',
                    shadow: 'shadow-[0_10px_24px_rgba(245,158,11,0.45)]',
                  },
                  {
                    idx: 1,
                    label:
                      nativeLang.code === 'ur'
                        ? 'روبی غبارہ'
                        : nativeLang.code === 'hi'
                        ? 'रूबी गुब्बारा'
                        : 'Ruby Balloon',
                    gradient: 'from-rose-400 via-pink-500 to-red-600',
                    shadow: 'shadow-[0_10px_24px_rgba(225,29,72,0.45)]',
                  },
                  {
                    idx: 2,
                    label:
                      nativeLang.code === 'ur'
                        ? 'اسکائی غبارہ'
                        : nativeLang.code === 'hi'
                        ? 'स्काई गुब्बारा'
                        : 'Sky Balloon',
                    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
                    shadow: 'shadow-[0_10px_24px_rgba(14,165,233,0.45)]',
                  },
                ];

                return (
                  <>
                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={() => setDailyBonusModalOpen(false)}
                      className={`absolute top-4 right-4 z-20 p-2 rounded-full border cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                          : 'bg-white border-amber-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Top Badge */}
                    <div className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-600 dark:text-amber-300 text-xs font-extrabold tracking-wide mb-3">
                      <Gift className="w-4 h-4 text-amber-500" />
                      <span>
                        {nativeLang.code === 'ur'
                          ? '🎈 روزانہ لاگ ان بلون بونس'
                          : nativeLang.code === 'hi'
                          ? '🎈 डेली लॉगिन बैलून बोनस'
                          : '🎈 DAILY LOGIN BALLOON BONUS'}
                      </span>
                    </div>

                    <h2 className="relative z-10 font-display text-xl sm:text-2xl font-extrabold leading-tight">
                      {isClaimedToday
                        ? nativeLang.code === 'ur'
                          ? `🎉 مبارک ہو! آج کا +${dailyBonusAwardedStars || todayBonusStars} ⭐ بلون بونس مل گیا!`
                          : nativeLang.code === 'hi'
                          ? `🎉 बधाई हो! आज का +${dailyBonusAwardedStars || todayBonusStars} ⭐ बैलून बोनस मिल गया!`
                          : `🎉 Awesome! You Claimed +${dailyBonusAwardedStars || todayBonusStars} ⭐ Today!`
                        : nativeLang.code === 'ur'
                        ? 'آج کا گفٹ غبارہ پاپ کریں اور مفت ستارے جیتیں!'
                        : nativeLang.code === 'hi'
                        ? 'आज का गिफ्ट गुब्बारा फोड़ें और मुफ़्त सितारे जीतें!'
                        : 'Pop a Mystery Balloon for Today’s Login Bonus!'}
                    </h2>

                    <p
                      className={`relative z-10 text-xs sm:text-sm mt-1.5 leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {isClaimedToday
                        ? nativeLang.code === 'ur'
                          ? 'کل دوبارہ لاگ ان کریں تاکہ اگلے دن کا اور بھی بڑا بلون بونس حاصل کر سکیں!'
                          : nativeLang.code === 'hi'
                          ? 'कल फिर लॉगिन करें ताकि अगले दिन का और भी बड़ा बैलून बोनस पा सकें!'
                          : 'Come back tomorrow to pop your next Daily Bonus Balloon and earn even more stars!'
                        : nativeLang.code === 'ur'
                        ? `آپ کے لاگ ان ڈے (${dashT.weekDaysShort[todayMonZeroIdx]}) کے لیے کسی بھی غبارے پر ٹیپ کر کے +${todayBonusStars} ⭐ حاصل کریں۔`
                        : nativeLang.code === 'hi'
                        ? `अपने आज के लॉगिन दिन (${dashT.weekDaysShort[todayMonZeroIdx]}) के लिए किसी भी गुब्बारे पर टैप करके +${todayBonusStars} ⭐ पाएं।`
                        : `Tap any of the 3 balloons below to pop it and receive +${todayBonusStars} ⭐ for logging in on ${dashT.weekDaysShort[todayMonZeroIdx]}!`}
                    </p>

                    {/* 3 Interactive Floating Mystery Balloons with Burst Particles */}
                    <div className="relative z-10 grid grid-cols-3 gap-3 my-5">
                      {bonusBalloons.map((b) => {
                        const isPopped =
                          dailyBonusPoppedIndex === b.idx ||
                          (isClaimedToday &&
                            dailyBonusPoppedIndex === null &&
                            b.idx === 0);

                        return (
                          <div
                            key={b.idx}
                            onClick={() => handleClaimDailyBalloon(b.idx)}
                            className={`relative p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer select-none transition-all ${
                              isPopped
                                ? 'bg-amber-500/20 border-amber-400 scale-105'
                                : isDark
                                ? 'bg-slate-900/80 border-slate-700 hover:border-amber-400/70 hover:-translate-y-1'
                                : 'bg-white border-amber-200 hover:border-amber-400 hover:-translate-y-1 shadow-xs'
                            }`}
                          >
                            {/* Particle Burst Effect when Popped */}
                            <AnimatePresence>
                              {isPopped && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                  {[0, 45, 90, 135, 180, 225, 270, 315].map(
                                    (deg) => {
                                      const rad = (deg * Math.PI) / 180;
                                      const tx = Math.cos(rad) * 46;
                                      const ty = Math.sin(rad) * 46;
                                      return (
                                        <motion.span
                                          key={deg}
                                          initial={{
                                            x: 0,
                                            y: 0,
                                            scale: 0.4,
                                            opacity: 1,
                                          }}
                                          animate={{
                                            x: tx,
                                            y: ty,
                                            scale: [1.2, 0.2],
                                            opacity: [1, 0],
                                          }}
                                          transition={{
                                            duration: 0.65,
                                            ease: 'easeOut',
                                          }}
                                          className="absolute text-sm"
                                        >
                                          ⭐
                                        </motion.span>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </AnimatePresence>

                            <motion.div
                              animate={
                                isPopped
                                  ? { scale: [1.25, 0.9, 1], rotate: [0, 8, -8, 0] }
                                  : { y: [0, -6, 0] }
                              }
                              transition={{
                                duration: isPopped ? 0.45 : 2.2 + b.idx * 0.3,
                                repeat: isPopped ? 0 : Infinity,
                                ease: 'easeInOut',
                              }}
                              className={`w-14 h-16 sm:w-16 sm:h-20 rounded-full bg-gradient-to-b ${b.gradient} ${b.shadow} flex flex-col items-center justify-center text-white relative`}
                            >
                              {/* Specular Highlight */}
                              <div className="w-3 h-5 rounded-full bg-white/45 absolute top-2.5 left-3 -rotate-12" />
                              {isPopped ? (
                                <span
                                  dir="ltr"
                                  className="font-display font-black text-xs sm:text-sm text-slate-950 bg-white/90 px-2 py-0.5 rounded-full shadow-xs"
                                >
                                  +{todayBonusStars}⭐
                                </span>
                              ) : (
                                <span className="text-xl sm:text-2xl drop-shadow-xs">
                                  🎁
                                </span>
                              )}
                            </motion.div>

                            <span className="font-display font-extrabold text-[11px] sm:text-xs">
                              {isPopped
                                ? nativeLang.code === 'ur'
                                  ? '💥 پاپ ہوا!'
                                  : nativeLang.code === 'hi'
                                  ? '💥 फूट गया!'
                                  : '💥 POPPED!'
                                : b.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 7-Day Daily Login Bonus Escalating Calendar (Starts from Login Weekday) */}
                    <div className="relative z-10 mb-5">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-300 mb-2">
                        {nativeLang.code === 'ur'
                          ? '7 دن کا لاگ ان بلون بونس شیڈول'
                          : nativeLang.code === 'hi'
                          ? '7 दिन का लॉगिन बैलून बोनस शेड्यूल'
                          : '7-Day Daily Login Bonus Rewards'}
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {DAILY_BONUS_TIERS.map((tierStars, idx) => {
                          const slotNum = idx + 1;
                          const weekdayIdx = (startWeekdayIdx + idx) % 7;
                          const dayLabel = dashT.weekDaysShort[weekdayIdx];
                          const isPastOrToday =
                            slotNum < cycleSlot ||
                            (slotNum === cycleSlot && isClaimedToday);
                          const isCurrentDay = slotNum === cycleSlot;

                          return (
                            <div
                              key={slotNum}
                              className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 ${
                                isCurrentDay
                                  ? 'bg-gradient-to-b from-amber-400/35 to-orange-500/35 border-amber-400 ring-2 ring-amber-400/60'
                                  : isPastOrToday
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                                  : isDark
                                  ? 'bg-slate-900/70 border-slate-800 text-slate-400'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              <span className="text-[10px] font-display font-extrabold truncate max-w-full">
                                {dayLabel}
                              </span>
                              <span
                                dir="ltr"
                                className="text-[10px] font-mono font-black text-amber-500"
                              >
                                +{tierStars}⭐
                              </span>
                              <span className="text-[9px] font-bold">
                                {isPastOrToday ? '✓' : `D${slotNum}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Primary Claim / Continue Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!isClaimedToday) {
                          handleClaimDailyBalloon(0);
                        } else {
                          setDailyBonusModalOpen(false);
                        }
                      }}
                      className="relative z-10 w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:brightness-105 text-slate-950 font-display font-extrabold text-sm sm:text-base shadow-[0_6px_0_#9A3412] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {!isClaimedToday
                          ? nativeLang.code === 'ur'
                            ? `🎈 غبارہ پاپ کریں اور +${todayBonusStars} ⭐ حاصل کریں`
                            : nativeLang.code === 'hi'
                            ? `🎈 गुब्बारा फोड़ें और +${todayBonusStars} ⭐ पाएं`
                            : `🎈 Pop & Claim +${todayBonusStars} ⭐ Daily Bonus`
                          : nativeLang.code === 'ur'
                          ? '✓ بہت خوب! مشق جاری رکھیں'
                          : nativeLang.code === 'hi'
                          ? '✓ बहुत बढ़िया! अभ्यास जारी रखें'
                          : '✓ Awesome! Continue Learning'}
                      </span>
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REAL-TIME ANTI-HACK & INTRUSION DETECTION ALERT BANNER */}
      <AnimatePresence>
        {activeSecurityAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-[150] w-[95%] max-w-2xl rounded-2xl border-2 border-rose-400 bg-gradient-to-r from-rose-950 via-red-900 to-slate-950 text-white p-4 shadow-[0_20px_60px_rgba(225,29,72,0.65)] pointer-events-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                      🚨 HACK ATTEMPT BLOCKED
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-200">
                      {activeSecurityAlert.attackType}
                    </span>
                  </div>
                  <div className="font-display font-extrabold text-xs sm:text-sm text-white mt-1">
                    کسی نے ویب سائٹ ہیک یا چھیڑ چھاڑ کرنے کی کوشش کی ہے! سسٹم نے حملہ بلاک کر کے ریکارڈ کر لیا ہے۔
                  </div>
                  <div className="text-[11px] font-mono text-rose-200/90 truncate mt-1">
                    Source: {activeSecurityAlert.source} · Payload:{' '}
                    {activeSecurityAlert.payload}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAdminUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminCommandUnlocked(true);
                      setHubModalTab('admin');
                      setHubModalOpen(true);
                      setActiveSecurityAlert(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white text-rose-950 hover:bg-rose-100 font-display font-extrabold text-xs cursor-pointer shadow-sm whitespace-nowrap"
                  >
                    🛡️ سیکیورٹی رپورٹ دیکھیں
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSecurityAlert(null)}
                  className="p-2 rounded-xl bg-rose-800/70 hover:bg-rose-700 text-white cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
