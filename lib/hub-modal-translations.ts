import { LanguageInfo } from './languages';

export interface HubModalTranslations {
  // Tabs
  tabStreakLevels: string;
  tabAchievements: (unlocked: number, total: number) => string;
  tabLeaderboard: string;
  tabAnalytics: string;
  tabCertificate: string;
  tabAdmin: string;

  // Streak & Levels Tab
  dailyStreakBadge: string;
  goalDaysLabel: (days: number) => string;
  streakUnitLabel: string;
  streakCardHeading: string;
  streakCardDesc: string;
  customStreakTitle: string;
  currentStreakDaysLabel: string;
  streakGoalInputLabel: string;
  presetTargetDays: (days: number) => string;
  saveStreakBtn: string;
  streakSavedToast: (streak: number, goal: number) => string;

  levelSystemBadge: string;
  usernameInputLabel: string;
  usernameInputPlaceholder: string;
  activeBadge: string;
  level1Title: string;
  level1Desc: string;
  level1SelectedToast: string;
  level2Title: string;
  level2Desc: string;
  level2SelectedToast: string;
  level3Title: string;
  level3Desc: string;
  level3SelectedToast: string;

  achievementsStripTitle: (unlocked: number, total: number) => string;
  achievementsStripDesc: string;
  viewAchievementsBtn: string;

  // Achievements Tab
  achievementsBannerTitle: string;
  achievementsBannerDesc: string;
  unlockedBadgesStat: string;
  currentStreakStat: string;
  balloonsPoppedStat: string;
  wordsMasteredStat: string;
  filterAll: (count: number) => string;
  filterUnlocked: (count: number) => string;
  filterInProgress: (count: number) => string;
  statusUnlocked: string;
  statusInProgress: string;
  rewardClaimedBtn: (stars: number) => string;
  claimRewardBtn: (stars: number) => string;
  alreadyClaimedToast: (title: string) => string;
  claimedSuccessToast: (title: string, stars: number) => string;

  // Certificate Tab
  studentNameCertLabel: string;
  completionDateCertLabel: string;
  selectCertDesignLabel: string;
  design1Arch: string;
  design2Cap: string;
  uploadCustomDesignTitle: string;
  preparingCertAndQr: string;
  customQrInputPlaceholder: string;
  autoDataBtn: string;
  downloadQrPngBtn: string;
  generatingPdfBtn: string;
  downloadCertPdfBtn: string;
  customCertSavedToast: string;
  certPdfDownloadedToast: string;
  certPdfErrorToast: string;
  qrPngDownloadedToast: string;

  // Admin Console Tab (/mustafa)
  adminHeaderTitle: string;
  adminGoogleSignInBtn: string;
  adminSignOutBtn: string;
  adminGoogleConnectedToast: string;
  adminGoogleErrorMsg: string;
  kpiTotalProfiles: string;
  kpiTotalProfilesSub: string;
  kpiAvgStreak: string;
  kpiAvgStreakSub: string;
  kpiTotalStars: string;
  kpiTotalStarsSub: string;
  kpiCompletedCert: string;
  kpiCompletedCertSub: string;
  searchProfilePlaceholder: string;
  newStudentPlaceholder: string;
  addNewProfileBtn: string;
  profileAddedToast: (name: string) => string;
  directoryHeader: (count: number) => string;
  directoryHint: string;
  loadingProfilesText: string;
  noStudentFoundText: string;
  levelShortLabel: (lvl: number) => string;
  starsCountLabel: (count: number | string) => string;
  selectedProfileInspectorTag: string;
  lastActiveLabel: string;
  pdfCertBtn: string;
  downloadStudentCertTitle: string;
  streakControlTitle: string;
  targetDaysShort: (days: number) => string;
  decreaseBtn: string;
  daysStreakLabel: string;
  increaseBtn: string;
  customStreakInputAdmin: string;
  goalDaysInputAdmin: string;
  applyBtn: string;
  levelControlTitle: string;
  levelDownBtn: string;
  levelUpBtn: string;
  stageSub1: string;
  stageSub2: string;
  stageSub3: string;
  stageSub4: string;
  starsRewardsTitle: string;
  selectStudentFromListHint: string;
  currentUserDefaultName: string;

  // Analytics Tab
  kpiActiveLearners: string;
  kpiTotalStarsCard: string;
  kpiPoppedBalloons: string;
  kpiAvgStreakCard: string;
  loadingAnalyticsText: string;
  chart1Title: string;
  chart1Subtitle: string;
  chart1SeriesStars: string;
  chart1SeriesUsers: string;
  chart2Title: string;
  chart2Subtitle: string;
  chart2SeriesAlphabet: string;
  chart2SeriesWords: string;
  chart2SeriesConversation: string;

  // Leaderboard Tab
  leaderboardBannerTitle: string;
  leaderboardByStarsBadge: string;
  leaderboardBannerDesc: string;
  yourStarsLabel: (stars: number) => string;
  loadingLeaderboardText: string;
  rank1Title: string;
  rank2Title: string;
  rank3Title: string;
  streakDaysCount: (days: number) => string;
  top10ListHeading: (count: number) => string;
  youBadge: string;
  statStreak: (days: number) => string;
  statAlphabet: (done: number, total: number) => string;
  statWords: (done: number, total: number) => string;
  statConversation: (done: number, total: number) => string;
}

