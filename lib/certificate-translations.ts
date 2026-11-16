import { LanguageInfo } from './languages';

export type CertificateLanguageMode = 'course' | 'spoken' | 'bilingual';

export interface LocalizedCertificateCopy {
  rtl: boolean;
  brandTitleLine1: string;
  brandTitleLine2: string;
  sealBrandLine1: string;
  sealBrandLine2: string;
  certificateHeaderTitle: string;
  subBrandTagline: string;
  topRightMottoLine1: string;
  topRightMottoLine2: string;
  certifyThat: string;
  completedCourseHeading: (courseLangLocalized: string) => string;
  courseBadgeTitle: (courseLangLocalized: string) => string;
  dedicationLine1: string;
  dedicationLine2: string;
  dedicationLine3: string;
  dateLabel: string;
  certNoLabel: string;
  scanToVerify: string;
  founderName: string;
  founderTitle: string;
  founderOrg: string;
  footerMotto: string;
  downloadCertDirectBtn: string;
  completedCertReadyBadge: string;
  signInHeaderButton: string;
  signInTitle: string;
  signInSubtitle: string;
  step1GoogleLabel: string;
  googleSignInButtonText: string;
  googleConnectingText: string;
  googleConnectedLabel: (email: string) => string;
  changeAccountText: string;
  step2UsernameLabel: string;
  usernamePlaceholder: string;
  usernameRequiredError: string;
  certPromiseTitle: (courseLangNative: string) => string;
  certPromiseBody: (
    studentName: string,
    courseLangNative: string,
    spokenLangNative: string
  ) => string;
  changeLanguageBtnText: string;
  certLangSelectorLabel: string;
  certLangOptionCourse: (courseLangNative: string) => string;
  certLangOptionSpoken: (spokenLangNative: string) => string;
  certLangOptionBilingual: (courseLangNative: string, spokenLangNative: string) => string;
  livePreviewCaption: (langLabel: string) => string;
  qrGeneratorTitle: string;
  qrGeneratorSubtitle: string;
  customQrPlaceholder: string;
  downloadQrBtnText: string;
  continueButton: string;
}

const SPOKEN_COURSE_LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  ur: {
    en: 'انگلش',
    ur: 'اردو',
    ar: 'عربی',
    hi: 'ہندی',
    zh: 'چائنیز',
    ja: 'جاپانی',
    ko: 'کورین',
    tr: 'ترکی',
    fa: 'فارسی',
    es: 'ہسپانوی',
    fr: 'فرانسیسی',
    de: 'جرمن',
    ru: 'روسی',
    pt: 'پرتگالی',
    it: 'اطالوی',
    bn: 'بنگالی',
    pa: 'پنجابی',
    ps: 'پشتو',
    id: 'انڈونیشیائی',
    ms: 'ملائی',
    nl: 'ڈچ',
  },
  ar: {
    en: 'الإنجليزية',
    ur: 'الأردية',
    ar: 'العربية',
    hi: 'الهندية',
    zh: 'الصينية',
    ja: 'اليابانية',
    ko: 'الكورية',
    tr: 'التركية',
    fa: 'الفارسية',
    es: 'الإسبانية',
    fr: 'الفرنسية',
    de: 'الألمانية',
    ru: 'الروسية',
    pt: 'البرتغالية',
    it: 'الإيطالية',
    bn: 'البنغالية',
    pa: 'البنجابية',
    ps: 'الباشتو',
    id: 'الإندونيسية',
  },
  hi: {
    en: 'अंग्रेज़ी',
    ur: 'उर्दू',
    ar: 'अरबी',
    hi: 'हिन्दी',
    zh: 'चाइनीज़',
    ja: 'जापानी',
    ko: 'कोरियन',
    tr: 'तुर्की',
    fa: 'फ़ारसी',
    es: 'स्पैनिश',
    fr: 'फ़्रेंच',
    de: 'जर्मन',
    ru: 'रूसी',
    pt: 'पुर्तगाली',
    it: 'इतालवी',
    bn: 'बंगाली',
    pa: 'पंजाबी',
    ps: 'पश्तो',
    id: 'इंडोनेशियाई',
  },
  ja: {
    en: '英語',
    ur: 'ウルドゥー語',
    ar: 'アラビア語',
    hi: 'ヒンディー語',
    zh: '中国語',
    ja: '日本語',
    ko: '韓国語',
    tr: 'トルコ語',
    fa: 'ペルシア語',
    es: 'スペイン語',
    fr: 'フランス語',
    de: 'ドイツ語',
    ru: 'ロシア語',
    pt: 'ポルトガル語',
    it: 'イタリア語',
  },
  zh: {
    en: '英语',
    ur: '乌尔都语',
    ar: '阿拉伯语',
    hi: '印地语',
    zh: '中文',
    ja: '日语',
    ko: '韩语',
    tr: '土耳其语',
    fa: '波斯语',
    es: '西班牙语',
    fr: '法语',
    de: '德语',
    ru: '俄语',
    pt: '葡萄牙语',
    it: '意大利语',
  },
  fa: {
    en: 'انگلیسی',
    ur: 'اردو',
    ar: 'عربی',
    hi: 'هندی',
    zh: 'چینی',
    ja: 'ژاپنی',
    ko: 'کره‌ای',
    tr: 'ترکی',
    fa: 'فارسی',
    es: 'اسپانیایی',
    fr: 'فرانسوی',
    de: 'آلمانی',
    ru: 'روسی',
  },
  ko: {
    en: '영어',
    ur: '우르두어',
    ar: '아랍어',
    hi: '힌디어',
    zh: '중국어',
    ja: '일본어',
    ko: '한국어',
    es: '스페인어',
    fr: '프랑스어',
    de: '독일어',
    ru: '러시아어',
  },
  ru: {
    en: 'Английский',
    ur: 'Урду',
    ar: 'Арабский',
    hi: 'Хинди',
    zh: 'Китайский',
    ja: 'Японский',
    ko: 'Корейский',
    es: 'Испанский',
    fr: 'Французский',
    de: 'Немецкий',
    tr: 'Турецкий',
  },
};

