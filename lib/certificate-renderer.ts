import { jsPDF } from 'jspdf';
import { LanguageInfo } from './languages';
import {
  CertificateLanguageMode,
  getCertificateCopyForLang,
  getLocalizedCourseLanguageName,
} from './certificate-translations';
import { localizeUsernameForSpokenLanguage } from './conversation-topics-90';
import { generateQRDataURL } from './qr-generator';

export type CertTemplateChoice = 'template_1' | 'template_2' | 'custom';

export const OFFICIAL_CERT_TEMPLATES = [
  {
    id: 'template_1' as const,
    label: 'ڈیزائن 1: رائل بلیو اینڈ گولڈ آرچ (Design 1)',
    url: '/assets/aistudio/cert_template_1_clean.png',
    thumbUrl: '/assets/aistudio/1b02fee5-60f7-462a-a2c4-ac278b56ad5c_5b6b7b66.png',
  },
  {
    id: 'template_2' as const,
    label: 'ڈیزائن 2: گریجویشن کیپ اور کتابیں (Design 2)',
    url: '/assets/aistudio/c86ea49e-1ba5-4a0d-94c8-1685ff5763ee_13842c26.png',
    thumbUrl: '/assets/aistudio/c86ea49e-1ba5-4a0d-94c8-1685ff5763ee_13842c26.png',
  },
  {
    id: 'custom' as const,
    label: 'اپنا اپلوڈ کردہ ڈیزائن (Custom Uploaded)',
    url: '',
    thumbUrl: '',
  },
];

