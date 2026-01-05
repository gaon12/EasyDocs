/**
 * Internationalization (i18n) system for EasyDocs
 * Supports: English (en), Korean (ko), Japanese (ja)
 */

export type Locale = "en" | "ko" | "ja";

export const SUPPORTED_LOCALES: Locale[] = ["en", "ko", "ja"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
};

export type TranslationKeys = {
  // Common
  "common.loading": string;
  "common.error": string;
  "common.success": string;
  "common.cancel": string;
  "common.close": string;
  "common.copy": string;
  "common.download": string;
  "common.open": string;

  // Header
  "header.viewer": string;
  "header.info": string;
  "header.embed": string;
  "header.download": string;
  "header.change": string;

  // Document
  "document.local": string;
  "document.remote": string;
  "document.tagged": string;

  // Embed
  "embed.title": string;
  "embed.description": string;
  "embed.note": string;
  "embed.noteText": string;
  "embed.iframeCode": string;
  "embed.embedUrl": string;
  "embed.copying": string;

  // Download
  "download.title": string;
  "download.description": string;
  "download.pdf": string;
  "download.pdfDescription": string;
  "download.images": string;
  "download.imagesDescription": string;
  "download.original": string;
  "download.savePdf": string;
  "download.downloadPdf": string;
  "download.downloadImages": string;
  "download.format": string;
  "download.packaging": string;
  "download.combinePages": string;
  "download.splitNote": string;

  // Formats
  "format.png": string;
  "format.pngDesc": string;
  "format.jpg": string;
  "format.jpgDesc": string;
  "format.webp": string;
  "format.webpDesc": string;
  "format.avif": string;
  "format.avifDesc": string;

  // Packaging
  "packaging.zip": string;
  "packaging.zipDesc": string;
  "packaging.single": string;
  "packaging.singleDesc": string;

  // Toast
  "toast.copySuccess": string;
  "toast.copyError": string;
  "toast.downloadStarted": string;
  "toast.downloadSuccess": string;
  "toast.downloadError": string;
  "toast.downloadInProgress": string;
  "toast.noImages": string;
  "toast.printDialog": string;

  // Info
  "info.title": string;
  "info.description": string;
  "info.source": string;
  "info.noMetadata": string;
};