const EN_MODAL: HubModalTranslations = {
  tabStreakLevels: 'Streak & Levels',
  tabAchievements: (u, t) => `Achievements (${u}/${t})`,
  tabLeaderboard: 'Leaderboard',
  tabAnalytics: 'Analytics',
  tabCertificate: 'Certificate',
  tabAdmin: 'Admin (/mustafa)',

  dailyStreakBadge: 'Daily Streak System',
  goalDaysLabel: (d) => `Goal: ${d} Days`,
  streakUnitLabel: 'Day Streak',
  streakCardHeading: 'Continuous Learning Streak 🔥',
  streakCardDesc:
    'Practicing every day builds your streak! If you miss a day, it resets to 0 — or you can customize your streak and target below.',
  customStreakTitle: 'Custom Streak Settings:',
  currentStreakDaysLabel: 'Current Streak (Days):',
  streakGoalInputLabel: 'Streak Goal (Target Days):',
  presetTargetDays: (d) => `${d} Days Goal`,
  saveStreakBtn: '✅ Save Streak Settings',
  streakSavedToast: (s, g) =>
    `🔥 Your streak (${s} days) and goal (${g} days) have been updated!`,

  levelSystemBadge: 'Difficulty Levels (Easy → Medium → Hard)',
  usernameInputLabel: '👤 Your Username (shown on Certificate & Leaderboard):',
  usernameInputPlaceholder: 'Enter your name...',
  activeBadge: 'Active',
  level1Title: '🌱 Level 1: Easy (Beginner)',
  level1Desc: 'Gentle pronunciation checking, full guidance, and easy alphabet & word practice.',
  level1SelectedToast: '🌱 Level 1 (Easy) selected: Listen and speak at a comfortable pace!',
  level2Title: '⚡ Level 2: Medium (Intermediate)',
  level2Desc: 'Accurate pronunciation, building sentences from words, and faster speech checks.',
  level2SelectedToast: '⚡ Level 2 (Medium) selected: Practice vocabulary and sentence building!',
  level3Title: '🔥 Level 3: Hard (Mastery)',
  level3Desc: 'Fluent speaking, strict pronunciation matching, and complete sentence mastery.',
  level3SelectedToast: '🔥 Level 3 (Hard) selected: Full fluency and mastery mode!',

  achievementsStripTitle: (u, t) => `Achievements & Badges (${u}/${t} Unlocked)`,
  achievementsStripDesc:
    "Complete milestones like '5 Days Streak', '100 Balloons Popped', and 'Mastered 50 Words' to unlock badges and bonus stars!",
  viewAchievementsBtn: 'View All Achievements',

  achievementsBannerTitle: 'Achievements & Milestone Badges',
  achievementsBannerDesc:
    'Badges unlock automatically when you reach a milestone. Click any unlocked badge to claim your bonus stars!',
  unlockedBadgesStat: 'Unlocked Badges:',
  currentStreakStat: 'Current Streak:',
  balloonsPoppedStat: 'Balloons Popped:',
  wordsMasteredStat: 'Words Mastered:',
  filterAll: (c) => `All (${c})`,
  filterUnlocked: (c) => `Unlocked (${c})`,
  filterInProgress: (c) => `In Progress (${c})`,
  statusUnlocked: 'Unlocked',
  statusInProgress: 'In Progress',
  rewardClaimedBtn: (s) => `Reward Claimed (+${s} ⭐)`,
  claimRewardBtn: (s) => `Claim +${s} Bonus Stars`,
  alreadyClaimedToast: (title) => `🏅 Reward for "${title}" has already been claimed!`,
  claimedSuccessToast: (title, s) =>
    `🎉 Congratulations! You earned +${s} bonus stars for unlocking "${title}"!`,

  studentNameCertLabel: '👤 Student Name (for Certificate):',
  completionDateCertLabel: '📅 Course Completion Date:',
  selectCertDesignLabel: '🖼️ Select Certificate Design:',
  design1Arch: 'Design 1 (Arch)',
  design2Cap: 'Design 2 (Classic)',
  uploadCustomDesignTitle: 'Upload Custom Template',
  preparingCertAndQr: 'Generating Certificate & QR Code...',
  customQrInputPlaceholder: 'Custom QR text or verification URL (leave blank for auto data)...',
  autoDataBtn: 'Auto Data',
  downloadQrPngBtn: 'Download QR Code (PNG)',
  generatingPdfBtn: 'Generating PDF...',
  downloadCertPdfBtn: '🎓 Download Certificate PDF',
  customCertSavedToast: '✅ Your custom certificate template has been saved!',
  certPdfDownloadedToast: '🎓 Certificate PDF with QR Code downloaded successfully!',
  certPdfErrorToast: '⚠️ Could not generate Certificate PDF. Please try again.',
  qrPngDownloadedToast: '📲 QR Code (PNG) downloaded successfully!',

  adminHeaderTitle: 'Learner Profile, Streak & Level Management System',
  adminGoogleSignInBtn: 'Admin Google Sign In',
  adminSignOutBtn: 'Sign Out',
  adminGoogleConnectedToast: '✅ Admin Google account connected!',
  adminGoogleErrorMsg: 'Could not complete Google Sign-In.',
  kpiTotalProfiles: 'Registered Profiles',
  kpiTotalProfilesSub: 'Active learner records',
  kpiAvgStreak: 'Average Daily Streak',
  kpiAvgStreakSub: 'Continuous learning average',
  kpiTotalStars: 'Total Stars Earned',
  kpiTotalStarsSub: 'Combined stars across all stages',
  kpiCompletedCert: 'Completed Course (Cert)',
  kpiCompletedCertSub: 'Learners at Level 4',
  searchProfilePlaceholder: 'Search learner profile by name or language...',
  newStudentPlaceholder: 'New learner name...',
  addNewProfileBtn: 'Add New Profile',
  profileAddedToast: (name) => `✅ Profile for ${name} added and selected!`,
  directoryHeader: (c) => `All Learners Directory (${c})`,
  directoryHint: 'Click any row to open profile controls',
  loadingProfilesText: 'Loading learner profiles...',
  noStudentFoundText: 'No matching learner profiles found.',
  levelShortLabel: (lvl) => `Level ${lvl}`,
  starsCountLabel: (c) => `${c} Stars`,
  selectedProfileInspectorTag: 'SELECTED PROFILE INSPECTOR',
  lastActiveLabel: 'Last Active:',
  pdfCertBtn: 'PDF Certificate',
  downloadStudentCertTitle: "Download this learner's PDF Certificate",
  streakControlTitle: 'Streak Control (Adjustment)',
  targetDaysShort: (d) => `Target: ${d}d`,
  decreaseBtn: 'Decrease (-1)',
  daysStreakLabel: 'Days Streak',
  increaseBtn: 'Increase (+1)',
  customStreakInputAdmin: 'Custom Streak (Days)',
  goalDaysInputAdmin: 'Target (Goal Days)',
  applyBtn: 'Apply',
  levelControlTitle: 'Level & Stage Control',
  levelDownBtn: 'Level Down',
  levelUpBtn: 'Level Up',
  stageSub1: 'Alphabet',
  stageSub2: 'Words',
  stageSub3: 'Conversation',
  stageSub4: 'Completed + Certificate',
  starsRewardsTitle: 'Stars & Rewards',
  selectStudentFromListHint: 'Select any learner from the directory on the left.',
  currentUserDefaultName: 'Current Learner (You)',

  kpiActiveLearners: 'Active Learners',
  kpiTotalStarsCard: 'Total Stars',
  kpiPoppedBalloons: 'Balloons Popped',
  kpiAvgStreakCard: 'Average Streak',
  loadingAnalyticsText: 'Loading live progress analytics from Firestore...',
  chart1Title: 'Daily Stars & Active Learners Over Time',
  chart1Subtitle: 'Total stars earned and active learners over the last 7 days',
  chart1SeriesStars: 'Total Stars',
  chart1SeriesUsers: 'Active Learners',
  chart2Title: 'Stage Completion Breakdown',
  chart2Subtitle: 'Comparison of completed items across Alphabet, Words, and Conversation',
  chart2SeriesAlphabet: 'Alphabet',
  chart2SeriesWords: 'Words',
  chart2SeriesConversation: 'Conversation',

  leaderboardBannerTitle: '🏆 Top 10 Learners Leaderboard',
  leaderboardByStarsBadge: '⭐ Ranked by Stars',
  leaderboardBannerDesc: 'Live ranking of the top 10 learners with the highest stars earned',
  yourStarsLabel: (s) => `Your Stars: ${s} ⭐`,
  loadingLeaderboardText: 'Loading Top 10 Leaderboard...',
  rank1Title: '1st Place (#1 Champion)',
  rank2Title: '2nd Place (#2 Runner-Up)',
  rank3Title: '3rd Place (#3 Star)',
  streakDaysCount: (d) => `🔥 ${d}d Streak`,
  top10ListHeading: (c) => `Top 10 Ranking List (${c}/10)`,
  youBadge: 'You',
  statStreak: (d) => `🔥 Streak: ${d}d`,
  statAlphabet: (d, t) => `🎈 Alphabet: ${d}/${t}`,
  statWords: (d, t) => `🍎 Words: ${d}/${t}`,
  statConversation: (d, t) => `💬 Conversation: ${d}/${t}`,
};