export function getLocalizedCourseLanguageName(
  targetLang: LanguageInfo,
  spokenLang: LanguageInfo
): string {
  if (spokenLang.code === 'en') {
    return targetLang.name;
  }
  const mapForSpoken = SPOKEN_COURSE_LANGUAGE_NAMES[spokenLang.code];
  if (mapForSpoken && mapForSpoken[targetLang.code]) {
    return mapForSpoken[targetLang.code];
  }
  if (targetLang.code === spokenLang.code) {
    return targetLang.nativeName;
  }
  return spokenLang.rtl ? targetLang.nativeName : targetLang.name;
}

const EN_BASE: LocalizedCertificateCopy = {
  rtl: false,
  brandTitleLine1: 'Learning',
  brandTitleLine2: 'Balloon',
  sealBrandLine1: 'Learning',
  sealBrandLine2: 'Balloon',
  certificateHeaderTitle: 'Certificate of Course Completion',
  subBrandTagline: 'Learn  ♦  Grow  ♦  Excel',
  topRightMottoLine1: 'Knowledge Today...',
  topRightMottoLine2: 'A Better Tomorrow...',
  certifyThat: 'This is to certify that',
  completedCourseHeading: () =>
    'has successfully completed the course titled',
  courseBadgeTitle: (courseLangLocalized) =>
    `“Learning with Learning Balloon — ${courseLangLocalized}”`,
  dedicationLine1:
    'and has demonstrated dedication, hard work, and a strong commitment to learning.',
  dedicationLine2:
    'This certificate is awarded in recognition of the successful completion of the course',
  dedicationLine3: 'and the valuable skills acquired.',
  dateLabel: 'Date of Issue:',
  certNoLabel: 'Certificate No.:',
  scanToVerify: 'SCAN TO VERIFY',
  founderName: 'Mustafa',
  founderTitle: 'Founder & CEO',
  founderOrg: 'Learning Balloon',
  footerMotto: 'LEARN TODAY  ♦  LEAD TOMORROW',
  downloadCertDirectBtn: 'Download Certificate (PDF)',
  completedCertReadyBadge: 'Course Completed! Your Certificate is Ready',
  signInHeaderButton: 'Sign In',
  signInTitle: 'Sign in with Google & Enter Your Name for Your Certificate',
  signInSubtitle:
    'Your official PDF Certificate with scannable QR code will be generated in the language you speak!',
  step1GoogleLabel: '1️⃣ Step 1: Sign in with your Google (Gmail) account:',
  googleSignInButtonText: '🔐 Sign in with Google (Gmail)',
  googleConnectingText: 'Connecting to Google...',
  googleConnectedLabel: (email) => `Google Account Connected: ${email}`,
  changeAccountText: 'Switch Account',
  step2UsernameLabel: '2️⃣ Step 2: Enter your Username / Full Name for the Certificate:',
  usernamePlaceholder: 'Enter your full name (e.g., Mustafa)...',
  usernameRequiredError:
    '⚠️ Please enter your name before continuing so it appears on your Certificate!',
  certPromiseTitle: (courseNative) =>
    `🎓 Complete all stages to receive your Official "${courseNative}" Certificate & QR Code!`,
  certPromiseBody: (studentName, courseNative, spokenNative) =>
    `When you finish the course, you will receive an official PDF Certificate for "${studentName}" in your Spoken Language (${spokenNative})!`,
  changeLanguageBtnText: 'Change Language',
  certLangSelectorLabel: '🌐 Choose Certificate Language:',
  certLangOptionCourse: (courseNative) => `Course Language (${courseNative})`,
  certLangOptionSpoken: (spokenNative) => `My Spoken Language (${spokenNative})`,
  certLangOptionBilingual: (courseNative, spokenNative) =>
    `Bilingual (${spokenNative} + ${courseNative})`,
  livePreviewCaption: (langLabel) =>
    `✨ Live Certificate Preview (${langLabel}) with QR Code`,
  qrGeneratorTitle: '📲 Built-in QR Code Generator & Certificate Preview',
  qrGeneratorSubtitle: 'Scannable verification QR code embedded directly in your certificate:',
  customQrPlaceholder: 'Custom QR link or text...',
  downloadQrBtnText: 'Download QR Code (PNG)',
  continueButton: 'Continue & Start Learning',
};

