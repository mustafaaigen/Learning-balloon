import { LanguageInfo } from './languages';

export type ReferralSourceId =
  | 'youtube'
  | 'tiktok_insta'
  | 'google'
  | 'friends_family'
  | 'facebook'
  | 'school_other';

export type InitialProficiencyType = 'scratch' | 'some_conversation';

export type ConversationAbilityLevel = 'level_1_basic' | 'level_2_medium' | 'level_3_full';

export type LearningMotivationId =
  | 'travel'
  | 'career'
  | 'education'
  | 'connect'
  | 'brain';

export interface OnboardingProfileData {
  referralSource: ReferralSourceId;
  proficiencyType: InitialProficiencyType;
  conversationAbility: ConversationAbilityLevel;
  motivation: LearningMotivationId;
  dailyMinutes: 5 | 10 | 15 | 20;
  completedAt: string;
}

export interface OnboardingWizardCopy {
  rtl: boolean;
  step1Short: string;
  step2Short: string;
  step3Short: string;
  step4Short: string;
  step5Short: string;
  // Step 3: Where did you hear about us?
  step3Badge: string;
  step3Title: string;
  step3Subtitle: string;
  referralOptions: Record<ReferralSourceId, { title: string; subtitle: string; icon: string }>;
  // Step 4: How much conversation do you know?
  step4Badge: string;
  step4Title: (targetLangName: string) => string;
  step4Subtitle: string;
  startFromScratchTitle: string;
  startFromScratchDesc: string;
  knowSomeConvTitle: string;
  knowSomeConvDesc: string;
  convLevelQuestionTitle: (targetLangName: string) => string;
  convLevelQuestionSub: string;
  convLevels: Record<
    ConversationAbilityLevel,
    {
      badge: string;
      title: string;
      desc: string;
      unlockPreview: string;
      wordsUnlock: number;
      topicsUnlock: number;
    }
  >;
  // Step 5: Daily Goal & Motivation
  step5Badge: string;
  step5Title: string;
  step5Subtitle: string;
  motivationLabel: string;
  motivations: Record<LearningMotivationId, { title: string; icon: string }>;
  dailyCommitLabel: string;
  dailyCommitOptions: {
    minutes: 5 | 10 | 15 | 20;
    label: string;
    tag: string;
    icon: string;
  }[];
  autoStreakPromiseTitle: string;
  autoStreakPromiseDesc: string;
  continueBtn: string;
  backBtn: string;
  finishToSignInBtn: string;
  savePreferencesBtn: string;
  // Goal Achieved Celebration Modal
  goalAchievedBadge: string;
  goalAchievedTitle: (days: number) => string;
  goalAchievedSubtitle: (days: number, nextGoal: number) => string;
  goalAchievedRewardLabel: string;
  goalAchievedAutoNote: string;
  goalAchievedClaimBtn: string;
  goalAchievedPreviewBtn: string;
}