const UR_MODAL: HubModalTranslations = {
  tabStreakLevels: 'سٹریک اور لیولز',
  tabAchievements: (u, t) => `اعزازات (${u}/${t})`,
  tabLeaderboard: 'ٹاپ لرنرز',
  tabAnalytics: 'پراگریس گراف',
  tabCertificate: 'سرٹیفکیٹ',
  tabAdmin: 'ایڈمن کنسول (/mustafa)',

  dailyStreakBadge: 'روزانہ سٹریک سسٹم',
  goalDaysLabel: (d) => `ہدف: ${d} دن`,
  streakUnitLabel: 'دن سٹریک',
  streakCardHeading: 'مسلسل سیکھنے کا ریکارڈ 🔥',
  streakCardDesc:
    'جس دن آپ نہیں کھیل پائیں گے، یہ سٹریک خود بخود زیرو (0) ہو جائے گا۔ آپ اپنے لحاظ سے بھی سٹریک سیٹ کر سکتے ہیں!',
  customStreakTitle: 'اپنے لحاظ سے سٹریک سیٹ کریں:',
  currentStreakDaysLabel: 'موجودہ سٹریک (دن):',
  streakGoalInputLabel: 'سٹریک ٹارگٹ (ہدف دن):',
  presetTargetDays: (d) => `${d} دن ٹارگٹ`,
  saveStreakBtn: '✅ سٹریک محفوظ کریں',
  streakSavedToast: (s, g) => `🔥 آپ کا سٹریک (${s} دن) اور ہدف (${g} دن) اپڈیٹ ہو گیا!`,

  levelSystemBadge: 'لیول سسٹم (پہلے Easy پھر Medium اور Hard)',
  usernameInputLabel: '👤 آپ کا یوزر نیم (جو سرٹیفکیٹ اور ایڈمن پینل پر آئے گا):',
  usernameInputPlaceholder: 'اپنا نام لکھیں...',
  activeBadge: 'فعال',
  level1Title: '🌱 لیول 1: Easy (آسان شروعات)',
  level1Desc: 'نرم تلفظ چیکنگ، پوری رہنمائی، اور حروف و الفاظ کی آسان مشق۔',
  level1SelectedToast: '🌱 لیول Easy (آسان) منتخب ہو گیا: آرام سے سنیں اور بولیں!',
  level2Title: '⚡ لیول 2: Medium (درمیانہ)',
  level2Desc: 'درست تلفظ، الفاظ جوڑ کر جملہ بنانا، اور تیز سپیچ چیکنگ۔',
  level2SelectedToast: '⚡ لیول Medium (درمیانہ) منتخب ہو گیا: الفاظ اور جملوں کی مشق!',
  level3Title: '🔥 لیول 3: Hard (مشکل · ماہرانہ لیول)',
  level3Desc: 'مکمل روانی سے بولنا، سخت تلفظ میچنگ اور تمام الفاظ کی ترتیب۔',
  level3SelectedToast: '🔥 لیول Hard (مشکل / ماسٹر) منتخب ہو گیا: مکمل جملے اور سخت تلفظ!',

  achievementsStripTitle: (u, t) => `اعزازات اور بیجز (${u}/${t} ان لاک شدہ)`,
  achievementsStripDesc:
    '5 دن سٹریک، 100 غبارے پاپ، اور 50 الفاظ میں مہارت جیسے سنگِ میل مکمل کر کے خصوصی بیجز اور بونس ستارے حاصل کریں!',
  viewAchievementsBtn: 'تمام اعزازات دیکھیں',

  achievementsBannerTitle: 'اعزازات اور سنگِ میل بیجز',
  achievementsBannerDesc:
    'ہدف مکمل ہونے پر آپ کے بیجز خودکار طور پر ان لاک ہو جاتے ہیں۔ ہر ان لاک شدہ بیج پر کلک کر کے بونس ستارے حاصل کریں!',
  unlockedBadgesStat: 'ان لاک بیجز:',
  currentStreakStat: 'موجودہ سٹریک:',
  balloonsPoppedStat: 'پاپ کردہ غبارے:',
  wordsMasteredStat: 'سیکھے گئے الفاظ:',
  filterAll: (c) => `تمام (${c})`,
  filterUnlocked: (c) => `ان لاک شدہ (${c})`,
  filterInProgress: (c) => `جاری (${c})`,
  statusUnlocked: 'ان لاک شدہ',
  statusInProgress: 'جاری ہے',
  rewardClaimedBtn: (s) => `انعام حاصل شدہ (+${s} ⭐)`,
  claimRewardBtn: (s) => `+${s} بونس ستارے حاصل کریں`,
  alreadyClaimedToast: (title) => `🏅 "${title}" بیج کا انعام پہلے ہی حاصل کیا جا چکا ہے!`,
  claimedSuccessToast: (title, s) =>
    `🎉 مبارک ہو! "${title}" بیج ان لاک کرنے پر آپ کو +${s} بونس ستارے ملے!`,

  studentNameCertLabel: '👤 طالب علم کا نام (سرٹیفکیٹ کے لیے):',
  completionDateCertLabel: '📅 کورس مکمل ہونے کی تاریخ:',
  selectCertDesignLabel: '🖼️ سرٹیفکیٹ کا ڈیزائن منتخب کریں:',
  design1Arch: 'ڈیزائن 1 (آرچ)',
  design2Cap: 'ڈیزائن 2 (کیپ)',
  uploadCustomDesignTitle: 'اپنا ڈیزائن اپلوڈ کریں',
  preparingCertAndQr: 'سرٹیفکیٹ اور QR کوڈ تیار ہو رہا ہے...',
  customQrInputPlaceholder: 'کسٹم QR ٹیکسٹ یا ویریفیکیشن لنک...',
  autoDataBtn: 'آٹو ڈیٹا',
  downloadQrPngBtn: 'QR کوڈ ڈاؤن لوڈ کریں (PNG)',
  generatingPdfBtn: 'PDF تیار ہو رہا ہے...',
  downloadCertPdfBtn: '🎓 سرٹیفکیٹ PDF ڈاؤن لوڈ کریں',
  customCertSavedToast: '✅ آپ کا کسٹم سرٹیفکیٹ ڈیزائن محفوظ ہو گیا!',
  certPdfDownloadedToast: '🎓 سرٹیفکیٹ PDF بمعہ QR کوڈ کامیابی سے ڈاؤن لوڈ ہو گیا!',
  certPdfErrorToast: '⚠️ سرٹیفکیٹ بناتے وقت مسئلہ پیش آیا، دوبارہ کوشش کریں۔',
  qrPngDownloadedToast: '📲 QR کوڈ (PNG) کامیابی سے ڈاؤن لوڈ ہو گیا!',

  adminHeaderTitle: 'طالب علم پروفائل، سٹریک اور لیول مینجمنٹ سسٹم',
  adminGoogleSignInBtn: 'ایڈمن گوگل اکاؤنٹ سائن ان',
  adminSignOutBtn: 'سائن آؤٹ',
  adminGoogleConnectedToast: '✅ ایڈمن گوگل اکاؤنٹ منسلک ہو گیا!',
  adminGoogleErrorMsg: 'گوگل سائن ان میں مسئلہ آیا۔',
  kpiTotalProfiles: 'کل رجسٹرڈ پروفائلز',
  kpiTotalProfilesSub: 'فعال طلباء کا ریکارڈ',
  kpiAvgStreak: 'اوسط روزانہ سٹریک',
  kpiAvgStreakSub: 'مسلسل سیکھنے کا اوسط',
  kpiTotalStars: 'کل حاصل کردہ ستارے',
  kpiTotalStarsSub: 'تمام مراحل کے مجموعی ستارے',
  kpiCompletedCert: 'مکمل کورس (سرٹیفکیٹ)',
  kpiCompletedCertSub: 'لیول 4 مکمل کرنے والے طلباء',
  searchProfilePlaceholder: 'نام یا زبان سے طالب علم کی پروفائل تلاش کریں...',
  newStudentPlaceholder: 'نئے طالب علم کا نام لکھیں...',
  addNewProfileBtn: 'نئی پروفائل شامل کریں',
  profileAddedToast: (name) => `✅ ${name} کی پروفائل شامل کر دی گئی!`,
  directoryHeader: (c) => `تمام طلباء کی ڈائریکٹری (${c})`,
  directoryHint: 'کسی بھی قطار پر کلک کر کے پروفائل کنٹرول کھولیں',
  loadingProfilesText: 'طلباء کا ریکارڈ لوڈ ہو رہا ہے...',
  noStudentFoundText: 'کوئی طالب علم نہیں ملا۔',
  levelShortLabel: (lvl) => `لیول ${lvl}`,
  starsCountLabel: (c) => `${c} ستارے`,
  selectedProfileInspectorTag: 'منتخب پروفائل انسپکٹر',
  lastActiveLabel: 'آخری سرگرمی:',
  pdfCertBtn: 'PDF سرٹیفکیٹ',
  downloadStudentCertTitle: 'اس طالب علم کا سرٹیفکیٹ ڈاؤن لوڈ کریں',
  streakControlTitle: 'سٹریک کنٹرول',
  targetDaysShort: (d) => `ہدف: ${d} دن`,
  decreaseBtn: 'کم کریں (-1)',
  daysStreakLabel: 'دن سٹریک',
  increaseBtn: 'بڑھائیں (+1)',
  customStreakInputAdmin: 'کسٹم سٹریک (دن)',
  goalDaysInputAdmin: 'ٹارگٹ (ہدف دن)',
  applyBtn: 'لاگو کریں',
  levelControlTitle: 'لیول اور مرحلہ کنٹرول',
  levelDownBtn: 'لیول کم کریں',
  levelUpBtn: 'لیول بڑھائیں',
  stageSub1: 'حروفِ تہجی',
  stageSub2: 'الفاظ',
  stageSub3: 'بات چیت',
  stageSub4: 'مکمل + سرٹیفکیٹ',
  starsRewardsTitle: 'ستارے اور انعامات',
  selectStudentFromListHint: 'بائیں جانب فہرست میں سے کسی بھی طالب علم پر کلک کریں۔',
  currentUserDefaultName: 'آپ (موجودہ طالب علم)',

  kpiActiveLearners: 'فعال سیکھنے والے',
  kpiTotalStarsCard: 'کل ستارے',
  kpiPoppedBalloons: 'مکمل کردہ غبارے',
  kpiAvgStreakCard: 'اوسط سٹریک',
  loadingAnalyticsText: 'کلاؤڈ ڈیٹا بیس سے لائیو پراگریس ڈیٹا لوڈ ہو رہا ہے...',
  chart1Title: 'روزانہ ستارے اور فعال طلباء',
  chart1Subtitle: 'گزشتہ 7 دنوں میں حاصل کردہ کل ستارے اور فعال سیکھنے والے',
  chart1SeriesStars: 'کل ستارے',
  chart1SeriesUsers: 'فعال طلباء',
  chart2Title: 'مراحل کے لحاظ سے پراگریس',
  chart2Subtitle: 'حروفِ تہجی، الفاظ اور بات چیت میں مکمل کردہ مراحل کا موازنہ',
  chart2SeriesAlphabet: 'حروفِ تہجی',
  chart2SeriesWords: 'الفاظ',
  chart2SeriesConversation: 'بات چیت',

  leaderboardBannerTitle: '🏆 ٹاپ 10 سیکھنے والے طلباء',
  leaderboardByStarsBadge: '⭐ ستاروں کی بنیاد پر',
  leaderboardBannerDesc: 'سب سے زیادہ ستارے حاصل کرنے والے ٹاپ 10 طلباء کی فہرست',
  yourStarsLabel: (s) => `آپ کے ستارے: ${s} ⭐`,
  loadingLeaderboardText: 'لیڈر بورڈ لوڈ ہو رہا ہے...',
  rank1Title: 'پہلی پوزیشن (#1 چیمپئن)',
  rank2Title: 'دوسری پوزیشن (#2 رنر اپ)',
  rank3Title: 'تیسری پوزیشن (#3 سٹار)',
  streakDaysCount: (d) => `🔥 ${d} دن سٹریک`,
  top10ListHeading: (c) => `ٹاپ 10 رینکنگ فہرست (${c}/10)`,
  youBadge: 'آپ',
  statStreak: (d) => `🔥 سٹریک: ${d} دن`,
  statAlphabet: (d, t) => `🎈 حروف: ${d}/${t}`,
  statWords: (d, t) => `🍎 الفاظ: ${d}/${t}`,
  statConversation: (d, t) => `💬 بات چیت: ${d}/${t}`,
};

