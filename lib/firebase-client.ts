'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const HARDENED_ADMIN_GMAIL = 'tiktokautomation7861@gmail.com' as const;
export const BOOTSTRAPPED_ADMIN_EMAIL: string = (() => {
  const rawEnv =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ADMIN_EMAIL
      ? process.env.NEXT_PUBLIC_ADMIN_EMAIL.trim().toLowerCase()
      : '';
  return rawEnv === HARDENED_ADMIN_GMAIL ? rawEnv : HARDENED_ADMIN_GMAIL;
})();
const LOCAL_GOOGLE_USER_KEY = 'learning_balloon_google_user_v1';
const LOCAL_GOOGLE_ACCOUNTS_LIST_KEY = 'learning_balloon_google_accounts_v1';

export interface SavedGoogleAccount {
  email: string;
  displayName: string;
  photoURL?: string | null;
}

const DEFAULT_GOOGLE_CHOOSER_ACCOUNTS: SavedGoogleAccount[] = [
  {
    email: BOOTSTRAPPED_ADMIN_EMAIL,
    displayName: 'TikTok Automation',
  },
];

function cleanLegacyAccountName(name: string, email: string): string {
  const cleaned = (name || '')
    .replace(/\s*\(Learning Balloon\)\s*/gi, '')
    .replace(/\s*Learning Balloon Learner\s*/gi, '')
    .replace(/\s*Learning Balloon Student\s*/gi, '')
    .replace(/\s*Family Learner\s*/gi, '')
    .trim();
  if (email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    if (!cleaned || cleaned.toLowerCase() === 'mustafa') {
      return 'TikTok Automation';
    }
  }
  return cleaned || email.split('@')[0] || 'Learner';
}

const REMOVED_FAKE_EMAILS = new Set([
  'learningballoon.student@gmail.com',
  'family.learner786@gmail.com',
  'mustafalearningballoon@gmail.com',
  'mustafalearningballoonlearner@gmail.com',
]);

export function getSavedGoogleAccounts(): SavedGoogleAccount[] {
  if (typeof window === 'undefined') return DEFAULT_GOOGLE_CHOOSER_ACCOUNTS;
  try {
    const raw = localStorage.getItem(LOCAL_GOOGLE_ACCOUNTS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered: SavedGoogleAccount[] = [];
        for (const item of parsed) {
          const email = String(item?.email || '').trim().toLowerCase();
          const rawName = String(item?.displayName || '').trim();
          if (
            !email ||
            REMOVED_FAKE_EMAILS.has(email) ||
            /learning\s*balloon/i.test(email) ||
            /family\.learner/i.test(email) ||
            /learning balloon student/i.test(rawName) ||
            /family learner/i.test(rawName)
          ) {
            continue;
          }
          filtered.push({
            email,
            displayName: cleanLegacyAccountName(rawName, email),
            photoURL: item?.photoURL || null,
          });
        }
        for (const def of DEFAULT_GOOGLE_CHOOSER_ACCOUNTS) {
          if (
            !filtered.some(
              (a) => a.email.toLowerCase() === def.email.toLowerCase()
            )
          ) {
            filtered.push(def);
          }
        }
        return filtered.length > 0 ? filtered : DEFAULT_GOOGLE_CHOOSER_ACCOUNTS;
      }
    }
  } catch {}
  return DEFAULT_GOOGLE_CHOOSER_ACCOUNTS;
}

export interface VerifiedGoogleSessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  isFallbackSession?: boolean;
}

type AuthListenerCallback = (user: User | null) => void;
const customAuthListeners = new Set<AuthListenerCallback>();
let cachedFallbackUser: User | null = null;

function createSyntheticFirebaseUser(profile: {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}): User {
  const cleanUid =
    profile.uid.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128) ||
    `bunny_${Date.now()}`;
  return {
    uid: cleanUid,
    email: profile.email.trim().toLowerCase(),
    displayName: profile.displayName.trim(),
    photoURL: profile.photoURL || null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [
      {
        providerId: 'google.com',
        uid: cleanUid,
        displayName: profile.displayName.trim(),
        email: profile.email.trim().toLowerCase(),
        phoneNumber: null,
        photoURL: profile.photoURL || null,
      },
    ],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'firebase',
  } as unknown as User;
}

export function loadSavedGoogleSessionUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_GOOGLE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string' && parsed.email.trim()) {
      const email = parsed.email.trim().toLowerCase();
      if (REMOVED_FAKE_EMAILS.has(email)) {
        localStorage.removeItem(LOCAL_GOOGLE_USER_KEY);
        return null;
      }
      const cleanedDisplayName = cleanLegacyAccountName(
        parsed.displayName || '',
        email
      );
      cachedFallbackUser = createSyntheticFirebaseUser({
        uid: parsed.uid || `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        displayName: cleanedDisplayName,
        photoURL: parsed.photoURL,
      });
      return cachedFallbackUser;
    }
  } catch {}
  return null;
}

export function completeGoogleSignInToLearningBalloon(profile: {
  email: string;
  displayName?: string;
  photoURL?: string;
}): User {
  const cleanEmail = profile.email.trim().toLowerCase();
  const cleanName = cleanLegacyAccountName(
    profile.displayName || '',
    cleanEmail
  );
  const cleanUid = `google_${cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 96)}`;
  const syntheticUser = createSyntheticFirebaseUser({
    uid: cleanUid,
    email: cleanEmail,
    displayName: cleanName,
    photoURL: profile.photoURL,
  });
  cachedFallbackUser = syntheticUser;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        LOCAL_GOOGLE_USER_KEY,
        JSON.stringify({
          uid: cleanUid,
          email: cleanEmail,
          displayName: cleanName,
          photoURL: profile.photoURL || null,
        })
      );
      const currentList = getSavedGoogleAccounts().filter(
        (a) => a.email.toLowerCase() !== cleanEmail.toLowerCase()
      );
      const updatedList: SavedGoogleAccount[] = [
        {
          email: cleanEmail,
          displayName: cleanName,
          photoURL: profile.photoURL || null,
        },
        ...currentList,
      ].slice(0, 8);
      localStorage.setItem(
        LOCAL_GOOGLE_ACCOUNTS_LIST_KEY,
        JSON.stringify(updatedList)
      );
    } catch {}
  }

  // If Firebase auth has a different user signed in than the explicitly chosen email, sign out the old Firebase user
  const fbCurrent = auth.currentUser;
  if (
    fbCurrent &&
    fbCurrent.email &&
    fbCurrent.email.trim().toLowerCase() !== cleanEmail
  ) {
    signOut(auth).catch(() => {});
    customAuthListeners.forEach((cb) => cb(syntheticUser));
    return syntheticUser;
  }

  const effectiveUser =
    fbCurrent &&
    fbCurrent.email &&
    fbCurrent.email.trim().toLowerCase() === cleanEmail
      ? fbCurrent
      : syntheticUser;
  customAuthListeners.forEach((cb) => cb(effectiveUser));
  return effectiveUser;
}

export const completeGoogleSignInToLearningBunny =
  completeGoogleSignInToLearningBalloon;

export function onAuthStateChanged(
  _authInstance: typeof auth,
  callback: AuthListenerCallback
) {
  customAuthListeners.add(callback);
  const saved = loadSavedGoogleSessionUser();
  const unsubFirebase = firebaseOnAuthStateChanged(auth, (fbUser) => {
    const activeLocal = cachedFallbackUser || loadSavedGoogleSessionUser() || saved;
    if (
      activeLocal &&
      activeLocal.email &&
      (!fbUser ||
        !fbUser.email ||
        fbUser.email.trim().toLowerCase() !==
          activeLocal.email.trim().toLowerCase())
    ) {
      callback(activeLocal);
    } else if (fbUser) {
      callback(fbUser);
    } else {
      callback(activeLocal || null);
    }
  });
  return () => {
    customAuthListeners.delete(callback);
    unsubFirebase();
  };
}

export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user || user.isAnonymous || user.emailVerified !== true) return false;
  if (typeof user.email !== 'string' || !user.email.trim()) return false;
  const normalizedEmail = user.email.trim().toLowerCase();
  if (
    normalizedEmail !== HARDENED_ADMIN_GMAIL ||
    normalizedEmail !== BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  ) {
    return false;
  }
  if (Array.isArray(user.providerData) && user.providerData.length > 0) {
    const providerMatchesAdmin = user.providerData.some(
      (provider) =>
        typeof provider?.email === 'string' &&
        provider.email.trim().toLowerCase() === HARDENED_ADMIN_GMAIL
    );
    if (!providerMatchesAdmin) return false;
  }
  return true;
}

// Schema Validation Constants (Synced verbatim with firebase-blueprint.json & firestore.rules)
export const MAX_UID_LENGTH = 128;
export const UID_PATTERN = /^[a-zA-Z0-9_\-]+$/;
export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MAX_LANG_CODE_LENGTH = 16;
export const MAX_LANG_NAME_LENGTH = 60;
export const VALID_DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
export const VALID_STAGES = [
  'ALPHABET_GAME',
  'WORDS_GAME',
  'CONVERSATION_GAME',
  'COMPLETED',
] as const;
export const DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export type DifficultyLevel = (typeof VALID_DIFFICULTY_LEVELS)[number];

export interface LearnerRecord {
  uid: string;
  displayName: string;
  nativeLangCode: string;
  nativeLangName: string;
  targetLangCode: string;
  targetLangName: string;
  difficultyLevel: DifficultyLevel;
  currentStage: 'ALPHABET_GAME' | 'WORDS_GAME' | 'CONVERSATION_GAME' | 'COMPLETED';
  alphabetsCompleted: number;
  alphabetsTotal: number;
  wordsCompleted: number;
  wordsTotal: number;
  conversationsCompleted: number;
  conversationsTotal: number;
  stars: number;
  streakDays: number;
  streakGoalDays: number;
  lastActiveDate: string;
  certificateEarned: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Notice: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
let connectionChecked = false;
export async function testFirestoreConnection() {
  if (connectionChecked || typeof window === 'undefined') return;
  connectionChecked = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.warn('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date(Date.now() - 86400000);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const PENDING_GOOGLE_REDIRECT_SCREEN_KEY = 'balloony_pending_google_redirect_v1';

export function isEmbeddedInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|WhatsApp|Line\/|MicroMessenger|BytedanceWebview|musical_ly|TikTok|Snapchat|;\s*wv\)/i.test(
    ua
  );
}

export function isMobileOrTabletBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || ''
  );
}

function isTopLevelWindow(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}

export interface RedirectSignInOutcome {
  user: User | null;
  returnScreen: string | null;
  error?: any;
}

let cachedRedirectPromise: Promise<RedirectSignInOutcome> | null = null;

export function consumeGoogleRedirectSignInResult(): Promise<RedirectSignInOutcome> {
  if (typeof window === 'undefined') {
    return Promise.resolve({ user: null, returnScreen: null });
  }
  if (cachedRedirectPromise) return cachedRedirectPromise;

  cachedRedirectPromise = (async () => {
    let savedReturnScreen: string | null = null;
    try {
      savedReturnScreen = sessionStorage.getItem(PENDING_GOOGLE_REDIRECT_SCREEN_KEY);
    } catch {}

    try {
      const res = await getRedirectResult(auth);
      try {
        if (savedReturnScreen) {
          sessionStorage.removeItem(PENDING_GOOGLE_REDIRECT_SCREEN_KEY);
        }
      } catch {}
      if (res?.user && res.user.email) {
        completeGoogleSignInToLearningBalloon({
          email: res.user.email,
          displayName: res.user.displayName || undefined,
          photoURL: res.user.photoURL || undefined,
        });
        return {
          user: res.user,
          returnScreen: savedReturnScreen,
        };
      }
      return {
        user: null,
        returnScreen: savedReturnScreen,
      };
    } catch (err: any) {
      try {
        if (savedReturnScreen) {
          sessionStorage.removeItem(PENDING_GOOGLE_REDIRECT_SCREEN_KEY);
        }
      } catch {}
      return {
        user: null,
        returnScreen: savedReturnScreen,
        error: err,
      };
    }
  })();

  return cachedRedirectPromise;
}

if (typeof window !== 'undefined') {
  consumeGoogleRedirectSignInResult().catch(() => {});
}

let gsiScriptLoadPromise: Promise<void> | null = null;
let preferOfficialGsiPopup = false;

function ensureGoogleIdentityScriptLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (gsiScriptLoadPromise) return gsiScriptLoadPromise;
  gsiScriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Identity Services')),
        { once: true }
      );
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiScriptLoadPromise = null;
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.head.appendChild(script);
  });
  return gsiScriptLoadPromise;
}

if (typeof window !== 'undefined' && firebaseConfig.oAuthClientId) {
  ensureGoogleIdentityScriptLoaded().catch(() => {});
}

async function signInWithOfficialGoogleGsiPopup(): Promise<User | null> {
  const clientId = (firebaseConfig as any).oAuthClientId;
  if (!clientId) {
    throw new Error('Google OAuth Client ID is not configured.');
  }
  await ensureGoogleIdentityScriptLoaded();
  const oauth2 = (window as any).google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google Sign-In service is unavailable.');
  }

  return new Promise<User | null>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: async (tokenResponse: any) => {
        if (!tokenResponse || tokenResponse.error) {
          const errObj: any = new Error(
            tokenResponse?.error_description ||
              tokenResponse?.error ||
              'Google Sign-In was cancelled.'
          );
          errObj.code =
            tokenResponse?.error === 'access_denied'
              ? 'auth/popup-closed-by-user'
              : 'auth/cancelled-popup-request';
          reject(errObj);
          return;
        }
        const accessToken = tokenResponse.access_token;
        try {
          try {
            const cred = GoogleAuthProvider.credential(null, accessToken);
            const fbRes = await signInWithCredential(auth, cred);
            if (fbRes.user && fbRes.user.email) {
              completeGoogleSignInToLearningBalloon({
                email: fbRes.user.email,
                displayName: fbRes.user.displayName || undefined,
                photoURL: fbRes.user.photoURL || undefined,
              });
              resolve(fbRes.user);
              return;
            }
          } catch {
            // If Firebase credential exchange fails on preview domain, fetch profile directly from Google's official userinfo endpoint
          }

          const profileRes = await fetch(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          if (!profileRes.ok) {
            throw new Error('Failed to fetch Google user profile.');
          }
          const profileData = await profileRes.json();
          if (!profileData || !profileData.email) {
            throw new Error('Google account email was not returned.');
          }
          const verifiedUser = completeGoogleSignInToLearningBalloon({
            email: profileData.email,
            displayName:
              profileData.name ||
              profileData.given_name ||
              profileData.email.split('@')[0],
            photoURL: profileData.picture || undefined,
          });
          resolve(verifiedUser);
        } catch (profileErr) {
          reject(profileErr);
        }
      },
      error_callback: (err: any) => {
        const errType = String(err?.type || '');
        const closedErr: any = new Error(
          err?.message ||
            (errType === 'popup_failed_to_open'
              ? 'Popup window was blocked by your mobile browser.'
              : 'Google Sign-In window closed.')
        );
        closedErr.code =
          errType === 'popup_failed_to_open'
            ? 'auth/popup-blocked'
            : 'auth/popup-closed-by-user';
        reject(closedErr);
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}

export async function signInWithGooglePopup(
  returnScreenAfterRedirect?: string
): Promise<User | null> {
  if (isEmbeddedInAppBrowser()) {
    const webviewErr: any = new Error(
      'Google Sign-In is blocked inside in-app browsers (WhatsApp/Instagram/TikTok). Please open this link in Chrome or Safari.'
    );
    webviewErr.code = 'auth/embedded-webview';
    throw webviewErr;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  if (
    preferOfficialGsiPopup &&
    !isTopLevelWindow() &&
    (firebaseConfig as any).oAuthClientId
  ) {
    return signInWithOfficialGoogleGsiPopup();
  }

  const attemptStartMs = Date.now();
  try {
    const res = await signInWithPopup(auth, provider);
    if (res.user && res.user.email) {
      completeGoogleSignInToLearningBunny({
        email: res.user.email,
        displayName: res.user.displayName || undefined,
        photoURL: res.user.photoURL || undefined,
      });
    }
    return res.user;
  } catch (err: any) {
    const code = String(err?.code || '');
    const elapsed = Date.now() - attemptStartMs;

    // 1. Unauthorized deployed domain: surface exact domain so it can be allowlisted cleanly
    if (code === 'auth/unauthorized-domain') {
      const host =
        typeof window !== 'undefined' ? window.location.hostname : '';
      const domainErr: any = new Error(
        `This deployed domain (${host}) is not added in Firebase Auth Authorized Domains.`
      );
      domainErr.code = 'auth/unauthorized-domain';
      domainErr.unauthorizedHost = host;
      throw domainErr;
    }

    // 2. Deployed / standalone mobile or desktop window where popup failed or was blocked -> use native full-page Google redirect!
    const shouldUseRedirectFallback =
      isTopLevelWindow() &&
      (code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/web-storage-unsupported' ||
        code === 'auth/internal-error' ||
        (isMobileOrTabletBrowser() &&
          (code === 'auth/popup-closed-by-user' ||
            code === 'auth/cancelled-popup-request') &&
          elapsed < 1200));

    if (shouldUseRedirectFallback) {
      try {
        if (typeof window !== 'undefined' && returnScreenAfterRedirect) {
          sessionStorage.setItem(
            PENDING_GOOGLE_REDIRECT_SCREEN_KEY,
            returnScreenAfterRedirect
          );
        }
      } catch {}
      await signInWithRedirect(auth, provider);
      return null;
    }

    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      throw err;
    }

    if (!isTopLevelWindow() && (firebaseConfig as any).oAuthClientId) {
      preferOfficialGsiPopup = true;
      return signInWithOfficialGoogleGsiPopup();
    }
    throw err;
  }
}

export async function signOutLearner(): Promise<void> {
  cachedFallbackUser = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_GOOGLE_USER_KEY);
    } catch {}
  }
  try {
    await signOut(auth);
  } catch {}
  customAuthListeners.forEach((cb) => cb(null));
}

export function sanitizeLearnerPayload(raw: Omit<LearnerRecord, 'createdAt' | 'updatedAt'>) {
  const uid = String(raw.uid || '')
    .replace(/[^a-zA-Z0-9_\-]/g, '')
    .slice(0, MAX_UID_LENGTH);
  const displayName =
    String(raw.displayName || 'Learner')
      .trim()
      .slice(0, MAX_DISPLAY_NAME_LENGTH) || 'Learner';
  const nativeLangCode =
    String(raw.nativeLangCode || 'ur')
      .trim()
      .slice(0, MAX_LANG_CODE_LENGTH) || 'ur';
  const nativeLangName =
    String(raw.nativeLangName || 'Urdu')
      .trim()
      .slice(0, MAX_LANG_NAME_LENGTH) || 'Urdu';
  const targetLangCode =
    String(raw.targetLangCode || 'en')
      .trim()
      .slice(0, MAX_LANG_CODE_LENGTH) || 'en';
  const targetLangName =
    String(raw.targetLangName || 'English')
      .trim()
      .slice(0, MAX_LANG_NAME_LENGTH) || 'English';
  const difficultyLevel: DifficultyLevel = VALID_DIFFICULTY_LEVELS.includes(
    raw.difficultyLevel
  )
    ? raw.difficultyLevel
    : 'easy';
  const currentStage = VALID_STAGES.includes(raw.currentStage)
    ? raw.currentStage
    : 'ALPHABET_GAME';
  const lastActiveDate = DATE_PATTERN.test(raw.lastActiveDate)
    ? raw.lastActiveDate
    : getTodayDateString();

  return {
    uid,
    displayName,
    nativeLangCode,
    nativeLangName,
    targetLangCode,
    targetLangName,
    difficultyLevel,
    currentStage,
    alphabetsCompleted: Math.max(0, Math.min(500, Math.floor(raw.alphabetsCompleted || 0))),
    alphabetsTotal: Math.max(1, Math.min(500, Math.floor(raw.alphabetsTotal || 26))),
    wordsCompleted: Math.max(0, Math.min(500, Math.floor(raw.wordsCompleted || 0))),
    wordsTotal: Math.max(1, Math.min(500, Math.floor(raw.wordsTotal || 100))),
    conversationsCompleted: Math.max(
      0,
      Math.min(500, Math.floor(raw.conversationsCompleted || 0))
    ),
    conversationsTotal: Math.max(
      1,
      Math.min(500, Math.floor(raw.conversationsTotal || 30))
    ),
    stars: Math.max(0, Math.min(100000, Math.floor(raw.stars || 0))),
    streakDays: Math.max(0, Math.min(3650, Math.floor(raw.streakDays ?? 0))),
    streakGoalDays: Math.max(1, Math.min(365, Math.floor(raw.streakGoalDays || 7))),
    lastActiveDate,
    certificateEarned: Boolean(raw.certificateEarned),
  };
}

export async function syncLearnerProfileToFirestore(
  raw: Omit<LearnerRecord, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const clean = sanitizeLearnerPayload({ ...raw, uid: user.uid });
  if (!UID_PATTERN.test(clean.uid)) return;

  const docPath = `learners/${clean.uid}`;
  const docRef = doc(db, 'learners', clean.uid);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        displayName: clean.displayName,
        nativeLangCode: clean.nativeLangCode,
        nativeLangName: clean.nativeLangName,
        targetLangCode: clean.targetLangCode,
        targetLangName: clean.targetLangName,
        difficultyLevel: clean.difficultyLevel,
        currentStage: clean.currentStage,
        alphabetsCompleted: clean.alphabetsCompleted,
        alphabetsTotal: clean.alphabetsTotal,
        wordsCompleted: clean.wordsCompleted,
        wordsTotal: clean.wordsTotal,
        conversationsCompleted: clean.conversationsCompleted,
        conversationsTotal: clean.conversationsTotal,
        stars: clean.stars,
        streakDays: clean.streakDays,
        streakGoalDays: clean.streakGoalDays,
        lastActiveDate: clean.lastActiveDate,
        certificateEarned: clean.certificateEarned,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function adminUpdateLearnerFields(
  learnerUid: string,
  existingRecord: LearnerRecord,
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
  >
): Promise<void> {
  const user = auth.currentUser;
  if (!isUserAdmin(user) || !user) return;

  const clean = sanitizeLearnerPayload({
    ...existingRecord,
    ...updates,
    uid: existingRecord.uid,
  });

  const docPath = `learners/${learnerUid}`;
  const docRef = doc(db, 'learners', learnerUid);

  try {
    await updateDoc(docRef, {
      displayName: clean.displayName,
      nativeLangCode: clean.nativeLangCode,
      nativeLangName: clean.nativeLangName,
      targetLangCode: clean.targetLangCode,
      targetLangName: clean.targetLangName,
      difficultyLevel: clean.difficultyLevel,
      currentStage: clean.currentStage,
      alphabetsCompleted: clean.alphabetsCompleted,
      alphabetsTotal: clean.alphabetsTotal,
      wordsCompleted: clean.wordsCompleted,
      wordsTotal: clean.wordsTotal,
      conversationsCompleted: clean.conversationsCompleted,
      conversationsTotal: clean.conversationsTotal,
      stars: clean.stars,
      streakDays: clean.streakDays,
      streakGoalDays: clean.streakGoalDays,
      lastActiveDate: clean.lastActiveDate,
      certificateEarned: clean.certificateEarned,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export { collection, query, orderBy, limit, onSnapshot, doc };
export type { User };