export function getOnboardingWizardCopy(lang: LanguageInfo): OnboardingWizardCopy {
  const code = lang.code;
  const rtl = Boolean(lang.rtl);

  if (code === 'ur') {
    return {
      rtl: true,
      step1Short: '1. آپ کی زبان',
      step2Short: '2. سیکھنے کی زبان',
      step3Short: '3. کہاں سے سنا؟',
      step4Short: '4. بات چیت کا لیول',
      step5Short: '5. روزانہ ہدف',
      step3Badge: 'قدم 3 از 5 · تعارف',
      step3Title: 'آپ نے اس ویب سائٹ (Learning Balloon) کے بارے میں کہاں سے سنا؟',
      step3Subtitle: 'اپنی زبان میں بتائیں تاکہ ہم آپ کے تجربے کو مزید بہترین بنا سکیں۔',
      referralOptions: {
        youtube: { title: 'یوٹیوب (YouTube)', subtitle: 'ویڈیو یا شارٹس میں دیکھا', icon: '📺' },
        tiktok_insta: { title: 'ٹک ٹاک / انسٹاگرام', subtitle: 'ریلز یا سوشل ویڈیوز سے', icon: '📱' },
        google: { title: 'گوگل سرچ (Google)', subtitle: 'آن لائن زبان سیکھنے کی تلاش', icon: '🔍' },
        friends_family: { title: 'دوست یا خاندان', subtitle: 'کسی عزیز یا دوست نے مشورہ دیا', icon: '👨‍👩‍👧‍👦' },
        facebook: { title: 'فیس بک / واٹس ایپ', subtitle: 'سوشل میڈیا گروپ یا پوسٹ', icon: '📘' },
        school_other: { title: 'اسکول / استاد / دیگر', subtitle: 'کلاس، اکیڈمی یا کسی اور جگہ سے', icon: '🎓' },
      },
      step4Badge: 'قدم 4 از 5 · آپ کا لیول',
      step4Title: (t) => `آپ کو ${t} میں کتنی بات چیت آتی ہے؟`,
      step4Subtitle: 'کیا آپ بالکل شروع سے سیکھنا چاہتے ہیں یا تھوڑی بہت بات چیت کر سکتے ہیں؟',
      startFromScratchTitle: 'میں بالکل شروع سے سیکھنا چاہتا ہوں (نیا آغاز)',
      startFromScratchDesc: 'بنیادی الفاظ نمبر 1 اور آسان جملوں سے قدم بہ قدم آغاز کریں۔',
      knowSomeConvTitle: 'میں تھوڑی بہت بات چیت کر سکتا ہوں',
      knowSomeConvDesc: 'مجھے کچھ الفاظ یا جملے آتے ہیں — اپنا بات چیت کا لیول منتخب کریں۔',
      convLevelQuestionTitle: (t) => `آپ کس لیول تک ${t} میں بات چیت کر سکتے ہیں؟`,
      convLevelQuestionSub: 'اپنی صلاحیت کے مطابق لیول چنیں، ہم اسی حساب سے اسباق کھول دیں گے:',
      convLevels: {
        level_1_basic: {
          badge: 'لیول 1 · ابتدائی',
          title: 'میں ہلکی پھلکی بات چیت کر سکتا ہوں',
          desc: 'سلام دعا، نام پوچھنا اور روزمرہ کے چھوٹے جملے بول سکتا ہوں۔',
          unlockPreview: '🔓 پہلے 25 الفاظ اور 10 ٹاپکس کھل جائیں گے',
          wordsUnlock: 25,
          topicsUnlock: 10,
        },
        level_2_medium: {
          badge: 'لیول 2 · درمیانہ',
          title: 'میں روزمرہ کی اچھی بات چیت کر سکتا ہوں',
          desc: 'سفر، بازار، ہوٹل اور عام موضوعات پر گفتگو کر سکتا ہوں۔',
          unlockPreview: '🔓 پہلے 60 الفاظ اور 35 ٹاپکس کھل جائیں گے',
          wordsUnlock: 60,
          topicsUnlock: 35,
        },
        level_3_full: {
          badge: 'لیول 3 · ایڈوانسڈ',
          title: 'ہم پوری بات چیت کر سکتے ہیں (روانی کے ساتھ)',
          desc: 'مکمل جملے، دفتر، کاروبار اور ہر موضوع پر کھل کر بات کر سکتے ہیں۔',
          unlockPreview: '🔓 تمام 100 الفاظ اور 90 ٹاپکس کھل جائیں گے',
          wordsUnlock: 100,
          topicsUnlock: 90,
        },
      },
      step5Badge: 'قدم 5 از 5 · مقصد اور آٹو اسٹریکس',
      step5Title: 'آپ کا سیکھنے کا مقصد اور روزانہ کا ہدف کیا ہے؟',
      step5Subtitle: 'اپنا روزانہ کا وقت مقرر کریں — ہمارا آٹومیٹک اسٹریکس سسٹم خودکار طور پر آپ کا ریکارڈ رکھے گا!',
      motivationLabel: 'آپ یہ زبان کیوں سیکھ رہے ہیں؟',
      motivations: {
        travel: { title: 'سفر اور بیرونِ ملک رہائش', icon: '✈️' },
        career: { title: 'نوکری اور کاروبار میں ترقی', icon: '💼' },
        education: { title: 'تعلیم اور امتحانات', icon: '🎓' },
        connect: { title: 'لوگوں اور دوستوں سے گفتگو', icon: '🤝' },
        brain: { title: 'ذہنی صلاحیت اور شوق', icon: '🧠' },
      },
      dailyCommitLabel: 'روزانہ پریکٹس کا ہدف منتخب کریں:',
      dailyCommitOptions: [
        { minutes: 5, label: '5 منٹ روزانہ', tag: 'آسان آغاز', icon: '🌱' },
        { minutes: 10, label: '10 منٹ روزانہ', tag: 'مستقل مزاج', icon: '🔥' },
        { minutes: 15, label: '15 منٹ روزانہ', tag: 'سنجیدہ طالب علم', icon: '🚀' },
        { minutes: 20, label: '20 منٹ روزانہ', tag: 'سپر چیمپئن', icon: '👑' },
      ],
      autoStreakPromiseTitle: '100% آٹومیٹک اسٹریکس سسٹم فعال ہے',
      autoStreakPromiseDesc: 'آپ جیسے ہی روزانہ ایک بھی غبارہ پھوڑیں گے، آپ کی اسٹریکس خود بخود بڑھ جائے گی اور ہدف پورا ہونے پر خصوصی انعام ملے گا۔',
      continueBtn: 'آگے بڑھیں ←',
      backBtn: 'واپس',
      finishToSignInBtn: 'مکمل کریں اور سائن ان پر جائیں ✨',
      savePreferencesBtn: 'سیٹنگز محفوظ کریں اور کورس شروع کریں ✨',
      goalAchievedBadge: '🔥 روزانہ اسٹریکس ہدف مکمل!',
      goalAchievedTitle: (days) => `ماشاءاللہ! ${days} دن کی اسٹریکس کا ہدف مکمل ہو گیا!`,
      goalAchievedSubtitle: (days, nextGoal) =>
        `آپ نے لگاتار ${days} دن پریکٹس کر کے اپنا ہدف حاصل کر لیا ہے۔ آٹومیٹک سسٹم نے آپ کا اگلا ہدف ${nextGoal} دن مقرر کر دیا ہے!`,
      goalAchievedRewardLabel: '+25 ⭐ خصوصی اسٹریکس انعام',
      goalAchievedAutoNote: '⚡ آٹومیٹک اسٹریکس سسٹم: روزانہ پریکٹس پر خودکار اپڈیٹ',
      goalAchievedClaimBtn: 'انعام حاصل کریں (+25 ⭐) اور جاری رکھیں',
      goalAchievedPreviewBtn: '🎉 ہدف کی خوشی دیکھیں',
    };
  }

  if (code === 'hi') {
    return {
      rtl: false,
      step1Short: '1. आपकी भाषा',
      step2Short: '2. सीखने की भाषा',
      step3Short: '3. कहाँ से सुना?',
      step4Short: '4. बातचीत का लेवल',
      step5Short: '5. डेली गोल',
      step3Badge: 'स्टेप 3 / 5 · परिचय',
      step3Title: 'आपने इस वेबसाइट (Learning Balloon) के बारे में कहाँ से सुना?',
      step3Subtitle: 'अपनी भाषा में चुनें ताकि हम आपके सीखने के सफ़र को और बेहतर बना सकें।',
      referralOptions: {
        youtube: { title: 'यूट्यूब (YouTube)', subtitle: 'वीडियो या शॉर्ट्स में देखा', icon: '📺' },
        tiktok_insta: { title: 'टिकटॉक / इंस्टाग्राम', subtitle: 'रील्स या सोशल वीडियो से', icon: '📱' },
        google: { title: 'गूगल सर्च (Google)', subtitle: 'ऑनलाइन भाषा सीखने की खोज', icon: '🔍' },
        friends_family: { title: 'दोस्त या परिवार', subtitle: 'किसी दोस्त या रिश्तेदार ने बताया', icon: '👨‍👩‍👧‍👦' },
        facebook: { title: 'फ़ेसबुक / व्हाट्सऐप', subtitle: 'सोशल मीडिया पोस्ट या ग्रुप से', icon: '📘' },
        school_other: { title: 'स्कूल / टीचर / अन्य', subtitle: 'क्लास, अकादमी या किसी और जगह से', icon: '🎓' },
      },
      step4Badge: 'स्टेप 4 / 5 · आपका लेवल',
      step4Title: (t) => `आपको ${t} में कितनी बातचीत आती है?`,
      step4Subtitle: 'क्या आप बिल्कुल शुरू से सीखना चाहते हैं या थोड़ी बहुत बातचीत कर सकते हैं?',
      startFromScratchTitle: 'मैं बिल्कुल शुरू से सीखना चाहता हूँ (शुरुआत से)',
      startFromScratchDesc: 'वर्ड नंबर 1 और आसान वाक्यों से स्टेप-बाय-स्टेप शुरुआत करें।',
      knowSomeConvTitle: 'मैं थोड़ी बहुत बातचीत कर सकता हूँ',
      knowSomeConvDesc: 'मुझे कुछ शब्द या वाक्य आते हैं — नीचे अपना बातचीत का लेवल चुनें।',
      convLevelQuestionTitle: (t) => `आप कितने लेवल की ${t} बातचीत कर सकते हैं?`,
      convLevelQuestionSub: 'अपनी बातचीत के हिसाब से लेवल चुनें, हम उसी हिसाब से लेसन अनलॉक कर देंगे:',
      convLevels: {
        level_1_basic: {
          badge: 'लेवल 1 · बेसिक',
          title: 'मैं हल्की-फुल्की बातचीत कर सकता हूँ',
          desc: 'नमस्ते, हाल-चाल और रोज़मर्रा के छोटे वाक्य बोल सकता हूँ।',
          unlockPreview: '🔓 पहले 25 वर्ड्स और 10 टॉपिक्स अनलॉक होंगे',
          wordsUnlock: 25,
          topicsUnlock: 10,
        },
        level_2_medium: {
          badge: 'लेवल 2 · मीडियम',
          title: 'मैं रोज़मर्रा की अच्छी बातचीत कर सकता हूँ',
          desc: 'सफ़र, बाज़ार, होटल और आम मुद्दों पर बातचीत कर सकता हूँ।',
          unlockPreview: '🔓 पहले 60 वर्ड्स और 35 टॉपिक्स अनलॉक होंगे',
          wordsUnlock: 60,
          topicsUnlock: 35,
        },
        level_3_full: {
          badge: 'लेवल 3 · एडवांस्ड',
          title: 'हम पूरी बात कर सकते हैं (फ्लुएंट बातचीत)',
          desc: 'पूरे वाक्य, ऑफ़िस, कामकाज और हर विषय पर खुलकर बात कर सकते हैं।',
          unlockPreview: '🔓 पूरे 100 वर्ड्स और 90 टॉपिक्स अनलॉक होंगे',
          wordsUnlock: 100,
          topicsUnlock: 90,
        },
      },
      step5Badge: 'स्टेप 5 / 5 · लक्ष्य और ऑटो-स्ट्रीक',
      step5Title: 'आपका सीखने का मकसद और डेली गोल क्या है?',
      step5Subtitle: 'अपना रोज़ का समय चुनें — हमारा ऑटोमैटिक स्ट्रीक सिस्टम अपने-आप आपकी स्ट्रीक बढ़ाएगा!',
      motivationLabel: 'आप यह भाषा क्यों सीख रहे हैं?',
      motivations: {
        travel: { title: 'सफ़र और विदेश यात्रा', icon: '✈️' },
        career: { title: 'नौकरी और करियर ग्रोथ', icon: '💼' },
        education: { title: 'पढ़ाई और एग्ज़ाम', icon: '🎓' },
        connect: { title: 'लोगों और दोस्तों से बातचीत', icon: '🤝' },
        brain: { title: 'दिमागी विकास और शौक', icon: '🧠' },
      },
      dailyCommitLabel: 'रोज़ाना प्रैक्टिस का समय चुनें:',
      dailyCommitOptions: [
        { minutes: 5, label: '5 मिनट रोज़', tag: 'आसान शुरुआत', icon: '🌱' },
        { minutes: 10, label: '10 मिनट रोज़', tag: 'रेगुलर', icon: '🔥' },
        { minutes: 15, label: '15 मिनट रोज़', tag: 'सीरियस लर्नर', icon: '🚀' },
        { minutes: 20, label: '20 मिनट रोज़', tag: 'सुपर चैंपियन', icon: '👑' },
      ],
      autoStreakPromiseTitle: '100% ऑटोमैटिक स्ट्रीक सिस्टम चालू है',
      autoStreakPromiseDesc: 'जब भी आप रोज़ाना प्रैक्टिस करेंगे, आपकी स्ट्रीक अपने-आप बढ़ेगी और गोल पूरा होने पर स्पेशल सेलिब्रेशन मिलेगा।',
      continueBtn: 'आगे बढ़ें →',
      backBtn: 'पीछे जाएँ',
      finishToSignInBtn: 'पूरा करें और साइन-इन पर जाएँ ✨',
      savePreferencesBtn: 'सेटिंग्स सेव करें और शुरू करें ✨',
      goalAchievedBadge: '🔥 डेली स्ट्रीक गोल पूरा हुआ!',
      goalAchievedTitle: (days) => `माशाल्लाह! ${days} दिन का स्ट्रीक गोल पूरा हो गया!`,
      goalAchievedSubtitle: (days, nextGoal) =>
        `आपने लगातार ${days} दिन प्रैक्टिस करके अपना लक्ष्य पूरा कर लिया है। ऑटोमैटिक स्ट्रीक सिस्टम ने अब आपका अगला गोल ${nextGoal} दिन सेट कर दिया है!`,
      goalAchievedRewardLabel: '+25 ⭐ स्पेशल स्ट्रीक बोनस',
      goalAchievedAutoNote: '⚡ 100% ऑटोमैटिक स्ट्रीक इंजन: रोज़ प्रैक्टिस पर अपने-आप अपडेट',
      goalAchievedClaimBtn: 'बोनस लें (+25 ⭐) और आगे बढ़ें',
      goalAchievedPreviewBtn: '🎉 गोल सेलिब्रेशन देखें',
    };
  }

  if (code === 'ar') {
    return {
      rtl: true,
      step1Short: '1. لغتك الأم',
      step2Short: '2. لغة التعلم',
      step3Short: '3. كيف عرفتنا؟',
      step4Short: '4. مستوى المحادثة',
      step5Short: '5. الهدف اليومي',
      step3Badge: 'الخطوة 3 من 5 · التعارف',
      step3Title: 'من أين سمعت عن موقع Learning Balloon؟',
      step3Subtitle: 'أخبرنا بلغتك لنخصص تجربتك التعليمية بأفضل شكل.',
      referralOptions: {
        youtube: { title: 'يوتيوب (YouTube)', subtitle: 'شاهدت فيديو أو مقاطع قصيرة', icon: '📺' },
        tiktok_insta: { title: 'تيك توك / إنستغرام', subtitle: 'عبر مقاطع ريلز أو الفيديو', icon: '📱' },
        google: { title: 'بحث جوجل (Google)', subtitle: 'أثناء البحث عن تعلم اللغات', icon: '🔍' },
        friends_family: { title: 'الأصدقاء أو العائلة', subtitle: 'توصية من صديق أو قريب', icon: '👨‍👩‍👧‍👦' },
        facebook: { title: 'فيسبوك / واتساب', subtitle: 'منشور أو مجموعة تواصل اجتماعي', icon: '📘' },
        school_other: { title: 'المدرسة / المعلم / أخرى', subtitle: 'من صف دراسي أو مصدر آخر', icon: '🎓' },
      },
      step4Badge: 'الخطوة 4 من 5 · مستواك الحالي',
      step4Title: (t) => `ما مدى معرفتك بالمحادثة في ${t}؟`,
      step4Subtitle: 'هل تريد البدء من الصفر أم يمكنك التحدث قليلاً؟',
      startFromScratchTitle: 'أريد البدء من الصفر تماماً (مبتدئ جديد)',
      startFromScratchDesc: 'ابدأ خطوة بخطوة من الكلمات الأساسية والجمل البسيطة.',
      knowSomeConvTitle: 'يمكنني إجراء بعض المحادثة',
      knowSomeConvDesc: 'أعرف بعض الكلمات والعبارات — اختر مستوى المحادثة أدناه.',
      convLevelQuestionTitle: (t) => `إلى أي مستوى يمكنك التحدث بلغة ${t}؟`,
      convLevelQuestionSub: 'اختر مستواك لنفتح لك الكلمات والمحادثات المناسبة فوراً:',
      convLevels: {
        level_1_basic: {
          badge: 'المستوى 1 · أساسي',
          title: 'يمكنني إجراء محادثة بسيطة وخفيفة',
          desc: 'التحيات، التعارف، والعبارات اليومية القصيرة.',
          unlockPreview: '🔓 فتح أول 25 كلمة و 10 مواضيع محادثة',
          wordsUnlock: 25,
          topicsUnlock: 10,
        },
        level_2_medium: {
          badge: 'المستوى 2 · متوسط',
          title: 'يمكنني التحدث في المواقف اليومية',
          desc: 'السفر، التسوق، المطاعم والمحادثات العامة.',
          unlockPreview: '🔓 فتح أول 60 كلمة و 35 موضوع محادثة',
          wordsUnlock: 60,
          topicsUnlock: 35,
        },
        level_3_full: {
          badge: 'المستوى 3 · متقدم',
          title: 'يمكننا التحدث بطلاقة ومحادثة كاملة',
          desc: 'جمل كاملة، العمل، والمناقشات المتقدمة في كل المواضيع.',
          unlockPreview: '🔓 فتح جميع 100 كلمة و 90 موضوع محادثة',
          wordsUnlock: 100,
          topicsUnlock: 90,
        },
      },
      step5Badge: 'الخطوة 5 من 5 · الهدف والحماس التلقائي',
      step5Title: 'ما هو هدفك اليومي وسبب تعلمك؟',
      step5Subtitle: 'نظام السلسلة التلقائي (Auto-Streak) يحسب أيام نشاطك تلقائياً كل يوم!',
      motivationLabel: 'لماذا تتعلم هذه اللغة؟',
      motivations: {
        travel: { title: 'السفر والإقامة بالخارج', icon: '✈️' },
        career: { title: 'العمل والتطور المهني', icon: '💼' },
        education: { title: 'الدراسة والاختبارات', icon: '🎓' },
        connect: { title: 'التواصل مع الآخرين', icon: '🤝' },
        brain: { title: 'تنمية المهارات والشغف', icon: '🧠' },
      },
      dailyCommitLabel: 'اختر التزامك اليومي:',
      dailyCommitOptions: [
        { minutes: 5, label: '5 دقائق يومياً', tag: 'بداية سهلة', icon: '🌱' },
        { minutes: 10, label: '10 دقائق يومياً', tag: 'منتظم', icon: '🔥' },
        { minutes: 15, label: '15 دقيقة يومياً', tag: 'متحمس', icon: '🚀' },
        { minutes: 20, label: '20 دقيقة يومياً', tag: 'بطل خارق', icon: '👑' },
      ],
      autoStreakPromiseTitle: 'نظام السلسلة التلقائي 100% مفعل',
      autoStreakPromiseDesc: 'بمجرد فرقعة بالون واحد يومياً، يرتفع عداد أيامك تلقائياً وتحتفل عند تحقيق الهدف.',
      continueBtn: 'متابعة ←',
      backBtn: 'رجوع',
      finishToSignInBtn: 'إكمال والانتقال لتسجيل الدخول ✨',
      savePreferencesBtn: 'حفظ الإعدادات وبدء التعلم ✨',
      goalAchievedBadge: '🔥 تم تحقيق هدف السلسلة اليومي!',
      goalAchievedTitle: (days) => `مذهل! لقد حققت هدف ${days} أيام متتالية!`,
      goalAchievedSubtitle: (days, nextGoal) =>
        `لقد تدربت لمدة ${days} أيام متتالية بنجاح! قام النظام التلقائي بترقية هدفك القادم إلى ${nextGoal} يوماً.`,
      goalAchievedRewardLabel: '+25 ⭐ مكافأة تحقيق الهدف',
      goalAchievedAutoNote: '⚡ نظام السلسلة التلقائي: يتحدث تلقائياً مع كل تدريب يومي',
      goalAchievedClaimBtn: 'استلام المكافأة (+25 ⭐) والمتابعة',
      goalAchievedPreviewBtn: '🎉 عرض احتفال الهدف',
    };
  }

  return {
    rtl,
    step1Short: '1. I Speak',
    step2Short: '2. I Learn',
    step3Short: '3. How You Found Us',
    step4Short: '4. Speaking Level',
    step5Short: '5. Daily Goal',
    step3Badge: 'STEP 3 OF 5 · DISCOVERY',
    step3Title: 'Where did you hear about Learning Balloon?',
    step3Subtitle: `Tell us in ${lang.nativeName} how you discovered our voice-powered language studio.`,
    referralOptions: {
      youtube: { title: 'YouTube', subtitle: 'From a video, channel, or Shorts', icon: '📺' },
      tiktok_insta: { title: 'TikTok / Instagram', subtitle: 'From Reels or short social videos', icon: '📱' },
      google: { title: 'Google Search', subtitle: 'Searching for language learning online', icon: '🔍' },
      friends_family: { title: 'Friends or Family', subtitle: 'Recommended by someone I know', icon: '👨‍👩‍👧‍👦' },
      facebook: { title: 'Facebook / WhatsApp', subtitle: 'Shared in a group or community post', icon: '📘' },
      school_other: { title: 'School / Teacher / Other', subtitle: 'Classroom, academy, or elsewhere', icon: '🎓' },
    },
    step4Badge: 'STEP 4 OF 5 · YOUR CONVERSATION LEVEL',
    step4Title: (t) => `How much ${t} conversation do you already know?`,
    step4Subtitle: 'Choose whether you want to start from scratch or already know some conversation.',
    startFromScratchTitle: 'I want to start from scratch (Complete Beginner)',
    startFromScratchDesc: 'Start step-by-step from Word #1 and essential beginner phrases.',
    knowSomeConvTitle: 'I can already have some conversation',
    knowSomeConvDesc: 'I know some words or phrases — select how much conversation you can handle below.',
    convLevelQuestionTitle: (t) => `What level of ${t} conversation can you have?`,
    convLevelQuestionSub: 'Pick your speaking comfort level so we unlock the right stages for you immediately:',
    convLevels: {
      level_1_basic: {
        badge: 'Level 1 · Casual',
        title: 'I can have light, basic conversations',
        desc: 'Greetings, introducing myself, and simple everyday expressions.',
        unlockPreview: '🔓 Unlocks first 25 Words & 10 Conversation Topics',
        wordsUnlock: 25,
        topicsUnlock: 10,
      },
      level_2_medium: {
        badge: 'Level 2 · Intermediate',
        title: 'I can handle everyday conversations',
        desc: 'Travel, shopping, ordering food, and common daily situations.',
        unlockPreview: '🔓 Unlocks first 60 Words & 35 Conversation Topics',
        wordsUnlock: 60,
        topicsUnlock: 35,
      },
      level_3_full: {
        badge: 'Level 3 · Advanced',
        title: 'We can have full, fluent conversations',
        desc: 'Complete discussions, work, and confident speaking across topics.',
        unlockPreview: '🔓 Unlocks all 100 Words & all 90 Conversation Topics',
        wordsUnlock: 100,
        topicsUnlock: 90,
      },
    },
    step5Badge: 'STEP 5 OF 5 · DAILY GOAL & AUTO-STREAK',
    step5Title: 'What is your learning motivation & daily goal?',
    step5Subtitle: 'Pick your daily pace — our 100% Automatic Streak System tracks your practice every day!',
    motivationLabel: 'Why are you learning this language?',
    motivations: {
      travel: { title: 'Travel & Living Abroad', icon: '✈️' },
      career: { title: 'Career & Business Growth', icon: '💼' },
      education: { title: 'Studies & Official Exams', icon: '🎓' },
      connect: { title: 'Talking with Friends & Family', icon: '🤝' },
      brain: { title: 'Brain Training & Personal Joy', icon: '🧠' },
    },
    dailyCommitLabel: 'Choose your daily practice commitment:',
    dailyCommitOptions: [
      { minutes: 5, label: '5 min / day', tag: 'Casual', icon: '🌱' },
      { minutes: 10, label: '10 min / day', tag: 'Regular', icon: '🔥' },
      { minutes: 15, label: '15 min / day', tag: 'Serious', icon: '🚀' },
      { minutes: 20, label: '20 min / day', tag: 'Champion', icon: '👑' },
    ],
    autoStreakPromiseTitle: '100% Automatic Daily Streak System Active',
    autoStreakPromiseDesc: 'Every day you pop a balloon, your streak automatically increments and unlocks milestone rewards!',
    continueBtn: 'Continue →',
    backBtn: 'Back',
    finishToSignInBtn: 'Complete Setup & Continue to Sign In ✨',
    savePreferencesBtn: 'Save Preferences & Start Learning ✨',
    goalAchievedBadge: '🔥 DAILY STREAK GOAL ACHIEVED!',
    goalAchievedTitle: (days) => `Goal Achieved! ${days}-Day Streak Milestone!`,
    goalAchievedSubtitle: (days, nextGoal) =>
      `You reached your ${days}-day streak goal! Our Automatic Streak Engine has upgraded your next milestone target to ${nextGoal} days.`,
    goalAchievedRewardLabel: '+25 ⭐ Streak Milestone Bonus',
    goalAchievedAutoNote: '⚡ 100% Automatic Streak System: Tracks & upgrades your daily goal automatically',
    goalAchievedClaimBtn: 'Claim +25 ⭐ Bonus & Continue',
    goalAchievedPreviewBtn: '🎉 Celebrate Goal',
  };
}