const FA_MODAL: HubModalTranslations = {
  tabStreakLevels: 'رکورد روزانه و سطح‌ها',
  tabAchievements: (u, t) => `افتخارات (${u}/${t})`,
  tabLeaderboard: 'جدول برترین‌ها',
  tabAnalytics: 'نمودار پیشرفت',
  tabCertificate: 'گواهینامه رسمی',
  tabAdmin: 'پنل مدیریت (/mustafa)',

  dailyStreakBadge: 'سیستم رکورد روزانه',
  goalDaysLabel: (d) => `هدف: ${d} روز`,
  streakUnitLabel: 'روز پیاپی',
  streakCardHeading: 'رکورد یادگیری مستمر 🔥',
  streakCardDesc:
    'هر روز تمرین کنید تا رکورد شما حفظ شود! در صورت وقفه، رکورد صفر می‌شود یا می‌توانید آن را در پایین تنظیم کنید.',
  customStreakTitle: 'تنظیم دلخواه رکورد روزانه:',
  currentStreakDaysLabel: 'رکورد فعلی (روز):',
  streakGoalInputLabel: 'هدف رکورد (تعداد روز):',
  presetTargetDays: (d) => `هدف ${d} روزه`,
  saveStreakBtn: '✅ ذخیره تنظیمات رکورد',
  streakSavedToast: (s, g) => `🔥 رکورد شما (${s} روز) و هدف (${g} روز) بروزرسانی شد!`,

  levelSystemBadge: 'سیستم سطح‌بندی (آسان ← متوسط ← پیشرفته)',
  usernameInputLabel: '👤 نام کاربری شما (جهت درج در گواهینامه و جدول برترین‌ها):',
  usernameInputPlaceholder: 'نام خود را بنویسید...',
  activeBadge: 'فعال',
  level1Title: '🌱 سطح ۱: آسان (مبتدی)',
  level1Desc: 'بررسی ملایم تلفظ، راهنمایی کامل و تمرین آسان حروف الفبا و واژگان.',
  level1SelectedToast: '🌱 سطح ۱ (آسان) انتخاب شد: با آرامش گوش دهید و تکرار کنید!',
  level2Title: '⚡ سطح ۲: متوسط (میانی)',
  level2Desc: 'تلفظ دقیق‌تر، ساختن جملات با چیدن واژگان و بررسی سریع‌تر گفتار.',
  level2SelectedToast: '⚡ سطح ۲ (متوسط) انتخاب شد: تمرین واژگان و جمله‌سازی!',
  level3Title: '🔥 سطح ۳: پیشرفته (استادی)',
  level3Desc: 'صحبت کردن روان، تطبیق دقیق تلفظ و تسلط کامل بر ترتیب جملات.',
  level3SelectedToast: '🔥 سطح ۳ (پیشرفته) انتخاب شد: تمرین مکالمه روان و حرفه‌ای!',

  achievementsStripTitle: (u, t) => `افتخارات و نشان‌ها (${u}/${t} باز شده)`,
  achievementsStripDesc:
    'با تکمیل اهدافی مانند «۵ روز تمرین پیاپی»، «ترکاندن ۱۰۰ بادکنک» و «تسلط بر ۵۰ واژه» نشان‌های ویژه و ستاره جایزه بگیرید!',
  viewAchievementsBtn: 'مشاهده همه افتخارات',

  achievementsBannerTitle: 'افتخارات و نشان‌های پیشرفت',
  achievementsBannerDesc:
    'نشان‌ها با رسیدن به هر هدف به‌صورت خودکار باز می‌شوند. برای دریافت ستاره‌های جایزه روی هر نشان باز شده کلیک کنید!',
  unlockedBadgesStat: 'نشان‌های باز شده:',
  currentStreakStat: 'رکورد فعلی:',
  balloonsPoppedStat: 'بادکنک‌های ترکانده:',
  wordsMasteredStat: 'واژگان آموخته‌شده:',
  filterAll: (c) => `همه (${c})`,
  filterUnlocked: (c) => `باز شده (${c})`,
  filterInProgress: (c) => `در حال انجام (${c})`,
  statusUnlocked: 'باز شده',
  statusInProgress: 'در حال انجام',
  rewardClaimedBtn: (s) => `جایزه دریافت شد (+${s} ⭐)`,
  claimRewardBtn: (s) => `دریافت +${s} ستاره جایزه`,
  alreadyClaimedToast: (title) => `🏅 جایزه نشان «${title}» قبلاً دریافت شده است!`,
  claimedSuccessToast: (title, s) =>
    `🎉 تبریک! برای باز کردن نشان «${title}» تعداد +${s} ستاره جایزه دریافت کردید!`,

  studentNameCertLabel: '👤 نام زبان‌آموز (برای گواهینامه):',
  completionDateCertLabel: '📅 تاریخ تکمیل دوره:',
  selectCertDesignLabel: '🖼️ انتخاب طرح گواهینامه:',
  design1Arch: 'طرح ۱ (کلاسیک)',
  design2Cap: 'طرح ۲ (مدرن)',
  uploadCustomDesignTitle: 'بارگذاری طرح دلخواه',
  preparingCertAndQr: 'در حال آماده‌سازی گواهینامه و کد QR...',
  customQrInputPlaceholder: 'متن یا لینک دلخواه کد QR...',
  autoDataBtn: 'داده خودکار',
  downloadQrPngBtn: 'دانلود کد QR (PNG)',
  generatingPdfBtn: 'در حال ساخت PDF...',
  downloadCertPdfBtn: '🎓 دانلود گواهینامه PDF',
  customCertSavedToast: '✅ طرح گواهینامه دلخواه شما ذخیره شد!',
  certPdfDownloadedToast: '🎓 فایل PDF گواهینامه همراه با کد QR با موفقیت دانلود شد!',
  certPdfErrorToast: '⚠️ خطایی در ساخت گواهینامه رخ داد، دوباره تلاش کنید.',
  qrPngDownloadedToast: '📲 تصویر کد QR با موفقیت دانلود شد!',

  adminHeaderTitle: 'سیستم مدیریت پروفایل زبان‌آموزان، رکورد و سطح‌بندی',
  adminGoogleSignInBtn: 'ورود مدیر با Google',
  adminSignOutBtn: 'خروج از حساب',
  adminGoogleConnectedToast: '✅ حساب Google مدیر متصل شد!',
  adminGoogleErrorMsg: 'خطا در ورود با حساب Google.',
  kpiTotalProfiles: 'کل پروفایل‌های ثبت‌شده',
  kpiTotalProfilesSub: 'زبان‌آموزان فعال',
  kpiAvgStreak: 'میانگین رکورد روزانه',
  kpiAvgStreakSub: 'میانگین تمرین مستمر',
  kpiTotalStars: 'کل ستاره‌های کسب‌شده',
  kpiTotalStarsSub: 'مجموع ستاره‌ها در تمام مراحل',
  kpiCompletedCert: 'تکمیل دوره (گواهینامه)',
  kpiCompletedCertSub: 'زبان‌آموزان سطح ۴',
  searchProfilePlaceholder: 'جستجوی پروفایل زبان‌آموز با نام یا زبان...',
  newStudentPlaceholder: 'نام زبان‌آموز جدید...',
  addNewProfileBtn: 'افزودن پروفایل جدید',
  profileAddedToast: (name) => `✅ پروفایل ${name} اضافه و انتخاب شد!`,
  directoryHeader: (c) => `فهرست تمام زبان‌آموزان (${c})`,
  directoryHint: 'برای مدیریت پروفایل روی هر ردیف کلیک کنید',
  loadingProfilesText: 'در حال بارگذاری اطلاعات زبان‌آموزان...',
  noStudentFoundText: 'زبان‌آموزی یافت نشد.',
  levelShortLabel: (lvl) => `سطح ${lvl}`,
  starsCountLabel: (c) => `${c} ستاره`,
  selectedProfileInspectorTag: 'بازرس پروفایل انتخاب‌شده',
  lastActiveLabel: 'آخرین فعالیت:',
  pdfCertBtn: 'گواهینامه PDF',
  downloadStudentCertTitle: 'دانلود گواهینامه این زبان‌آموز',
  streakControlTitle: 'مدیریت رکورد روزانه',
  targetDaysShort: (d) => `هدف: ${d} روز`,
  decreaseBtn: 'کاهش (-1)',
  daysStreakLabel: 'روز رکورد',
  increaseBtn: 'افزایش (+1)',
  customStreakInputAdmin: 'رکورد دلخواه (روز)',
  goalDaysInputAdmin: 'هدف (تعداد روز)',
  applyBtn: 'اعمال',
  levelControlTitle: 'مدیریت سطح و مرحله',
  levelDownBtn: 'کاهش سطح',
  levelUpBtn: 'افزایش سطح',
  stageSub1: 'حروف الفبا',
  stageSub2: 'واژگان',
  stageSub3: 'مکالمه',
  stageSub4: 'تکمیل دوره + گواهینامه',
  starsRewardsTitle: 'ستاره‌ها و جوایز',
  selectStudentFromListHint: 'یک زبان‌آموز را از فهرست سمت راست انتخاب کنید.',
  currentUserDefaultName: 'شما (کاربر فعلی)',

  kpiActiveLearners: 'زبان‌آموزان فعال',
  kpiTotalStarsCard: 'مجموع ستاره‌ها',
  kpiPoppedBalloons: 'بادکنک‌های ترکانده',
  kpiAvgStreakCard: 'میانگین رکورد',
  loadingAnalyticsText: 'در حال دریافت آمار زنده از پایگاه داده ابری...',
  chart1Title: 'ستاره‌های روزانه و زبان‌آموزان فعال',
  chart1Subtitle: 'مجموع ستاره‌ها و کاربران فعال در ۷ روز گذشته',
  chart1SeriesStars: 'مجموع ستاره‌ها',
  chart1SeriesUsers: 'زبان‌آموزان فعال',
  chart2Title: 'نمودار پیشرفت به تفکیک مرحله',
  chart2Subtitle: 'مقایسه مراحل تکمیل‌شده در الفبا، واژگان و مکالمه',
  chart2SeriesAlphabet: 'الفبا',
  chart2SeriesWords: 'واژگان',
  chart2SeriesConversation: 'مکالمه',

  leaderboardBannerTitle: '🏆 جدول ۱۰ زبان‌آموز برتر',
  leaderboardByStarsBadge: '⭐ بر اساس ستاره‌ها',
  leaderboardBannerDesc: 'فهرست برترین زبان‌آموزان بر اساس بیشترین ستاره‌های کسب‌شده',
  yourStarsLabel: (s) => `ستاره‌های شما: ${s} ⭐`,
  loadingLeaderboardText: 'در حال بارگذاری جدول برترین‌ها...',
  rank1Title: 'مقام اول (#1 قهرمان)',
  rank2Title: 'مقام دوم (#2 برگزیده)',
  rank3Title: 'مقام سوم (#3 ستاره)',
  streakDaysCount: (d) => `🔥 ${d} روز رکورد`,
  top10ListHeading: (c) => `فهرست رتبه‌بندی ۱۰ نفر برتر (${c}/10)`,
  youBadge: 'شما',
  statStreak: (d) => `🔥 رکورد: ${d} روز`,
  statAlphabet: (d, t) => `🎈 الفبا: ${d}/${t}`,
  statWords: (d, t) => `🍎 واژگان: ${d}/${t}`,
  statConversation: (d, t) => `💬 مکالمه: ${d}/${t}`,
};