export function formatReadableDate(isoOrDate: string, langCode = 'en'): string {
  const parsed = isoOrDate ? new Date(`${isoOrDate}T12:00:00`) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return isoOrDate || new Date().toISOString().slice(0, 10);
  }
  const localeMap: Record<string, string> = {
    ur: 'ur-PK',
    ar: 'ar-SA',
    ja: 'ja-JP',
    zh: 'zh-CN',
    hi: 'hi-IN',
    fa: 'fa-IR',
    tr: 'tr-TR',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ko: 'ko-KR',
    ru: 'ru-RU',
    pt: 'pt-BR',
    it: 'it-IT',
    bn: 'bn-BD',
    pa: 'pa-IN',
    ps: 'ps-AF',
    id: 'id-ID',
    en: 'en-US',
  };
  const targetLocale = localeMap[langCode] || langCode || 'en-US';
  try {
    return parsed.toLocaleDateString(targetLocale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return parsed.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

export function buildCertificateSerial(
  name: string,
  dateStr: string,
  courseCode = 'EN'
): string {
  const clean = (name || 'STUDENT').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let hash = 0;
  const seed = `${clean}-${dateStr}-${courseCode}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 900000;
  }
  const num = String(100000 + Math.abs(hash)).slice(0, 6);
  const year = new Date().getFullYear();
  return `LB-${courseCode.toUpperCase()}-${year}-${num}`;
}

export interface RenderCertificateParams {
  recipientName: string;
  nativeLang: LanguageInfo;
  targetLang: LanguageInfo;
  certLanguageMode?: CertificateLanguageMode;
  completionDate: string;
  selectedTemplate?: CertTemplateChoice;
  customCertBgDataUrl?: string | null;
  customQrText?: string;
}

export interface RenderCertificateResult {
  canvas: HTMLCanvasElement;
  recipientName: string;
  certNo: string;
  qrDataUrl: string;
  qrPayload: string;
  readableDate: string;
}

export async function renderLocalizedCertificateCanvas(
  params: RenderCertificateParams
): Promise<RenderCertificateResult> {
  const rawRecipientName = (params.recipientName || 'Student Name').trim();
  const {
    nativeLang,
    targetLang,
    certLanguageMode = 'spoken',
    completionDate,
    selectedTemplate = 'template_1',
    customCertBgDataUrl,
    customQrText,
  } = params;

  // Default ('spoken'): the entire certificate is rendered in the language the user speaks (nativeLang)
  const activeLang =
    certLanguageMode === 'course' ? targetLang : nativeLang;
  const primaryCopy = getCertificateCopyForLang(activeLang);
  const spokenCopy = getCertificateCopyForLang(nativeLang);
  const courseCopy = getCertificateCopyForLang(targetLang);

  // Course language name in the active certificate language (with zero mixed-script parentheticals)
  const localizedCourseNamePrimary = getLocalizedCourseLanguageName(
    targetLang,
    activeLang
  );
  const localizedCourseNameSpoken = getLocalizedCourseLanguageName(
    targetLang,
    nativeLang
  );
  const localizedCourseNameTarget = getLocalizedCourseLanguageName(
    targetLang,
    targetLang
  );

  // Localize the student's display name into the active certificate language script
  const localizedRecipientName = localizeUsernameForSpokenLanguage(
    rawRecipientName,
    activeLang,
    rawRecipientName
  );

  const readableDate = formatReadableDate(completionDate, activeLang.code);
  const certNo = buildCertificateSerial(
    rawRecipientName,
    completionDate,
    targetLang.code
  );

  const originUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://learningballoon.com';

  const qrPayload =
    customQrText && customQrText.trim()
      ? customQrText.trim()
      : `${originUrl}/?verify=${encodeURIComponent(
          certNo
        )}&student=${encodeURIComponent(
          rawRecipientName
        )}&course=${encodeURIComponent(
          `${targetLang.nativeName} (${targetLang.name})`
        )}&spoken=${encodeURIComponent(
          `${nativeLang.nativeName} (${nativeLang.name})`
        )}&date=${encodeURIComponent(readableDate)}`;

  const qrDataUrl = await generateQRDataURL(qrPayload, {
    width: 260,
    margin: 1,
    color: {
      dark: '#071A3E',
      light: '#FFFDF7',
    },
  });

  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const templateUrl =
    selectedTemplate === 'custom' && customCertBgDataUrl
      ? customCertBgDataUrl
      : selectedTemplate === 'template_2'
      ? OFFICIAL_CERT_TEMPLATES[1].url
      : OFFICIAL_CERT_TEMPLATES[0].url;

  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = templateUrl;
  });

  const serifFont =
    'Georgia, "Times New Roman", "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Noto Serif JP", "Noto Serif SC", "Noto Serif Devanagari", serif';
  const sansFont =
    'system-ui, -apple-system, "Segoe UI", "Noto Nastaliq Urdu", "Noto Sans Arabic", "Noto Sans JP", "Noto Sans SC", "Noto Sans Devanagari", sans-serif';

  const setDir = (rtl: boolean) => {
    try {
      (ctx as any).direction = rtl ? 'rtl' : 'ltr';
    } catch {}
  };

  // Helper to draw the ornamental gold diamond divider under the student's name
  const drawGoldDiamondDivider = (centerX: number, y: number, halfWidth: number) => {
    ctx.save();
    const lineGrad = ctx.createLinearGradient(
      centerX - halfWidth,
      y,
      centerX + halfWidth,
      y
    );
    lineGrad.addColorStop(0, 'rgba(197, 155, 39, 0.15)');
    lineGrad.addColorStop(0.2, '#C59B27');
    lineGrad.addColorStop(0.5, '#E5B842');
    lineGrad.addColorStop(0.8, '#C59B27');
    lineGrad.addColorStop(1, 'rgba(197, 155, 39, 0.15)');

    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(centerX - halfWidth, y);
    ctx.lineTo(centerX - 24, y);
    ctx.moveTo(centerX + 24, y);
    ctx.lineTo(centerX + halfWidth, y);
    ctx.stroke();

    // Small side dots
    ctx.fillStyle = '#C59B27';
    ctx.beginPath();
    ctx.arc(centerX - 24, y, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 24, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Center gold diamond
    ctx.fillStyle = '#C59B27';
    ctx.beginPath();
    ctx.moveTo(centerX, y - 11);
    ctx.lineTo(centerX + 11, y);
    ctx.lineTo(centerX, y + 11);
    ctx.lineTo(centerX - 11, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFF6B7';
    ctx.beginPath();
    ctx.moveTo(centerX, y - 5);
    ctx.lineTo(centerX + 5, y);
    ctx.lineTo(centerX, y + 5);
    ctx.lineTo(centerX - 5, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Helper to draw rich 3D metallic gold text on dark navy ribbons/banners
  const drawMetallicGoldText = (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    rtl: boolean,
    maxWidth?: number,
    italic = true
  ) => {
    ctx.save();
    setDir(rtl);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${italic ? 'italic ' : ''}800 ${fontSize}px ${serifFont}`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 2.5;

    const grad = ctx.createLinearGradient(
      x,
      y - fontSize * 0.55,
      x,
      y + fontSize * 0.55
    );
    grad.addColorStop(0, '#FFF8C9');
    grad.addColorStop(0.45, '#F5C451');
    grad.addColorStop(1, '#C58616');
    ctx.fillStyle = grad;

    if (maxWidth) {
      ctx.fillText(text, x, y, maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  };

  const lineCertify =
    certLanguageMode === 'bilingual' && nativeLang.code !== targetLang.code
      ? `${spokenCopy.certifyThat}  •  ${courseCopy.certifyThat}`
      : primaryCopy.certifyThat;

  const lineCompleted =
    certLanguageMode === 'bilingual' && nativeLang.code !== targetLang.code
      ? spokenCopy.completedCourseHeading(localizedCourseNameSpoken)
      : primaryCopy.completedCourseHeading(localizedCourseNamePrimary);

  const lineBadge =
    certLanguageMode === 'bilingual' && nativeLang.code !== targetLang.code
      ? courseCopy.courseBadgeTitle(localizedCourseNameTarget)
      : primaryCopy.courseBadgeTitle(localizedCourseNamePrimary);

  const lineDed1 =
    certLanguageMode === 'bilingual' && nativeLang.code !== targetLang.code
      ? spokenCopy.dedicationLine1
      : primaryCopy.dedicationLine1;

  const lineDed2 =
    certLanguageMode === 'bilingual' && nativeLang.code !== targetLang.code
      ? courseCopy.dedicationLine1
      : primaryCopy.dedicationLine2;

  const lineDed3 =
    certLanguageMode === 'bilingual' && nativeLang.code !== targetLang.code
      ? spokenCopy.dedicationLine2
      : primaryCopy.dedicationLine3;

  if (selectedTemplate === 'template_1') {
    // 1. Top Brand Logo Title ("Learning Balloon" or localized equivalent) at x = 790
    ctx.save();
    setDir(primaryCopy.rtl);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#041E42';
    const brandFontSize = primaryCopy.rtl ? 62 : 76;
    ctx.font = `800 ${brandFontSize}px ${serifFont}`;
    ctx.fillText(primaryCopy.brandTitleLine1, 790, 74, 340);
    ctx.fillText(primaryCopy.brandTitleLine2, 790, 140, 340);

    // 2. Top Sub-Tagline ("Learn ♦ Grow ♦ Excel" in spoken language)
    ctx.fillStyle = '#071A3E';
    ctx.font = `italic 700 23px ${serifFont}`;
    ctx.fillText(primaryCopy.subBrandTagline, 790, 194, 335);
    ctx.restore();

    // 3. Top-Right Motto ("Knowledge Today... A Better Tomorrow..." in spoken language)
    ctx.save();
    setDir(primaryCopy.rtl);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#071A3E';
    ctx.font = `italic 700 24px ${serifFont}`;
    ctx.fillText(primaryCopy.topRightMottoLine1, 1218, 114, 290);
    ctx.fillText(primaryCopy.topRightMottoLine2, 1218, 150, 290);
    ctx.restore();

    // 4. Curved Navy Ribbon Banner Title ("Certificate of Course Completion" in spoken language)
    const ribbonFontSize =
      primaryCopy.certificateHeaderTitle.length > 26
        ? 44
        : primaryCopy.rtl
        ? 48
        : 52;
    drawMetallicGoldText(
      primaryCopy.certificateHeaderTitle,
      768,
      278,
      ribbonFontSize,
      primaryCopy.rtl,
      860,
      !primaryCopy.rtl
    );

    // 5. Central Body — Drawn directly over the original world-map watermark & parchment (NO rectangle box!)
    const centerX = 768;
    ctx.save();
    setDir(primaryCopy.rtl);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Line 1: "This is to certify that"
    ctx.fillStyle = '#071A3E';
    ctx.font = `600 30px ${serifFont}`;
    ctx.fillText(lineCertify, centerX, 366, 940);

    // Line 2: Student's Name
    ctx.fillStyle = '#041633';
    const nameFontSize =
      localizedRecipientName.length > 22
        ? 56
        : localizedRecipientName.length > 16
        ? 66
        : 76;
    ctx.font = `${primaryCopy.rtl ? '' : 'italic '}800 ${nameFontSize}px ${serifFont}`;
    ctx.fillText(localizedRecipientName, centerX, 436, 940);

    // Ornamental Gold Diamond Divider
    drawGoldDiamondDivider(centerX, 494, 445);

    // Line 3: "has successfully completed the course titled"
    ctx.fillStyle = '#071A3E';
    ctx.font = `600 26px ${serifFont}`;
    ctx.fillText(lineCompleted, centerX, 532, 950);

    // Line 4: Highlighted Course Title
    ctx.fillStyle = '#041633';
    ctx.font = `800 33px ${serifFont}`;
    ctx.fillText(lineBadge, centerX, 574, 960);

    // Lines 5–7: Dedication Lines
    ctx.fillStyle = '#0F172A';
    ctx.font = `500 22px ${serifFont}`;
    ctx.fillText(lineDed1, centerX, 616, 950);
    ctx.fillText(lineDed2, centerX, 650, 950);
    if (lineDed3) {
      ctx.fillText(lineDed3, centerX, 682, 920);
    }
    ctx.restore();

    // 6. Bottom-Left Date of Issue & Certificate No. (next to the original gold calendar & certificate icons)
    ctx.save();
    setDir(primaryCopy.rtl);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#1E293B';
    ctx.font = `600 20px ${serifFont}`;
    ctx.fillText(primaryCopy.dateLabel, 224, 754, 225);
    ctx.fillStyle = '#041633';
    ctx.font = `800 22px ${serifFont}`;
    ctx.fillText(readableDate, 224, 784, 225);

    ctx.fillStyle = '#1E293B';
    ctx.font = `600 20px ${serifFont}`;
    ctx.fillText(primaryCopy.certNoLabel, 224, 842, 225);
    ctx.restore();

    ctx.save();
    setDir(false);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#041633';
    ctx.font = `800 21px Georgia, serif`;
    ctx.fillText(certNo, 224, 872, 225);
    ctx.restore();

    // 7. Compact Gold-Framed QR Code Badge (placed at x=468, y=744, size=108 so it never touches the Gold Seal's laurel wreath!)
    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => resolve();
      qrImg.src = qrDataUrl;
    });

    const qrBoxX = 466;
    const qrBoxY = 740;
    const qrBoxSize = 110;

    ctx.save();
    ctx.fillStyle = '#FFFDF7';
    ctx.strokeStyle = '#C59B27';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 24, 10);
    ctx.fill();
    ctx.stroke();

    ctx.drawImage(qrImg, qrBoxX + 7, qrBoxY + 6, qrBoxSize - 14, qrBoxSize - 14);

    setDir(primaryCopy.rtl);
    ctx.fillStyle = '#071A3E';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 10px ${sansFont}`;
    ctx.fillText(
      primaryCopy.scanToVerify,
      qrBoxX + qrBoxSize / 2,
      qrBoxY + qrBoxSize + 11,
      qrBoxSize - 8
    );
    ctx.restore();

    // 8. Gold Seal Center Brand Text (above the 5 stars inside the seal)
    ctx.save();
    setDir(primaryCopy.rtl);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FDE68A';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 3;
    ctx.font = `800 20px ${serifFont}`;
    ctx.fillText(primaryCopy.sealBrandLine1, 774, 804, 102);
    ctx.fillText(primaryCopy.sealBrandLine2, 774, 826, 102);
    ctx.restore();

    // 9. Bottom-Right Founder & CEO Block (under Mustafa's handwritten signature and line)
    ctx.save();
    setDir(primaryCopy.rtl);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#041633';
    ctx.font = `800 24px ${serifFont}`;
    ctx.fillText(primaryCopy.founderName, 1245, 826, 220);

    ctx.fillStyle = '#1E293B';
    ctx.font = `600 18px ${serifFont}`;
    ctx.fillText(primaryCopy.founderTitle, 1245, 855, 220);
    ctx.fillText(primaryCopy.founderOrg, 1245, 882, 220);
    ctx.restore();

    // 10. Bottom Navy Footer Banner ("LEARN TODAY ♦ LEAD TOMORROW" in spoken language)
    drawMetallicGoldText(
      primaryCopy.footerMotto,
      768,
      962,
      22,
      primaryCopy.rtl,
      510,
      false
    );
  } else if (selectedTemplate === 'template_2') {
    const centerX = 795;
    ctx.save();
    setDir(primaryCopy.rtl);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const bodyGrad2 = ctx.createLinearGradient(345, 368, 1265, 715);
    bodyGrad2.addColorStop(0, '#F5EFE2');
    bodyGrad2.addColorStop(0.5, '#F8F3E8');
    bodyGrad2.addColorStop(1, '#F5EFE2');
    ctx.fillStyle = bodyGrad2;
    ctx.beginPath();
    ctx.roundRect(345, 368, 920, 346, 18);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.font = `600 28px ${serifFont}`;
    ctx.fillText(lineCertify, centerX, 396, 880);

    ctx.fillStyle = '#071A3E';
    const nameFontSize =
      localizedRecipientName.length > 22
        ? 50
        : localizedRecipientName.length > 16
        ? 60
        : 68;
    ctx.font = `${primaryCopy.rtl ? '' : 'italic '}800 ${nameFontSize}px ${serifFont}`;
    ctx.fillText(localizedRecipientName, centerX, 464, 880);

    drawGoldDiamondDivider(centerX, 514, 390);

    ctx.fillStyle = '#0F172A';
    ctx.font = `600 24px ${serifFont}`;
    ctx.fillText(lineCompleted, centerX, 548, 880);

    ctx.fillStyle = '#071A3E';
    ctx.font = `bold 29px ${serifFont}`;
    ctx.fillText(lineBadge, centerX, 588, 880);

    ctx.fillStyle = '#1E293B';
    ctx.font = `500 20px ${serifFont}`;
    ctx.fillText(lineDed1, centerX, 628, 880);
    ctx.fillText(lineDed2, centerX, 658, 880);
    if (lineDed3) {
      ctx.fillText(lineDed3, centerX, 688, 880);
    }
    ctx.restore();
  } else {
    // Custom uploaded background
    const centerX = 768;
    ctx.save();
    setDir(primaryCopy.rtl);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0F172A';
    ctx.font = `600 26px ${serifFont}`;
    ctx.fillText(lineCertify, centerX, 385, 960);

    ctx.fillStyle = '#071A3E';
    ctx.font = `italic 800 64px ${serifFont}`;
    ctx.fillText(localizedRecipientName, centerX, 450, 960);

    drawGoldDiamondDivider(centerX, 498, 380);

    ctx.fillStyle = '#0F172A';
    ctx.font = `600 24px ${serifFont}`;
    ctx.fillText(lineCompleted, centerX, 536, 960);

    ctx.fillStyle = '#071A3E';
    ctx.font = `bold 28px ${serifFont}`;
    ctx.fillText(lineBadge, centerX, 578, 960);

    ctx.fillStyle = '#1E293B';
    ctx.font = `500 20px ${serifFont}`;
    ctx.fillText(lineDed1, centerX, 622, 960);
    ctx.fillText(lineDed2, centerX, 654, 960);
    ctx.restore();
  }

  return {
    canvas,
    recipientName: localizedRecipientName,
    certNo,
    qrDataUrl,
    qrPayload,
    readableDate,
  };
}

/**
 * Generates the localized Certificate Canvas (in the user's spoken language by default)
 * and immediately triggers a high-resolution landscape PDF download.
 */
export async function downloadLocalizedCertificatePdf(
  params: RenderCertificateParams
): Promise<RenderCertificateResult> {
  const result = await renderLocalizedCertificateCanvas({
    ...params,
    certLanguageMode: params.certLanguageMode || 'spoken',
    selectedTemplate: params.selectedTemplate || 'template_1',
  });

  const imgData = result.canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1536, 1024],
  });
  pdf.addImage(imgData, 'PNG', 0, 0, 1536, 1024);

  const safeFileName =
    (params.recipientName || 'Learner').replace(
      /[^a-zA-Z0-9\u0600-\u06FF\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF_-]/g,
      '_'
    ) || 'Learner';
  pdf.save(
    `Learning_Balloon_${params.nativeLang.code.toUpperCase()}_${params.targetLang.code.toUpperCase()}_Certificate_${safeFileName}.pdf`
  );

  return result;
}