const translations: Record<Locale, TranslationKeys> = {
  en: {
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.copy": "Copy",
    "common.download": "Download",
    "common.open": "Open",

    "header.viewer": "Viewer",
    "header.info": "Info",
    "header.embed": "Embed Code",
    "header.download": "Download",
    "header.change": "Change",

    "document.local": "Local file",
    "document.remote": "Remote URL",
    "document.tagged": "Tagged",

    "embed.title": "Embed Code",
    "embed.description": "Copy and paste this code into your website",
    "embed.note": "Note:",
    "embed.noteText":
      "Only public URLs can be embedded. Local files cannot be embedded as they don't have a public URL.",
    "embed.iframeCode": "Iframe Code",
    "embed.embedUrl": "Embed URL:",
    "embed.copying": "Copying...",

    "download.title": "Download options",
    "download.description": "Choose a format to export.",
    "download.pdf": "PDF",
    "download.pdfDescription": "Download the original PDF file.",
    "download.images": "Images",
    "download.imagesDescription": "Export pages as images.",
    "download.original": "Download original",
    "download.savePdf": "Save as PDF",
    "download.downloadPdf": "Download PDF",
    "download.downloadImages": "Download images",
    "download.format": "Image format",
    "download.packaging": "Packaging",
    "download.combinePages": "Combine all pages into one image.",
    "download.splitNote": "Oversized images are split automatically to fit format limits.",

    "format.png": "PNG",
    "format.pngDesc": "Lossless, larger files.",
    "format.jpg": "JPG",
    "format.jpgDesc": "Smaller, lossy.",
    "format.webp": "WebP",
    "format.webpDesc": "Modern, compact.",
    "format.avif": "AVIF",
    "format.avifDesc": "High compression.",

    "packaging.zip": "Zip bundle",
    "packaging.zipDesc": "Single download.",
    "packaging.single": "Individual files",
    "packaging.singleDesc": "Multiple downloads.",

    "toast.copySuccess": "Embed code copied to clipboard!",
    "toast.copyError": "Failed to copy to clipboard",
    "toast.downloadStarted": "PDF download started",
    "toast.downloadSuccess": "Successfully downloaded {count} images!",
    "toast.downloadError": "Download failed. Please try again.",
    "toast.downloadInProgress": "Download already in progress",
    "toast.noImages": "No images to download",
    "toast.printDialog": "Opening print dialog...",

    "info.title": "Document info",
    "info.description": "Details for this tagged source",
    "info.source": "Source",
    "info.noMetadata": "No additional metadata available.",
  },

  ko: {
    "common.loading": "로딩 중...",
    "common.error": "오류",
    "common.success": "성공",
    "common.cancel": "취소",
    "common.close": "닫기",
    "common.copy": "복사",
    "common.download": "다운로드",
    "common.open": "열기",

    "header.viewer": "뷰어",
    "header.info": "정보",
    "header.embed": "임베드 코드",
    "header.download": "다운로드",
    "header.change": "변경",

    "document.local": "로컬 파일",
    "document.remote": "원격 URL",
    "document.tagged": "태그됨",

    "embed.title": "임베드 코드",
    "embed.description": "이 코드를 웹사이트에 복사하여 붙여넣으세요",
    "embed.note": "참고:",
    "embed.noteText":
      "공개 URL만 임베드할 수 있습니다. 로컬 파일은 공개 URL이 없어 임베드할 수 없습니다.",
    "embed.iframeCode": "Iframe 코드",
    "embed.embedUrl": "임베드 URL:",
    "embed.copying": "복사 중...",

    "download.title": "다운로드 옵션",
    "download.description": "내보낼 형식을 선택하세요.",
    "download.pdf": "PDF",
    "download.pdfDescription": "원본 PDF 파일을 다운로드합니다.",
    "download.images": "이미지",
    "download.imagesDescription": "페이지를 이미지로 내보냅니다.",
    "download.original": "원본 다운로드",
    "download.savePdf": "PDF로 저장",
    "download.downloadPdf": "PDF 다운로드",
    "download.downloadImages": "이미지 다운로드",
    "download.format": "이미지 형식",
    "download.packaging": "패키징",
    "download.combinePages": "모든 페이지를 하나의 이미지로 결합합니다.",
    "download.splitNote": "큰 이미지는 형식 제한에 맞게 자동으로 분할됩니다.",

    "format.png": "PNG",
    "format.pngDesc": "무손실, 큰 파일.",
    "format.jpg": "JPG",
    "format.jpgDesc": "작은 크기, 손실 압축.",
    "format.webp": "WebP",
    "format.webpDesc": "현대적, 압축률 우수.",
    "format.avif": "AVIF",
    "format.avifDesc": "높은 압축률.",

    "packaging.zip": "Zip 번들",
    "packaging.zipDesc": "단일 다운로드.",
    "packaging.single": "개별 파일",
    "packaging.singleDesc": "여러 다운로드.",

    "toast.copySuccess": "임베드 코드가 클립보드에 복사되었습니다!",
    "toast.copyError": "클립보드 복사 실패",
    "toast.downloadStarted": "PDF 다운로드 시작됨",
    "toast.downloadSuccess": "{count}개 이미지 다운로드 완료!",
    "toast.downloadError": "다운로드 실패. 다시 시도해주세요.",
    "toast.downloadInProgress": "이미 다운로드 진행 중",
    "toast.noImages": "다운로드할 이미지 없음",
    "toast.printDialog": "인쇄 대화상자 열기...",

    "info.title": "문서 정보",
    "info.description": "태그된 소스의 세부정보",
    "info.source": "소스",
    "info.noMetadata": "추가 메타데이터가 없습니다.",
  },

  ja: {
    "common.loading": "読み込み中...",
    "common.error": "エラー",
    "common.success": "成功",
    "common.cancel": "キャンセル",
    "common.close": "閉じる",
    "common.copy": "コピー",
    "common.download": "ダウンロード",
    "common.open": "開く",

    "header.viewer": "ビューア",
    "header.info": "情報",
    "header.embed": "埋め込みコード",
    "header.download": "ダウンロード",
    "header.change": "変更",

    "document.local": "ローカルファイル",
    "document.remote": "リモートURL",
    "document.tagged": "タグ付き",

    "embed.title": "埋め込みコード",
    "embed.description": "このコードをウェブサイトにコピー＆ペーストしてください",
    "embed.note": "注意:",
    "embed.noteText":
      "公開URLのみ埋め込み可能です。ローカルファイルは公開URLがないため埋め込みできません。",
    "embed.iframeCode": "iframeコード",
    "embed.embedUrl": "埋め込みURL:",
    "embed.copying": "コピー中...",

    "download.title": "ダウンロードオプション",
    "download.description": "エクスポート形式を選択してください。",
    "download.pdf": "PDF",
    "download.pdfDescription": "元のPDFファイルをダウンロードします。",
    "download.images": "画像",
    "download.imagesDescription": "ページを画像としてエクスポートします。",
    "download.original": "オリジナルをダウンロード",
    "download.savePdf": "PDFとして保存",
    "download.downloadPdf": "PDFダウンロード",
    "download.downloadImages": "画像をダウンロード",
    "download.format": "画像形式",
    "download.packaging": "パッケージング",
    "download.combinePages": "すべてのページを1つの画像に結合します。",
    "download.splitNote": "大きな画像は形式の制限に合わせて自動的に分割されます。",

    "format.png": "PNG",
    "format.pngDesc": "ロスレス、大きなファイル。",
    "format.jpg": "JPG",
    "format.jpgDesc": "小さいサイズ、非可逆圧縮。",
    "format.webp": "WebP",
    "format.webpDesc": "モダン、コンパクト。",
    "format.avif": "AVIF",
    "format.avifDesc": "高圧縮率。",

    "packaging.zip": "Zipバンドル",
    "packaging.zipDesc": "シングルダウンロード。",
    "packaging.single": "個別ファイル",
    "packaging.singleDesc": "複数ダウンロード。",

    "toast.copySuccess": "埋め込みコードをクリップボードにコピーしました!",
    "toast.copyError": "クリップボードへのコピーに失敗しました",
    "toast.downloadStarted": "PDFダウンロード開始",
    "toast.downloadSuccess": "{count}枚の画像をダウンロードしました!",
    "toast.downloadError": "ダウンロードに失敗しました。もう一度お試しください。",
    "toast.downloadInProgress": "既にダウンロード進行中",
    "toast.noImages": "ダウンロードする画像がありません",
    "toast.printDialog": "印刷ダイアログを開いています...",

    "info.title": "ドキュメント情報",
    "info.description": "このタグ付きソースの詳細",
    "info.source": "ソース",
    "info.noMetadata": "追加のメタデータはありません。",
  },
};

/**
 * Get the current locale from browser or localStorage
 */
export const getLocale = (): Locale => {
  if (typeof window === "undefined") return "en";

  const stored = localStorage.getItem("easydocs:locale");
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }

  const browserLang = navigator.language.split("-")[0];
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  return "en";
};

/**
 * Set the current locale
 */
export const setLocale = (locale: Locale) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("easydocs:locale", locale);
  window.dispatchEvent(new CustomEvent("localechange", { detail: locale }));
};

/**
 * Subscribe to locale changes
 */
export const subscribeToLocaleChange = (callback: (locale: Locale) => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<Locale>;
    callback(customEvent.detail);
  };

  window.addEventListener("localechange", handler);
  return () => window.removeEventListener("localechange", handler);
};

/**
 * Get translation for a key
 */
export const t = (key: keyof TranslationKeys, locale?: Locale, replacements?: Record<string, string | number>): string => {
  const currentLocale = locale || getLocale();
  let text = translations[currentLocale][key];

  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{${placeholder}}`, String(value));
    });
  }

  return text;
};

/**
 * Get all translations for current locale
 */
export const getTranslations = (locale?: Locale): TranslationKeys => {
  const currentLocale = locale || getLocale();
  return translations[currentLocale];
};