const FR_MODAL: HubModalTranslations = {
  tabStreakLevels: 'Série & Niveaux',
  tabAchievements: (u, t) => `Succès (${u}/${t})`,
  tabLeaderboard: 'Classement',
  tabAnalytics: 'Statistiques',
  tabCertificate: 'Certificat',
  tabAdmin: 'Console Admin (/mustafa)',

  dailyStreakBadge: 'Système de Série Quotidienne',
  goalDaysLabel: (d) => `Objectif : ${d} Jours`,
  streakUnitLabel: 'Jours de Série',
  streakCardHeading: 'Série d’Apprentissage Continue 🔥',
  streakCardDesc:
    'Pratiquez chaque jour pour maintenir votre série ! Personnalisez votre série et votre objectif ci-dessous.',
  customStreakTitle: 'Paramètres de Série Personnalisés :',
  currentStreakDaysLabel: 'Série Actuelle (Jours) :',
  streakGoalInputLabel: 'Objectif de Série (Jours) :',
  presetTargetDays: (d) => `Objectif ${d} Jours`,
  saveStreakBtn: '✅ Enregistrer la Série',
  streakSavedToast: (s, g) =>
    `🔥 Votre série (${s} jours) et votre objectif (${g} jours) ont été mis à jour !`,

  levelSystemBadge: 'Niveaux de Difficulté (Facile → Moyen → Difficile)',
  usernameInputLabel: '👤 Votre Nom (affiché sur le Certificat & le Classement) :',
  usernameInputPlaceholder: 'Entrez votre nom...',
  activeBadge: 'Actif',
  level1Title: '🌱 Niveau 1 : Facile (Débutant)',
  level1Desc: 'Vérification vocale souple, guidage complet et pratique facile de l’alphabet et des mots.',
  level1SelectedToast: '🌱 Niveau 1 (Facile) sélectionné : Écoutez et répétez à votre rythme !',
  level2Title: '⚡ Niveau 2 : Moyen (Intermédiaire)',
  level2Desc: 'Prononciation précise, construction de phrases à partir de mots et vérification rapide.',
  level2SelectedToast: '⚡ Niveau 2 (Moyen) sélectionné : Pratiquez les mots et les phrases !',
  level3Title: '🔥 Niveau 3 : Difficile (Maîtrise)',
  level3Desc: 'Expression fluide, vérification stricte de la prononciation et maîtrise complète des phrases.',
  level3SelectedToast: '🔥 Niveau 3 (Difficile) sélectionné : Mode fluidité et maîtrise !',

  achievementsStripTitle: (u, t) => `Succès & Badges (${u}/${t} Débloqués)`,
  achievementsStripDesc:
    'Complétez les défis « Série de 5 Jours », « 100 Ballons Éclatés » et « 50 Mots Maîtrisés » pour gagner des étoiles bonus !',
  viewAchievementsBtn: 'Voir tous les Succès',

  achievementsBannerTitle: 'Succès & Badges d’Étapes',
  achievementsBannerDesc:
    'Les badges se débloquent automatiquement. Cliquez sur chaque badge débloqué pour réclamer vos étoiles bonus !',
  unlockedBadgesStat: 'Badges Débloqués :',
  currentStreakStat: 'Série Actuelle :',
  balloonsPoppedStat: 'Ballons Éclatés :',
  wordsMasteredStat: 'Mots Maîtrisés :',
  filterAll: (c) => `Tous (${c})`,
  filterUnlocked: (c) => `Débloqués (${c})`,
  filterInProgress: (c) => `En Cours (${c})`,
  statusUnlocked: 'Débloqué',
  statusInProgress: 'En Cours',
  rewardClaimedBtn: (s) => `Récompense Réclamée (+${s} ⭐)`,
  claimRewardBtn: (s) => `Réclamer +${s} Étoiles Bonus`,
  alreadyClaimedToast: (title) => `🏅 La récompense pour « ${title} » a déjà été réclamée !`,
  claimedSuccessToast: (title, s) =>
    `🎉 Félicitations ! Vous avez gagné +${s} étoiles bonus pour « ${title} » !`,

  studentNameCertLabel: '👤 Nom de l’Étudiant (pour le Certificat) :',
  completionDateCertLabel: '📅 Date d’Achèvement du Cours :',
  selectCertDesignLabel: '🖼️ Choisir le Modèle du Certificat :',
  design1Arch: 'Modèle 1 (Arche)',
  design2Cap: 'Modèle 2 (Classique)',
  uploadCustomDesignTitle: 'Importer un modèle personnalisé',
  preparingCertAndQr: 'Génération du certificat et du QR Code...',
  customQrInputPlaceholder: 'Texte ou lien QR personnalisé...',
  autoDataBtn: 'Données Auto',
  downloadQrPngBtn: 'Télécharger QR Code (PNG)',
  generatingPdfBtn: 'Création du PDF...',
  downloadCertPdfBtn: '🎓 Télécharger le Certificat PDF',
  customCertSavedToast: '✅ Votre modèle de certificat personnalisé a été enregistré !',
  certPdfDownloadedToast: '🎓 Certificat PDF avec QR Code téléchargé avec succès !',
  certPdfErrorToast: '⚠️ Erreur lors de la création du PDF. Veuillez réessayer.',
  qrPngDownloadedToast: '📲 QR Code (PNG) téléchargé avec succès !',

  adminHeaderTitle: 'Système de Gestion des Profils, Séries et Niveaux',
  adminGoogleSignInBtn: 'Connexion Admin Google',
  adminSignOutBtn: 'Déconnexion',
  adminGoogleConnectedToast: '✅ Compte Google Admin connecté !',
  adminGoogleErrorMsg: 'Erreur de connexion Google.',
  kpiTotalProfiles: 'Profils Enregistrés',
  kpiTotalProfilesSub: 'Apprenants actifs',
  kpiAvgStreak: 'Série Quotidienne Moyenne',
  kpiAvgStreakSub: 'Moyenne d’apprentissage continu',
  kpiTotalStars: 'Total d’Étoiles Gagnées',
  kpiTotalStarsSub: 'Étoiles cumulées sur toutes les étapes',
  kpiCompletedCert: 'Cours Terminé (Certificat)',
  kpiCompletedCertSub: 'Apprenants au Niveau 4',
  searchProfilePlaceholder: 'Rechercher un profil par nom ou langue...',
  newStudentPlaceholder: 'Nom du nouvel apprenant...',
  addNewProfileBtn: 'Ajouter un Profil',
  profileAddedToast: (name) => `✅ Profil de ${name} ajouté et sélectionné !`,
  directoryHeader: (c) => `Répertoire des Apprenants (${c})`,
  directoryHint: 'Cliquez sur une ligne pour ouvrir les contrôles',
  loadingProfilesText: 'Chargement des profils...',
  noStudentFoundText: 'Aucun apprenant trouvé.',
  levelShortLabel: (lvl) => `Niveau ${lvl}`,
  starsCountLabel: (c) => `${c} Étoiles`,
  selectedProfileInspectorTag: 'INSPECTEUR DE PROFIL SÉLECTIONNÉ',
  lastActiveLabel: 'Dernière activité :',
  pdfCertBtn: 'Certificat PDF',
  downloadStudentCertTitle: 'Télécharger le certificat de cet apprenant',
  streakControlTitle: 'Contrôle de la Série',
  targetDaysShort: (d) => `Objectif : ${d}j`,
  decreaseBtn: 'Diminuer (-1)',
  daysStreakLabel: 'Jours de Série',
  increaseBtn: 'Augmenter (+1)',
  customStreakInputAdmin: 'Série Personnalisée (Jours)',
  goalDaysInputAdmin: 'Objectif (Jours)',
  applyBtn: 'Appliquer',
  levelControlTitle: 'Contrôle du Niveau & de l’Étape',
  levelDownBtn: 'Niveau -1',
  levelUpBtn: 'Niveau +1',
  stageSub1: 'Alphabet',
  stageSub2: 'Mots',
  stageSub3: 'Conversation',
  stageSub4: 'Terminé + Certificat',
  starsRewardsTitle: 'Étoiles & Récompenses',
  selectStudentFromListHint: 'Sélectionnez un apprenant dans la liste à gauche.',
  currentUserDefaultName: 'Apprenant Actuel (Vous)',

  kpiActiveLearners: 'Apprenants Actifs',
  kpiTotalStarsCard: 'Total d’Étoiles',
  kpiPoppedBalloons: 'Ballons Éclatés',
  kpiAvgStreakCard: 'Série Moyenne',
  loadingAnalyticsText: 'Chargement des statistiques en direct...',
  chart1Title: 'Étoiles Quotidiennes & Apprenants Actifs',
  chart1Subtitle: 'Total des étoiles gagnées et utilisateurs actifs sur les 7 derniers jours',
  chart1SeriesStars: 'Total d’Étoiles',
  chart1SeriesUsers: 'Apprenants Actifs',
  chart2Title: 'Progression par Étape',
  chart2Subtitle: 'Comparaison des étapes complétées : Alphabet, Mots et Conversation',
  chart2SeriesAlphabet: 'Alphabet',
  chart2SeriesWords: 'Mots',
  chart2SeriesConversation: 'Conversation',

  leaderboardBannerTitle: '🏆 Classement des 10 Meilleurs Apprenants',
  leaderboardByStarsBadge: '⭐ Classé par Étoiles',
  leaderboardBannerDesc: 'Classement en direct des 10 apprenants ayant gagné le plus d’étoiles',
  yourStarsLabel: (s) => `Vos Étoiles : ${s} ⭐`,
  loadingLeaderboardText: 'Chargement du classement Top 10...',
  rank1Title: '1re Place (#1 Champion)',
  rank2Title: '2e Place (#2 Finaliste)',
  rank3Title: '3e Place (#3 Étoile)',
  streakDaysCount: (d) => `🔥 Série ${d}j`,
  top10ListHeading: (c) => `Liste du Top 10 (${c}/10)`,
  youBadge: 'Vous',
  statStreak: (d) => `🔥 Série : ${d}j`,
  statAlphabet: (d, t) => `🎈 Alphabet : ${d}/${t}`,
  statWords: (d, t) => `🍎 Mots : ${d}/${t}`,
  statConversation: (d, t) => `💬 Conversation : ${d}/${t}`,
};