const CERTIFICATE_TRANSLATIONS: Record<string, LocalizedCertificateCopy> = {
  en: EN_BASE,

  ur: {
    ...EN_BASE,
    rtl: true,
    brandTitleLine1: 'لرننگ',
    brandTitleLine2: 'بلون',
    sealBrandLine1: 'لرننگ',
    sealBrandLine2: 'بلون',
    certificateHeaderTitle: 'کورس کی تکمیل کا سرٹیفکیٹ',
    subBrandTagline: 'سیکھیں  ♦  آگے بڑھیں  ♦  کامیاب ہوں',
    topRightMottoLine1: 'آج کا علم...',
    topRightMottoLine2: 'کل کا روشن مستقبل...',
    certifyThat: 'تصدیق کی جاتی ہے کہ',
    completedCourseHeading: (courseLang) =>
      `نے کامیابی کے ساتھ ${courseLang} زبان کا کورس مکمل کر لیا ہے`,
    courseBadgeTitle: (courseLang) =>
      `”لرننگ بلون کے ساتھ تعلیم — ${courseLang} زبان کورس“`,
    dedicationLine1:
      'اور دورانِ کورس بہترین محنت، لگن اور سیکھنے کے مضبوط عزم کا مظاہرہ کیا۔',
    dedicationLine2:
      'یہ سرٹیفکیٹ کورس کی کامیاب تکمیل اور حاصل کردہ قیمتی لسانی مہارتوں',
    dedicationLine3: 'کے اعتراف میں بطورِ اعزاز پیش کیا جاتا ہے۔',
    dateLabel: 'تاریخِ اجرا:',
    certNoLabel: 'سرٹیفکیٹ نمبر:',
    scanToVerify: 'تصدیق کے لیے اسکین کریں',
    founderName: 'مصطفیٰ',
    founderTitle: 'بانی اور سی ای او',
    founderOrg: 'لرننگ بلون',
    footerMotto: 'آج سیکھیں  ♦  کل قیادت کریں',
    downloadCertDirectBtn: 'سرٹیفکیٹ ڈاؤن لوڈ کریں (PDF)',
    completedCertReadyBadge: 'کورس مکمل ہو گیا! اپنا سرٹیفکیٹ ڈاؤن لوڈ کریں',
    signInHeaderButton: 'سائن ان',
    signInTitle: 'گوگل سے سائن ان کریں اور اپنا نام لکھیں',
    signInSubtitle:
      'کورس مکمل ہونے پر آپ کو آپ کی اپنی زبان میں آفیشل PDF سرٹیفکیٹ اور تصدیقی QR کوڈ ملے گا!',
    step1GoogleLabel: '1️⃣ مرحلہ 1: اپنے گوگل اکاؤنٹ سے سائن ان کریں:',
    googleSignInButtonText: '🔐 گوگل اکاؤنٹ سے سائن ان کریں',
    googleConnectingText: 'گوگل سے رابطہ ہو رہا ہے...',
    googleConnectedLabel: (email) => `گوگل اکاؤنٹ منسلک ہے: ${email}`,
    changeAccountText: 'اکاؤنٹ تبدیل کریں',
    step2UsernameLabel: '2️⃣ مرحلہ 2: سرٹیفکیٹ کے لیے اپنا نام لکھیں:',
    usernamePlaceholder: 'یہاں اپنا نام لکھیں (مثلاً: مصطفیٰ)...',
    usernameRequiredError:
      '⚠️ براہ کرم آگے بڑھنے سے پہلے اپنا نام لکھیں تاکہ سرٹیفکیٹ پر آپ کا نام آ سکے!',
    certPromiseTitle: (courseNative) =>
      `🎓 کورس مکمل کرنے پر آپ کو "${courseNative}" کا آفیشل PDF سرٹیفکیٹ اور QR کوڈ ملے گا!`,
    certPromiseBody: (studentName, _courseNative, spokenNative) =>
      `جب آپ کورس مکمل کر لیں گے تو "${studentName}" کے نام سے آپ کی اپنی زبان (${spokenNative}) میں آفیشل سرٹیفکیٹ ملے گا!`,
    changeLanguageBtnText: 'زبان بدلیں',
    certLangSelectorLabel: '🌐 سرٹیفکیٹ کس زبان میں ہونا چاہیے؟',
    certLangOptionCourse: (courseNative) => `کورس کی زبان میں (${courseNative})`,
    certLangOptionSpoken: (spokenNative) => `ہماری اپنی زبان میں (${spokenNative})`,
    certLangOptionBilingual: (courseNative, spokenNative) =>
      `دونوں زبانوں میں (${spokenNative} + ${courseNative})`,
    livePreviewCaption: (langLabel) =>
      `✨ لائیو سرٹیفکیٹ پری ویو (${langLabel}) مع QR کوڈ`,
    qrGeneratorTitle: '📲 لائیو QR کوڈ جنریٹر اور سرٹیفکیٹ پریویو',
    qrGeneratorSubtitle:
      'آپ کے نام، منتخب زبان اور تاریخ کا تصدیقی QR کوڈ سرٹیفکیٹ کے اندر لگا دیا گیا ہے:',
    customQrPlaceholder: 'کسٹم QR لنک یا ٹیکسٹ لکھیں...',
    downloadQrBtnText: 'QR کوڈ ڈاؤن لوڈ کریں (PNG)',
    continueButton: 'آگے بڑھیں اور سیکھنا شروع کریں',
  },

  ar: {
    ...EN_BASE,
    rtl: true,
    brandTitleLine1: 'ليرنينغ',
    brandTitleLine2: 'بالون',
    sealBrandLine1: 'ليرنينغ',
    sealBrandLine2: 'بالون',
    certificateHeaderTitle: 'شهادة إتمام الدورة التدريبية',
    subBrandTagline: 'تعلّم  ♦  تطوّر  ♦  تفوّق',
    topRightMottoLine1: 'معرفة اليوم...',
    topRightMottoLine2: 'غدٌ أفضل وأكثر إشراقاً...',
    certifyThat: 'تشهد هذه الوثيقة بأن',
    completedCourseHeading: (courseLang) =>
      `قد أتمّ بنجاح دورة اللغة ${courseLang} المعتمدة بعنوان`,
    courseBadgeTitle: (courseLang) =>
      `«التعلّم مع ليرنينغ بالون — دورة اللغة ${courseLang}»`,
    dedicationLine1:
      'وقد أظهر التزاماً متميزاً واجتهاداً كبيراً وعزيمة صادقة في التعلّم.',
    dedicationLine2:
      'تُمنح هذه الشهادة تقديراً لإتمام الدورة التدريبية بنجاح وتفوق',
    dedicationLine3: 'واكتساب المهارات اللغوية القيّمة.',
    dateLabel: 'تاريخ الإصدار:',
    certNoLabel: 'رقم الشهادة:',
    scanToVerify: 'امسح للتحقق',
    founderName: 'مصطفى',
    founderTitle: 'المؤسس والرئيس التنفيذي',
    founderOrg: 'ليرنينغ بالون',
    footerMotto: 'تعلّم اليوم  ♦  قُد الغد',
    downloadCertDirectBtn: 'تحميل الشهادة الرسمية (PDF)',
    completedCertReadyBadge: 'اكتملت الدورة! شهادتك جاهزة للتحميل',
    signInHeaderButton: 'تسجيل الدخول',
    signInTitle: 'سجّل الدخول عبر Google واكتب اسمك الكامل',
    signInSubtitle:
      'تصدر الشهادة الرسمية بصيغة PDF مع رمز QR بلغتك التي تتحدثها!',
    certLangSelectorLabel: '🌐 اختر لغة الشهادة:',
    certLangOptionCourse: (courseNative) => `بلغة الدورة (${courseNative})`,
    certLangOptionSpoken: (spokenNative) => `بلغتي التي أتحدثها (${spokenNative})`,
    certLangOptionBilingual: (courseNative, spokenNative) =>
      `ثنائية اللغة (${spokenNative} + ${courseNative})`,
  },

  ja: {
    ...EN_BASE,
    rtl: false,
    brandTitleLine1: 'ラーニング',
    brandTitleLine2: 'バルーン',
    sealBrandLine1: 'ラーニング',
    sealBrandLine2: 'バルーン',
    certificateHeaderTitle: 'コース修了証明書',
    subBrandTagline: '学ぶ  ♦  成長する  ♦  秀でる',
    topRightMottoLine1: '今日の知識が...',
    topRightMottoLine2: 'より良い明日を創る...',
    certifyThat: '本証は次の方が所定の課程を修了したことを証明します',
    completedCourseHeading: (courseLang) =>
      `下記の${courseLang}語学コースを優秀な成績で修了しました`,
    courseBadgeTitle: (courseLang) =>
      `「ラーニング・バルーンで学ぶ — ${courseLang}コース」`,
    dedicationLine1:
      'コース期間中、たゆまぬ努力と熱意をもって語学学習に真摯に取り組みました。',
    dedicationLine2:
      '全課程の修了および実践的な語学スキルの習得を称え、',
    dedicationLine3: 'ここに本修了証を授与いたします。',
    dateLabel: '発行日:',
    certNoLabel: '証明書番号:',
    scanToVerify: 'QRで確認',
    founderName: 'ムスタファ',
    founderTitle: '創設者兼最高経営責任者',
    founderOrg: 'ラーニング・バルーン',
    footerMotto: '今日学び  ♦  明日を導く',
    downloadCertDirectBtn: '修了証明書をダウンロード (PDF)',
    completedCertReadyBadge: 'コース修了！証明書をダウンロードできます',
    certLangSelectorLabel: '🌐 証明書の言語を選択:',
    certLangOptionCourse: (courseNative) => `学習言語 (${courseNative})`,
    certLangOptionSpoken: (spokenNative) => `自分の話す言語 (${spokenNative})`,
    certLangOptionBilingual: (courseNative, spokenNative) =>
      `2言語併記 (${spokenNative} + ${courseNative})`,
  },

  zh: {
    ...EN_BASE,
    rtl: false,
    brandTitleLine1: '学习气球',
    brandTitleLine2: '语言学院',
    sealBrandLine1: '学习气球',
    sealBrandLine2: '官方认证',
    certificateHeaderTitle: '课程结业证书',
    subBrandTagline: '学习  ♦  成长  ♦  卓越',
    topRightMottoLine1: '今日求知探索...',
    topRightMottoLine2: '成就美好未来...',
    certifyThat: '兹证明',
    completedCourseHeading: (courseLang) =>
      `已圆满完成以下${courseLang}语言学习课程`,
    courseBadgeTitle: (courseLang) =>
      `“与学习气球一起学习 — ${courseLang}课程”`,
    dedicationLine1:
      '在学习过程中展现出高度的专注、勤奋与对语言学习的坚定热忱。',
    dedicationLine2:
      '特颁此证，以表彰其顺利完成全部课程阶段',
    dedicationLine3: '并成功掌握宝贵的语言沟通技能。',
    dateLabel: '颁发日期:',
    certNoLabel: '证书编号:',
    scanToVerify: '扫码验证证书',
    founderName: '穆斯塔法',
    founderTitle: '创始人兼首席执行官',
    founderOrg: '学习气球语言学院',
    footerMotto: '今日勤学  ♦  明日领航',
    downloadCertDirectBtn: '下载结业证书 (PDF)',
    completedCertReadyBadge: '课程已全部完成！点击下载您的官方证书',
    certLangSelectorLabel: '🌐 选择证书语言:',
    certLangOptionCourse: (courseNative) => `所学语言 (${courseNative})`,
    certLangOptionSpoken: (spokenNative) => `我说的语言 (${spokenNative})`,
    certLangOptionBilingual: (courseNative, spokenNative) =>
      `双语证书 (${spokenNative} + ${courseNative})`,
  },

  hi: {
    ...EN_BASE,
    rtl: false,
    brandTitleLine1: 'लर्निंग',
    brandTitleLine2: 'बैलून',
    sealBrandLine1: 'लर्निंग',
    sealBrandLine2: 'बैलून',
    certificateHeaderTitle: 'कोर्स पूर्णता प्रमाणपत्र',
    subBrandTagline: 'सीखें  ♦  आगे बढ़ें  ♦  उत्कृष्ट बनें',
    topRightMottoLine1: 'आज का ज्ञान...',
    topRightMottoLine2: 'एक बेहतर कल की पहचान...',
    certifyThat: 'यह प्रमाणित किया जाता है कि',
    completedCourseHeading: (courseLang) =>
      `ने सफलतापूर्वक निम्नलिखित ${courseLang} भाषा कोर्स पूरा कर लिया है`,
    courseBadgeTitle: (courseLang) =>
      `“लर्निंग बैलून के साथ शिक्षा — ${courseLang} भाषा कोर्स”`,
    dedicationLine1:
      'और इस कोर्स के दौरान कड़ी मेहनत, समर्पण और सीखने की उत्कृष्ट प्रतिबद्धता दिखाई है।',
    dedicationLine2:
      'यह प्रमाणपत्र कोर्स को सफलतापूर्वक पूरा करने और अर्जित किए गए',
    dedicationLine3: 'मूल्यवान भाषा कौशल के सम्मान में प्रदान किया जाता है।',
    dateLabel: 'जारी करने की तिथि:',
    certNoLabel: 'प्रमाणपत्र क्र.:',
    scanToVerify: 'सत्यापन हेतु स्कैन करें',
    founderName: 'मुस्तफ़ा',
    founderTitle: 'संस्थापक और सीईओ',
    founderOrg: 'लर्निंग बैलून',
    footerMotto: 'आज सीखें  ♦  कल नेतृत्व करें',
    downloadCertDirectBtn: 'सर्टिफिकेट डाउनलोड करें (PDF)',
    completedCertReadyBadge: 'कोर्स पूरा हो गया! अपना सर्टिफिकेट डाउनलोड करें',
    certLangSelectorLabel: '🌐 सर्टिफिकेट किस भाषा में होना चाहिए?:',
    certLangOptionCourse: (courseNative) => `कोर्स की भाषा में (${courseNative})`,
    certLangOptionSpoken: (spokenNative) => `हमारी अपनी भाषा में (${spokenNative})`,
    certLangOptionBilingual: (courseNative, spokenNative) =>
      `दोनों भाषाओं में (${spokenNative} + ${courseNative})`,
  },

  fa: {
    ...EN_BASE,
    rtl: true,
    brandTitleLine1: 'لرنینگ',
    brandTitleLine2: 'بالون',
    sealBrandLine1: 'لرنینگ',
    sealBrandLine2: 'بالون',
    certificateHeaderTitle: 'گواهینامه پایان دوره آموزشی',
    subBrandTagline: 'بیاموزید  ♦  رشد کنید  ♦  بدرخشید',
    topRightMottoLine1: 'دانش امروز...',
    topRightMottoLine2: 'فردایی روشن‌تر...',
    certifyThat: 'بدین‌وسیله گواهی می‌شود که',
    completedCourseHeading: (courseLang) =>
      `دوره آموزش زبان ${courseLang} را با موفقیت به پایان رسانده است`,
    courseBadgeTitle: (courseLang) =>
      `«یادگیری با لرنینگ بالون — دوره زبان ${courseLang}»`,
    dedicationLine1:
      'و در طول دوره تلاش، پشتکار و تعهد عالی به یادگیری زبان نشان داده است.',
    dedicationLine2:
      'این گواهینامه به‌پاس تکمیل موفقیت‌آمیز دوره آموزشی',
    dedicationLine3: 'و کسب مهارت‌های ارزشمند زبانی اهدا می‌گردد.',
    dateLabel: 'تاریخ صدور:',
    certNoLabel: 'شماره گواهینامه:',
    scanToVerify: 'اسکن برای اصالت‌سنجی',
    founderName: 'مصطفی',
    founderTitle: 'بنیان‌گذار و مدیرعامل',
    founderOrg: 'لرنینگ بالون',
    footerMotto: 'امروز بیاموزید  ♦  فردا رهبری کنید',
    downloadCertDirectBtn: 'دانلود گواهینامه (PDF)',
    completedCertReadyBadge: 'دوره تکمیل شد! گواهینامه شما آماده دانلود است',
  },

  tr: {
    ...EN_BASE,
    rtl: false,
    brandTitleLine1: 'Learning',
    brandTitleLine2: 'Balloon',
    sealBrandLine1: 'Learning',
    sealBrandLine2: 'Balloon',
    certificateHeaderTitle: 'Kurs Tamamlama Sertifikası',
    subBrandTagline: 'Öğren  ♦  Geliş  ♦  Başar',
    topRightMottoLine1: 'Bugünün Bilgisi...',
    topRightMottoLine2: 'Daha İyi Bir Yarın...',
    certifyThat: 'Bu belge ile tasdik edilir ki',
    completedCourseHeading: () =>
      'aşağıdaki dil eğitimi kursunu başarıyla tamamlamıştır',
    courseBadgeTitle: (courseLang) =>
      `“Learning Balloon ile Eğitim — ${courseLang} Dil Kursu”`,
    dedicationLine1:
      've kurs boyunca üstün gayret, özveri ve öğrenmeye güçlü bir bağlılık göstermiştir.',
    dedicationLine2:
      'Bu sertifika, kursun başarıyla tamamlanması ve kazanılan',
    dedicationLine3: 'değerli dil becerilerinin bir러 göstergesi olarak verilmiştir.',
    dateLabel: 'Veriliş Tarihi:',
    certNoLabel: 'Sertifika No:',
    scanToVerify: 'DOĞRULAMAK İÇİN TARAYIN',
    founderName: 'Mustafa',
    founderTitle: 'Kurucu ve CEO',
    founderOrg: 'Learning Balloon',
    footerMotto: 'BUGÜN ÖĞREN  ♦  YARINA LİDERLİK ET',
    downloadCertDirectBtn: 'Sertifikayı İndir (PDF)',
    completedCertReadyBadge: 'Kurs Tamamlandı! Sertifikanız Hazır',
  },

  es: {
    ...EN_BASE,
    rtl: false,
    certificateHeaderTitle: 'Certificado de Finalización del Curso',
    subBrandTagline: 'Aprender  ♦  Crecer  ♦  Sobresalir',
    topRightMottoLine1: 'Conocimiento Hoy...',
    topRightMottoLine2: 'Un Mañana Mejor...',
    certifyThat: 'Por la presente se certifica que',
    completedCourseHeading: () =>
      'ha completado satisfactoriamente el curso titulado',
    courseBadgeTitle: (courseLang) =>
      `“Aprendiendo con Learning Balloon — Curso de ${courseLang}”`,
    dedicationLine1:
      'demostrando dedicación, esfuerzo y un firme compromiso con el aprendizaje.',
    dedicationLine2:
      'Este certificado se otorga en reconocimiento a la culminación exitosa del curso',
    dedicationLine3: 'y a las valiosas habilidades lingüísticas adquiridas.',
    dateLabel: 'Fecha de emisión:',
    certNoLabel: 'Certificado N.º:',
    scanToVerify: 'ESCANEAR PARA VERIFICAR',
    founderName: 'Mustafa',
    founderTitle: 'Fundador y Director Ejecutivo',
    founderOrg: 'Learning Balloon',
    footerMotto: 'APRENDE HOY  ♦  LIDERA MAÑANA',
    downloadCertDirectBtn: 'Descargar Certificado (PDF)',
    completedCertReadyBadge: '¡Curso Completado! Tu Certificado está listo',
  },

  fr: {
    ...EN_BASE,
    rtl: false,
    certificateHeaderTitle: 'Certificat de Réussite du Cours',
    subBrandTagline: 'Apprendre  ♦  Grandir  ♦  Exceller',
    topRightMottoLine1: 'Le Savoir Aujourd’hui...',
    topRightMottoLine2: 'Un Meilleur Demain...',
    certifyThat: 'Il est certifié par la présente que',
    completedCourseHeading: () =>
      'a suivi et validé avec succès le cours intitulé',
    courseBadgeTitle: (courseLang) =>
      `« Apprendre avec Learning Balloon — Cours de ${courseLang} »`,
    dedicationLine1:
      'en faisant preuve de dévouement, de persévérance et d’un fort engagement.',
    dedicationLine2:
      'Ce certificat est décerné en reconnaissance de la réussite complète du cours',
    dedicationLine3: 'et des précieuses compétences acquises.',
    dateLabel: 'Date d’émission :',
    certNoLabel: 'Certificat N° :',
    scanToVerify: 'SCANNER POUR VÉRIFIER',
    founderName: 'Mustafa',
    founderTitle: 'Fondateur et PDG',
    founderOrg: 'Learning Balloon',
    footerMotto: 'APPRENDRE AUJOURD’HUI  ♦  DIRIGER DEMAIN',
    downloadCertDirectBtn: 'Télécharger le Certificat (PDF)',
    completedCertReadyBadge: 'Cours Terminé ! Votre Certificat est prêt',
  },

  de: {
    ...EN_BASE,
    rtl: false,
    certificateHeaderTitle: 'Kursabschluss-Zertifikat',
    subBrandTagline: 'Lernen  ♦  Wachsen  ♦  Übertreffen',
    topRightMottoLine1: 'Wissen Heute...',
    topRightMottoLine2: 'Ein Besseres Morgen...',
    certifyThat: 'Hiermit wird bescheinigt, dass',
    completedCourseHeading: () =>
      'den folgenden Sprachkurs erfolgreich abgeschlossen hat',
    courseBadgeTitle: (courseLang) =>
      `„Lernen mit Learning Balloon — ${courseLang}-Sprachkurs“`,
    dedicationLine1:
      'und dabei großes Engagement, Ausdauer und Lernbereitschaft bewiesen hat.',
    dedicationLine2:
      'Dieses Zertifikat wird in Anerkennung des erfolgreichen Kursabschlusses',
    dedicationLine3: 'und der erworbenen Sprachkenntnisse verliehen.',
    dateLabel: 'Ausstellungsdatum:',
    certNoLabel: 'Zertifikat-Nr.:',
    scanToVerify: 'ZUR PRÜFUNG SCANNEN',
    founderName: 'Mustafa',
    founderTitle: 'Gründer & CEO',
    founderOrg: 'Learning Balloon',
    footerMotto: 'HEUTE LERNEN  ♦  MORGEN FÜHREN',
    downloadCertDirectBtn: 'Zertifikat Herunterladen (PDF)',
    completedCertReadyBadge: 'Kurs Abgeschlossen! Ihr Zertifikat ist bereit',
  },

  ko: {
    ...EN_BASE,
    rtl: false,
    brandTitleLine1: '러닝',
    brandTitleLine2: '벌룬',
    sealBrandLine1: '러닝',
    sealBrandLine2: '벌룬',
    certificateHeaderTitle: '과정 수료 증명서',
    subBrandTagline: '배움  ♦  성장  ♦  탁월함',
    topRightMottoLine1: '오늘의 지식이...',
    topRightMottoLine2: '더 나은 내일을 만듭니다...',
    certifyThat: '이 증서는 다음 학습자가 아래 과정을 수료하였음을 증명합니다',
    completedCourseHeading: (courseLang) =>
      `아래의 ${courseLang} 어학 교육 과정을 성공적으로 수료하였습니다`,
    courseBadgeTitle: (courseLang) =>
      `“러닝 벌룬과 함께하는 학습 — ${courseLang} 과정”`,
    dedicationLine1:
      '교육 기간 동안 뛰어난 열정과 성실함으로 언어 학습에 매진하였습니다.',
    dedicationLine2:
      '전 과정을 성공적으로 마치고 우수한 언어 능력을 습득하였기에',
    dedicationLine3: '이를 기념하여 본 수료증을 수여합니다.',
    dateLabel: '발급일:',
    certNoLabel: '증서 번호:',
    scanToVerify: 'QR 진위 확인',
    founderName: '무스타파',
    founderTitle: '창립자 겸 최고경영자',
    founderOrg: '러닝 벌룬',
    footerMotto: '오늘 배우고  ♦  내일을 이끈다',
    downloadCertDirectBtn: '수료증 다운로드 (PDF)',
    completedCertReadyBadge: '과정 완료! 수료증을 다운로드하세요',
  },

  ru: {
    ...EN_BASE,
    rtl: false,
    brandTitleLine1: 'Лернинг',
    brandTitleLine2: 'Баллун',
    sealBrandLine1: 'Лернинг',
    sealBrandLine2: 'Баллун',
    certificateHeaderTitle: 'Сертификат об окончании курса',
    subBrandTagline: 'Учись  ♦  Расти  ♦  Преуспевай',
    topRightMottoLine1: 'Знания сегодня...',
    topRightMottoLine2: 'Лучшее завтра...',
    certifyThat: 'Настоящим подтверждается, что',
    completedCourseHeading: () =>
      'успешно завершил(а) обучающий языковой курс',
    courseBadgeTitle: (courseLang) =>
      `«Обучение с Лернинг Баллун — курс: ${courseLang}»`,
    dedicationLine1:
      'проявив целеустремлённость, трудолюбие и высокую приверженность обучению.',
    dedicationLine2:
      'Данный сертификат вручается в знак признания успешного завершения курса',
    dedicationLine3: 'и приобретения ценных языковых навыков.',
    dateLabel: 'Дата выдачи:',
    certNoLabel: '№ сертификата:',
    scanToVerify: 'СКАНИРУЙТЕ QR',
    founderName: 'Мустафа',
    founderTitle: 'Основатель и генеральный директор',
    founderOrg: 'Лернинг Баллун',
    footerMotto: 'УЧИСЬ СЕГОДНЯ  ♦  ВЕДИ ЗА СОБОЙ ЗАВТРА',
    downloadCertDirectBtn: 'Скачать сертификат (PDF)',
    completedCertReadyBadge: 'Курс завершён! Ваш сертификат готов',
  },

  bn: {
    ...EN_BASE,
    rtl: false,
    brandTitleLine1: 'লার্নিং',
    brandTitleLine2: 'বেলুন',
    sealBrandLine1: 'লার্নিং',
    sealBrandLine2: 'বেলুন',
    certificateHeaderTitle: 'কোর্স সমাপ্তির সনদপত্র',
    subBrandTagline: 'শিখুন  ♦  এগিয়ে যান  ♦  সেরা হোন',
    topRightMottoLine1: 'আজকের জ্ঞান...',
    topRightMottoLine2: 'আগামী দিনের উজ্জ্বল ভবিষ্যৎ...',
    certifyThat: 'এই মর্মে প্রত্যয়ন করা যাচ্ছে যে',
    completedCourseHeading: (courseLang) =>
      `সফলভাবে নিম্নোক্ত ${courseLang} ভাষা কোর্স সম্পন্ন করেছেন`,
    courseBadgeTitle: (courseLang) =>
      `“লার্নিং বেলুনের সাথে শিক্ষা — ${courseLang} কোর্স”`,
    dedicationLine1:
      'এবং কোর্স চলাকালীন কঠোর পরিশ্রম, নিষ্ঠা ও ভাষা শেখার দৃঢ় অঙ্গীকার প্রদর্শন করেছেন।',
    dedicationLine2:
      'কোর্সটি সফলভাবে সম্পন্ন করা এবং মূল্যবান ভাষা দক্ষতা অর্জনের',
    dedicationLine3: 'স্বীকৃতিস্বরূপ এই সনদপত্র প্রদান করা হলো।',
    dateLabel: 'প্রদানের তারিখ:',
    certNoLabel: 'সনদপত্র নং:',
    scanToVerify: 'যাচাই করতে স্ক্যান করুন',
    founderName: 'মুস্তাফা',
    founderTitle: 'প্রতিষ্ঠাতা ও প্রধান নির্বাহী',
    founderOrg: 'লার্নিং বেলুন',
    footerMotto: 'আজ শিখুন  ♦  আগামীকাল নেতৃত্ব দিন',
    downloadCertDirectBtn: 'সনদপত্র ডাউনলোড করুন (PDF)',
    completedCertReadyBadge: 'কোর্স সম্পন্ন! আপনার সনদপত্র ডাউনলোড করুন',
  },

  pa: {
    ...EN_BASE,
    rtl: false,
    brandTitleLine1: 'ਲਰਨਿੰਗ',
    brandTitleLine2: 'ਬੈਲੂਨ',
    sealBrandLine1: 'ਲਰਨਿੰਗ',
    sealBrandLine2: 'ਬੈਲੂਨ',
    certificateHeaderTitle: 'ਕੋਰਸ ਪੂਰਾ ਹੋਣ ਦਾ ਸਰਟੀਫਿਕੇਟ',
    subBrandTagline: 'ਸਿੱਖੋ  ♦  ਵਧੋ  ♦  ਅੱਗੇ ਵਧੋ',
    topRightMottoLine1: 'ਅੱਜ ਦਾ ਗਿਆਨ...',
    topRightMottoLine2: 'ਕੱਲ੍ਹ ਦਾ ਸੁਨਹਿਰੀ ਭਵਿੱਖ...',
    certifyThat: 'ਇਹ ਤਸਦੀਕ ਕੀਤਾ ਜਾਂਦਾ ਹੈ ਕਿ',
    completedCourseHeading: (courseLang) =>
      `ਨੇ ਸਫਲਤਾਪੂਰਵਕ ਹੇਠ ਲਿਖਿਆ ${courseLang} ਭਾਸ਼ਾ ਕੋਰਸ ਪੂਰਾ ਕਰ ਲਿਆ ਹੈ`,
    courseBadgeTitle: (courseLang) =>
      `“ਲਰਨਿੰਗ ਬੈਲੂਨ ਨਾਲ ਸਿੱਖਿਆ — ${courseLang} ਭਾਸ਼ਾ ਕੋਰਸ”`,
    dedicationLine1:
      'ਅਤੇ ਕੋਰਸ ਦੌਰਾਨ ਸਖ਼ਤ ਮਿਹਨਤ, ਲਗਨ ਅਤੇ ਸਿੱਖਣ ਲਈ ਸ਼ਾਨਦਾਰ ਜਜ਼ਬਾ ਦਿਖਾਇਆ ਹੈ।',
    dedicationLine2:
      'ਇਹ ਸਰਟੀਫਿਕੇਟ ਕੋਰਸ ਨੂੰ ਸਫਲਤਾਪੂਰਵਕ ਪੂਰਾ ਕਰਨ ਅਤੇ ਹਾਸਲ ਕੀਤੇ',
    dedicationLine3: 'ਕੀਮਤੀ ਭਾਸ਼ਾ ਹੁਨਰਾਂ ਦੇ ਸਨਮਾਨ ਵਿੱਚ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ।',
    dateLabel: 'ਜਾਰੀ ਕਰਨ ਦੀ ਮਿਤੀ:',
    certNoLabel: 'ਸਰਟੀਫਿਕੇਟ ਨੰ.:',
    scanToVerify: 'ਤਸਦੀਕ ਲਈ ਸਕੈਨ ਕਰੋ',
    founderName: 'ਮੁਸਤਫ਼ਾ',
    founderTitle: 'ਸੰਸਥਾਪਕ ਅਤੇ ਸੀਈਓ',
    founderOrg: 'ਲਰਨਿੰਗ ਬੈਲੂਨ',
    footerMotto: 'ਅੱਜ ਸਿੱਖੋ  ♦  ਕੱਲ੍ਹ ਅਗਵਾਈ ਕਰੋ',
    downloadCertDirectBtn: 'ਸਰਟੀਫਿਕੇਟ ਡਾਊਨਲੋਡ ਕਰੋ (PDF)',
    completedCertReadyBadge: 'ਕੋਰਸ ਪੂਰਾ ਹੋ ਗਿਆ! ਸਰਟੀਫਿਕੇਟ ਡਾਊਨਲੋਡ ਕਰੋ',
  },

  ps: {
    ...EN_BASE,
    rtl: true,
    brandTitleLine1: 'لرننګ',
    brandTitleLine2: 'بلون',
    sealBrandLine1: 'لرننګ',
    sealBrandLine2: 'بلون',
    certificateHeaderTitle: 'د کورس د بشپړولو تصدیق پاڼه',
    subBrandTagline: 'زده کړه  ♦  وده  ♦  بریالیتوب',
    topRightMottoLine1: 'د نن ورځې پوهه...',
    topRightMottoLine2: 'د سبا روښانه راتلونکی...',
    certifyThat: 'دا تصدیق کیږي چې',
    completedCourseHeading: (courseLang) =>
      `په بریالیتوب سره د ${courseLang} ژبې کورس بشپړ کړی دی`,
    courseBadgeTitle: (courseLang) =>
      `”له لرننګ بلون سره زده کړه — د ${courseLang} ژبې کورس“`,
    dedicationLine1:
      'او د کورس په جریان کې یې د زده کړې لپاره کلک هوډ، زیار او لیوالتیا ښودلې ده.',
    dedicationLine2:
      'دا تصدیق پاڼه د کورس د بریالي بشپړولو او ترلاسه شویو',
    dedicationLine3: 'ارزښتناکو مهارتونو په ویاړ ورکول کیږي.',
    dateLabel: 'د صدور نیټه:',
    certNoLabel: 'د تصدیق پاڼې شمیره:',
    scanToVerify: 'د تایید لپاره سکین کړئ',
    founderName: 'مصطفیٰ',
    founderTitle: 'بنسټ ایښودونکی او اجراییوي رییس',
    founderOrg: 'لرننګ بلون',
    footerMotto: 'نن زده کړه وکړئ  ♦  سبا مشري وکړئ',
    downloadCertDirectBtn: 'تصدیق پاڼه ډاونلوډ کړئ (PDF)',
    completedCertReadyBadge: 'کورس بشپړ شو! خپله تصدیق پاڼه ډاونلوډ کړئ',
  },

  id: {
    ...EN_BASE,
    rtl: false,
    certificateHeaderTitle: 'Sertifikat Penyelesaian Kursus',
    subBrandTagline: 'Belajar  ♦  Berkembang  ♦  Unggul',
    topRightMottoLine1: 'Pengetahuan Hari Ini...',
    topRightMottoLine2: 'Masa Depan Lebih Baik...',
    certifyThat: 'Dengan ini menerangkan bahwa',
    completedCourseHeading: () =>
      'telah berhasil menyelesaikan kursus berjudul',
    courseBadgeTitle: (courseLang) =>
      `“Belajar bersama Learning Balloon — Kursus Bahasa ${courseLang}”`,
    dedicationLine1:
      'serta menunjukkan dedikasi, kerja keras, dan komitmen tinggi dalam belajar.',
    dedicationLine2:
      'Sertifikat ini diberikan sebagai penghargaan atas keberhasilan menyelesaikan kursus',
    dedicationLine3: 'dan keterampilan bahasa berharga yang telah diperoleh.',
    dateLabel: 'Tanggal Terbit:',
    certNoLabel: 'No. Sertifikat:',
    scanToVerify: 'PINDAI QR',
    founderName: 'Mustafa',
    founderTitle: 'Pendiri & CEO',
    founderOrg: 'Learning Balloon',
    footerMotto: 'BELAJAR HARI INI  ♦  MEMIMPIN ESOK HARI',
    downloadCertDirectBtn: 'Unduh Sertifikat (PDF)',
    completedCertReadyBadge: 'Kursus Selesai! Sertifikat Anda Siap Diunduh',
  },
};

export function getCertificateCopyForLang(lang: LanguageInfo): LocalizedCertificateCopy {
  const exact = CERTIFICATE_TRANSLATIONS[lang.code];
  if (exact) return exact;

  if (lang.code === 'ms') {
    return CERTIFICATE_TRANSLATIONS.id;
  }

  if (lang.code === 'ku' || lang.code === 'sd') {
    return {
      ...CERTIFICATE_TRANSLATIONS.ur,
      rtl: true,
    };
  }

  if (lang.rtl) {
    return {
      ...CERTIFICATE_TRANSLATIONS.ar,
      rtl: true,
    };
  }

  return EN_BASE;
}