const HI_MODAL: HubModalTranslations = {
  ...EN_MODAL,
  tabStreakLevels: 'स्ट्रीक और लेवल',
  tabAchievements: (u, t) => `उपलब्धियाँ (${u}/${t})`,
  tabLeaderboard: 'लीडरबोर्ड',
  tabAnalytics: 'प्रगति ग्राफ़',
  tabCertificate: 'प्रमाणपत्र',
  tabAdmin: 'एडमिन पैनल (/mustafa)',

  dailyStreakBadge: 'दैनिक स्ट्रीक सिस्टम',
  goalDaysLabel: (d) => `लक्ष्य: ${d} दिन`,
  streakUnitLabel: 'दिन स्ट्रीक',
  streakCardHeading: 'लगातार सीखने का रिकॉर्ड 🔥',
  streakCardDesc:
    'हर दिन अभ्यास करने से आपकी स्ट्रीक बढ़ती है! आप नीचे अपनी स्ट्रीक और लक्ष्य को अपने अनुसार सेट भी कर सकते हैं।',
  customStreakTitle: 'कस्टम स्ट्रीक सेट करें:',
  currentStreakDaysLabel: 'वर्तमान स्ट्रीक (दिन):',
  streakGoalInputLabel: 'स्ट्रीक लक्ष्य (दिन):',
  presetTargetDays: (d) => `${d} दिन लक्ष्य`,
  saveStreakBtn: '✅ स्ट्रीक सेव करें',
  streakSavedToast: (s, g) => `🔥 आपकी स्ट्रीक (${s} दिन) और लक्ष्य (${g} दिन) अपडेट हो गए!`,

  levelSystemBadge: 'लेवल सिस्टम (Easy → Medium → Hard)',
  usernameInputLabel: '👤 आपका नाम (जो सर्टिफिकेट और लीडरबोर्ड पर आएगा):',
  usernameInputPlaceholder: 'अपना नाम लिखें...',
  activeBadge: 'सक्रिय',
  level1Title: '🌱 लेवल 1: Easy (आसान शुरुआत)',
  level1Desc: 'आसान उच्चारण जाँच, पूरा मार्गदर्शन और अक्षरों व शब्दों का सरल अभ्यास।',
  level1SelectedToast: '🌱 लेवल 1 (Easy) चुना गया: आराम से सुनें और बोलें!',
  level2Title: '⚡ लेवल 2: Medium (मध्यम)',
  level2Desc: 'सटीक उच्चारण, शब्दों को जोड़कर वाक्य बनाना और तेज़ स्पीच जाँच।',
  level2SelectedToast: '⚡ लेवल 2 (Medium) चुना गया: शब्दों और वाक्यों का अभ्यास!',
  level3Title: '🔥 लेवल 3: Hard (मास्टर लेवल)',
  level3Desc: 'पूरी प्रवाह के साथ बोलना, सख़्त उच्चारण मिलान और पूरे वाक्यों का अभ्यास।',
  level3SelectedToast: '🔥 लेवल 3 (Hard) चुना गया: पूरे वाक्य और मास्टर अभ्यास!',

  achievementsStripTitle: (u, t) => `उपलब्धियाँ और बैज (${u}/${t} अनलॉक)`,
  achievementsStripDesc:
    "'5 Days Streak', '100 Balloons Popped' और 'Mastered 50 Words' जैसे लक्ष्य पूरे करके विशेष बैज और बोनस सितारे पाएं!",
  viewAchievementsBtn: 'सभी उपलब्धियाँ देखें',

  achievementsBannerTitle: 'उपलब्धियाँ और माइलस्टोन बैज',
  achievementsBannerDesc:
    'लक्ष्य पूरा होने पर बैज अपने आप अनलॉक हो जाते हैं। बोनस सितारे पाने के लिए किसी भी अनलॉक बैज पर क्लिक करें!',
  unlockedBadgesStat: 'अनलॉक बैज:',
  currentStreakStat: 'वर्तमान स्ट्रीक:',
  balloonsPoppedStat: 'फोड़े गए गुब्बारे:',
  wordsMasteredStat: 'सीखे गए शब्द:',
  filterAll: (c) => `सभी (${c})`,
  filterUnlocked: (c) => `अनलॉक (${c})`,
  filterInProgress: (c) => `जारी (${c})`,
  statusUnlocked: 'अनलॉक',
  statusInProgress: 'जारी है',
  rewardClaimedBtn: (s) => `इनाम प्राप्त (+${s} ⭐)`,
  claimRewardBtn: (s) => `+${s} बोनस सितारे प्राप्त करें`,
  alreadyClaimedToast: (title) => `🏅 "${title}" बैज का इनाम पहले ही लिया जा चुका है!`,
  claimedSuccessToast: (title, s) =>
    `🎉 बधाई हो! "${title}" अनलॉक करने पर आपको +${s} बोनस सितारे मिले!`,

  studentNameCertLabel: '👤 विद्यार्थी का नाम (सर्टिफिकेट के लिए):',
  completionDateCertLabel: '📅 कोर्स पूरा होने की तारीख:',
  selectCertDesignLabel: '🖼️ सर्टिफिकेट का डिज़ाइन चुनें:',
  design1Arch: 'डिज़ाइन 1 (आर्च)',
  design2Cap: 'डिज़ाइन 2 (क्लासिक)',
  uploadCustomDesignTitle: 'कस्टम डिज़ाइन अपलोड करें',
  preparingCertAndQr: 'सर्टिफिकेट और QR कोड तैयार हो रहा है...',
  customQrInputPlaceholder: 'कस्टम QR टेक्स्ट या लिंक...',
  autoDataBtn: 'ऑटो डेटा',
  downloadQrPngBtn: 'QR कोड डाउनलोड करें (PNG)',
  generatingPdfBtn: 'PDF तैयार हो रहा है...',
  downloadCertPdfBtn: '🎓 सर्टिफिकेट PDF डाउनलोड करें',

  adminHeaderTitle: 'विद्यार्थी प्रोफ़ाइल, स्ट्रीक और लेवल प्रबंधन प्रणाली',
  adminGoogleSignInBtn: 'एडमिन Google साइन इन',
  adminSignOutBtn: 'साइन आउट',
  kpiTotalProfiles: 'कुल पंजीकृत प्रोफ़ाइल',
  kpiTotalProfilesSub: 'सक्रिय विद्यार्थियों का रिकॉर्ड',
  kpiAvgStreak: 'औसत दैनिक स्ट्रीक',
  kpiAvgStreakSub: 'लगातार सीखने का औसत',
  kpiTotalStars: 'कुल अर्जित सितारे',
  kpiTotalStarsSub: 'सभी चरणों के कुल सितारे',
  kpiCompletedCert: 'पूर्ण कोर्स (सर्टिफिकेट)',
  kpiCompletedCertSub: 'लेवल 4 पूरा करने वाले विद्यार्थी',
  searchProfilePlaceholder: 'नाम या भाषा से प्रोफ़ाइल खोजें...',
  newStudentPlaceholder: 'नए विद्यार्थी का नाम...',
  addNewProfileBtn: 'नई प्रोफ़ाइल जोड़ें',
  directoryHeader: (c) => `सभी विद्यार्थियों की सूची (${c})`,
  directoryHint: 'प्रोफ़ाइल कंट्रोल खोलने के लिए किसी भी पंक्ति पर क्लिक करें',
  levelShortLabel: (lvl) => `लेवल ${lvl}`,
  starsCountLabel: (c) => `${c} सितारे`,
  lastActiveLabel: 'अंतिम गतिविधि:',
  pdfCertBtn: 'PDF सर्टिफिकेट',
  streakControlTitle: 'स्ट्रीक कंट्रोल',
  decreaseBtn: 'कम करें (-1)',
  daysStreakLabel: 'दिन स्ट्रीक',
  increaseBtn: 'बढ़ाएं (+1)',
  customStreakInputAdmin: 'कस्टम स्ट्रीक (दिन)',
  goalDaysInputAdmin: 'लक्ष्य (दिन)',
  applyBtn: 'लागू करें',
  levelControlTitle: 'लेवल और चरण कंट्रोल',
  levelDownBtn: 'लेवल कम करें',
  levelUpBtn: 'लेवल बढ़ाएं',
  stageSub1: 'वर्णमाला',
  stageSub2: 'शब्द',
  stageSub3: 'बातचीत',
  stageSub4: 'पूर्ण + सर्टिफिकेट',
  starsRewardsTitle: 'सितारे और पुरस्कार',
  currentUserDefaultName: 'आप (वर्तमान उपयोगकर्ता)',

  kpiActiveLearners: 'सक्रिय विद्यार्थी',
  kpiTotalStarsCard: 'कुल सितारे',
  kpiPoppedBalloons: 'फोड़े गए गुब्बारे',
  kpiAvgStreakCard: 'औसत स्ट्रीक',
  chart1Title: 'दैनिक सितारे और सक्रिय विद्यार्थी',
  chart1Subtitle: 'पिछले 7 दिनों में अर्जित सितारे और सक्रिय उपयोगकर्ता',
  chart1SeriesStars: 'कुल सितारे',
  chart1SeriesUsers: 'सक्रिय विद्यार्थी',
  chart2Title: 'चरण के अनुसार प्रगति',
  chart2Subtitle: 'वर्णमाला, शब्द और बातचीत में पूरे किए गए चरणों की तुलना',
  chart2SeriesAlphabet: 'वर्णमाला',
  chart2SeriesWords: 'शब्द',
  chart2SeriesConversation: 'बातचीत',

  leaderboardBannerTitle: '🏆 टॉप 10 लीडरबोर्ड',
  leaderboardByStarsBadge: '⭐ सितारों के आधार पर',
  leaderboardBannerDesc: 'सबसे अधिक सितारे अर्जित करने वाले शीर्ष 10 विद्यार्थियों की सूची',
  yourStarsLabel: (s) => `आपके सितारे: ${s} ⭐`,
  rank1Title: 'प्रथम स्थान (#1 चैंपियन)',
  rank2Title: 'द्वितीय स्थान (#2 रनर-अप)',
  rank3Title: 'तृतीय स्थान (#3 स्टार)',
  streakDaysCount: (d) => `🔥 ${d} दिन स्ट्रीक`,
  top10ListHeading: (c) => `टॉप 10 रैंकिंग सूची (${c}/10)`,
  youBadge: 'आप',
  statStreak: (d) => `🔥 स्ट्रीक: ${d} दिन`,
  statAlphabet: (d, t) => `🎈 अक्षर: ${d}/${t}`,
  statWords: (d, t) => `🍎 शब्द: ${d}/${t}`,
  statConversation: (d, t) => `💬 बातचीत: ${d}/${t}`,
};

const AR_MODAL: HubModalTranslations = {
  ...EN_MODAL,
  tabStreakLevels: 'السلسلة والمستويات',
  tabAchievements: (u, t) => `الإنجازات (${u}/${t})`,
  tabLeaderboard: 'لوحة المتصدرين',
  tabAnalytics: 'إحصائيات التقدم',
  tabCertificate: 'الشهادة',
  tabAdmin: 'لوحة الإدارة (/mustafa)',

  dailyStreakBadge: 'نظام السلسلة اليومية',
  goalDaysLabel: (d) => `الهدف: ${d} أيام`,
  streakUnitLabel: 'أيام متتالية',
  streakCardHeading: 'سجل التعلم المستمر 🔥',
  streakCardDesc:
    'تدرب كل يوم للحفاظ على سلسلتك اليومية! يمكنك أيضاً تخصيص السلسلة والهدف أدناه.',
  customStreakTitle: 'تخصيص السلسلة اليومية:',
  currentStreakDaysLabel: 'السلسلة الحالية (أيام):',
  streakGoalInputLabel: 'هدف السلسلة (أيام):',
  presetTargetDays: (d) => `هدف ${d} يوم`,
  saveStreakBtn: '✅ حفظ إعدادات السلسلة',
  streakSavedToast: (s, g) => `🔥 تم تحديث سلسلتك (${s} يوم) وهدفك (${g} يوم)!`,

  levelSystemBadge: 'نظام المستويات (سهل ← متوسط ← متقدم)',
  usernameInputLabel: '👤 اسم المستخدم (يظهر في الشهادة ولوحة المتصدرين):',
  usernameInputPlaceholder: 'اكتب اسمك...',
  activeBadge: 'نشط',
  level1Title: '🌱 المستوى 1: سهل (مبتدئ)',
  level1Desc: 'فحص نطق مرن، إرشاد كامل وتدريب ميسر على الحروف والكلمات.',
  level2Title: '⚡ المستوى 2: متوسط',
  level2Desc: 'نطق دقيق، تكوين جمل من الكلمات وفحص صوتي أسرع.',
  level3Title: '🔥 المستوى 3: متقدم (إتقان)',
  level3Desc: 'تحدث بطلاقة، مطابقة دقيقة للنطق وإتقان ترتيب الجمل بالكامل.',

  achievementsStripTitle: (u, t) => `الإنجازات والشارات (${u}/${t} مفتوحة)`,
  achievementsStripDesc:
    'أكمل أهدافاً مثل «سلسلة 5 أيام» و«فرقعة 100 بالون» و«إتقان 50 كلمة» للحصول على شارات ونجوم إضافية!',
  viewAchievementsBtn: 'عرض جميع الإنجازات',

  achievementsBannerTitle: 'الإنجازات وشارات المراحل',
  achievementsBannerDesc:
    'تُفتح الشارات تلقائياً عند إكمال الهدف. اضغط على أي شارة مفتوحة للحصول على نجوم مكافأة!',
  unlockedBadgesStat: 'الشارات المفتوحة:',
  currentStreakStat: 'السلسلة الحالية:',
  balloonsPoppedStat: 'البالونات المفرقعة:',
  wordsMasteredStat: 'الكلمات المتقنة:',
  filterAll: (c) => `الكل (${c})`,
  filterUnlocked: (c) => `المفتوحة (${c})`,
  filterInProgress: (c) => `قيد التقدم (${c})`,
  statusUnlocked: 'مفتوحة',
  statusInProgress: 'قيد التقدم',
  rewardClaimedBtn: (s) => `تم استلام المكافأة (+${s} ⭐)`,
  claimRewardBtn: (s) => `استلم +${s} نجوم مكافأة`,

  studentNameCertLabel: '👤 اسم الطالب (للشهادة):',
  completionDateCertLabel: '📅 تاريخ إتمام الدورة:',
  selectCertDesignLabel: '🖼️ اختر تصميم الشهادة:',
  design1Arch: 'تصميم 1 (قوس)',
  design2Cap: 'تصميم 2 (كلاسيكي)',
  downloadCertPdfBtn: '🎓 تحميل الشهادة PDF',

  adminHeaderTitle: 'نظام إدارة ملفات الطلاب والسلسلة والمستويات',
  adminGoogleSignInBtn: 'دخول المسؤول عبر Google',
  adminSignOutBtn: 'تسجيل الخروج',
  kpiTotalProfiles: 'إجمالي الملفات المسجلة',
  kpiTotalProfilesSub: 'سجل الطلاب النشطين',
  kpiAvgStreak: 'متوسط السلسلة اليومية',
  kpiAvgStreakSub: 'متوسط التعلم المستمر',
  kpiTotalStars: 'إجمالي النجوم المكتسبة',
  kpiTotalStarsSub: 'مجموع النجوم في كل المراحل',
  kpiCompletedCert: 'إتمام الدورة (الشهادة)',
  kpiCompletedCertSub: 'طلاب المستوى 4',
  searchProfilePlaceholder: 'ابحث عن ملف طالب بالاسم أو اللغة...',
  newStudentPlaceholder: 'اسم الطالب الجديد...',
  addNewProfileBtn: 'إضافة ملف جديد',
  directoryHeader: (c) => `دليل جميع الطلاب (${c})`,
  directoryHint: 'اضغط على أي صف لفتح لوحة التحكم بالملف',
  levelShortLabel: (lvl) => `مستوى ${lvl}`,
  starsCountLabel: (c) => `${c} نجمة`,
  lastActiveLabel: 'آخر نشاط:',
  pdfCertBtn: 'شهادة PDF',
  streakControlTitle: 'التحكم بالسلسلة',
  decreaseBtn: 'إنقاص (-1)',
  daysStreakLabel: 'أيام السلسلة',
  increaseBtn: 'زيادة (+1)',
  customStreakInputAdmin: 'سلسلة مخصصة (أيام)',
  goalDaysInputAdmin: 'الهدف (أيام)',
  applyBtn: 'تطبيق',
  levelControlTitle: 'التحكم بالمستوى والمرحلة',
  levelDownBtn: 'خفض المستوى',
  levelUpBtn: 'رفع المستوى',
  stageSub1: 'الحروف الأبجدية',
  stageSub2: 'الكلمات',
  stageSub3: 'المحادثة',
  stageSub4: 'مكتمل + شهادة',
  starsRewardsTitle: 'النجوم والمكافآت',
  currentUserDefaultName: 'أنت (المتعلم الحالي)',

  kpiActiveLearners: 'المتعلمون النشطون',
  kpiTotalStarsCard: 'إجمالي النجوم',
  kpiPoppedBalloons: 'البالونات المفرقعة',
  kpiAvgStreakCard: 'متوسط السلسلة',
  chart1Title: 'النجوم اليومية والمتعلمون النشطون',
  chart1Subtitle: 'إجمالي النجوم والمستخدمين النشطين خلال آخر 7 أيام',
  chart1SeriesStars: 'إجمالي النجوم',
  chart1SeriesUsers: 'المتعلمون النشطون',
  chart2Title: 'التقدم حسب المرحلة',
  chart2Subtitle: 'مقارنة المراحل المكتملة في الحروف والكلمات والمحادثة',
  chart2SeriesAlphabet: 'الحروف',
  chart2SeriesWords: 'الكلمات',
  chart2SeriesConversation: 'المحادثة',

  leaderboardBannerTitle: '🏆 قائمة أفضل 10 متعلمين',
  leaderboardByStarsBadge: '⭐ حسب النجوم المكتسبة',
  leaderboardBannerDesc: 'ترتيب أفضل 10 طلاب حاصلين على أعلى عدد من النجوم',
  yourStarsLabel: (s) => `نجومك: ${s} ⭐`,
  rank1Title: 'المركز الأول (#1 البطل)',
  rank2Title: 'المركز الثاني (#2 الوصيف)',
  rank3Title: 'المركز الثالث (#3 النجم)',
  streakDaysCount: (d) => `🔥 سلسلة ${d} يوم`,
  top10ListHeading: (c) => `قائمة أفضل 10 (${c}/10)`,
  youBadge: 'أنت',
  statStreak: (d) => `🔥 السلسلة: ${d} يوم`,
  statAlphabet: (d, t) => `🎈 الحروف: ${d}/${t}`,
  statWords: (d, t) => `🍎 الكلمات: ${d}/${t}`,
  statConversation: (d, t) => `💬 المحادثة: ${d}/${t}`,
};

const ES_MODAL: HubModalTranslations = {
  ...EN_MODAL,
  tabStreakLevels: 'Racha y Niveles',
  tabAchievements: (u, t) => `Logros (${u}/${t})`,
  tabLeaderboard: 'Clasificación',
  tabAnalytics: 'Estadísticas',
  tabCertificate: 'Certificado',
  tabAdmin: 'Consola Admin (/mustafa)',
  dailyStreakBadge: 'Sistema de Racha Diaria',
  goalDaysLabel: (d) => `Meta: ${d} Días`,
  streakUnitLabel: 'Días de Racha',
  streakCardHeading: 'Racha de Aprendizaje Continuo 🔥',
  customStreakTitle: 'Ajustes de Racha Personalizados:',
  currentStreakDaysLabel: 'Racha Actual (Días):',
  streakGoalInputLabel: 'Meta de Racha (Días):',
  presetTargetDays: (d) => `Meta ${d} Días`,
  saveStreakBtn: '✅ Guardar Racha',
  levelSystemBadge: 'Niveles de Dificultad (Fácil → Medio → Difícil)',
  usernameInputLabel: '👤 Tu Nombre (para el Certificado y Clasificación):',
  usernameInputPlaceholder: 'Escribe tu nombre...',
  activeBadge: 'Activo',
  level1Title: '🌱 Nivel 1: Fácil (Principiante)',
  level2Title: '⚡ Nivel 2: Medio (Intermedio)',
  level3Title: '🔥 Nivel 3: Difícil (Maestría)',
  achievementsStripTitle: (u, t) => `Logros e Insignias (${u}/${t} Desbloqueados)`,
  viewAchievementsBtn: 'Ver todos los Logros',
  achievementsBannerTitle: 'Logros e Insignias de Hitos',
  filterAll: (c) => `Todos (${c})`,
  filterUnlocked: (c) => `Desbloqueados (${c})`,
  filterInProgress: (c) => `En Progreso (${c})`,
  statusUnlocked: 'Desbloqueado',
  statusInProgress: 'En Progreso',
  leaderboardBannerTitle: '🏆 Top 10 Estudiantes',
  yourStarsLabel: (s) => `Tus Estrellas: ${s} ⭐`,
  youBadge: 'Tú',
};

const DE_MODAL: HubModalTranslations = {
  ...EN_MODAL,
  tabStreakLevels: 'Serie & Stufen',
  tabAchievements: (u, t) => `Erfolge (${u}/${t})`,
  tabLeaderboard: 'Bestenliste',
  tabAnalytics: 'Statistiken',
  tabCertificate: 'Zertifikat',
  tabAdmin: 'Admin-Konsole (/mustafa)',
  dailyStreakBadge: 'Tägliches Serien-System',
  goalDaysLabel: (d) => `Ziel: ${d} Tage`,
  streakUnitLabel: 'Tage Serie',
  streakCardHeading: 'Kontinuierliche Lernserie 🔥',
  saveStreakBtn: '✅ Serie speichern',
  activeBadge: 'Aktiv',
  filterAll: (c) => `Alle (${c})`,
  filterUnlocked: (c) => `Freigeschaltet (${c})`,
  filterInProgress: (c) => `In Arbeit (${c})`,
  statusUnlocked: 'Freigeschaltet',
  statusInProgress: 'In Arbeit',
  leaderboardBannerTitle: '🏆 Top 10 Lernende',
  yourStarsLabel: (s) => `Deine Sterne: ${s} ⭐`,
  youBadge: 'Du',
};

const TR_MODAL: HubModalTranslations = {
  ...EN_MODAL,
  tabStreakLevels: 'Seri ve Seviyeler',
  tabAchievements: (u, t) => `Başarılar (${u}/${t})`,
  tabLeaderboard: 'Liderlik Tablosu',
  tabAnalytics: 'İstatistikler',
  tabCertificate: 'Sertifika',
  tabAdmin: 'Yönetici Paneli (/mustafa)',
  dailyStreakBadge: 'Günlük Seri Sistemi',
  goalDaysLabel: (d) => `Hedef: ${d} Gün`,
  streakUnitLabel: 'Günlük Seri',
  streakCardHeading: 'Sürekli Öğrenme Serisi 🔥',
  saveStreakBtn: '✅ Seriyi Kaydet',
  activeBadge: 'Aktif',
  filterAll: (c) => `Tümü (${c})`,
  filterUnlocked: (c) => `Açılan (${c})`,
  filterInProgress: (c) => `Devam Eden (${c})`,
  statusUnlocked: 'Açıldı',
  statusInProgress: 'Devam Ediyor',
  leaderboardBannerTitle: '🏆 İlk 10 Öğrenci',
  yourStarsLabel: (s) => `Yıldızların: ${s} ⭐`,
  youBadge: 'Sen',
};

const MODAL_TRANSLATIONS_BY_CODE: Record<string, HubModalTranslations> = {
  en: EN_MODAL,
  ur: UR_MODAL,
  fa: FA_MODAL,
  ps: FA_MODAL,
  ku: FA_MODAL,
  fr: FR_MODAL,
  hi: HI_MODAL,
  ar: AR_MODAL,
  es: ES_MODAL,
  de: DE_MODAL,
  tr: TR_MODAL,
};

export function getHubModalTranslations(lang: LanguageInfo): HubModalTranslations {
  return MODAL_TRANSLATIONS_BY_CODE[lang.code] || EN_MODAL;
}
