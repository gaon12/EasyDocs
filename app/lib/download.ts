const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

export const ensureExtension = (name: string, extension: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return `document.${extension}`;
  }
  const lower = trimmed.toLowerCase();
  if (lower.endsWith(`.${extension}`)) {
    return trimmed;
  }
  if (trimmed.includes(".")) {
    return trimmed;
  }
  return `${trimmed}.${extension}`;
};

export const getFileNameFromUrl = (url: string) => {
  if (!url) return "";
  try {
    const parsed = new URL(url, "http://localhost");
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop();
    return lastSegment ? decodeURIComponent(lastSegment) : "";
  } catch {
    return "";
  }
};

export const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

type PrintHtmlOptions = {
  title: string;
  bodyHtml: string;
  styles?: string;
};

const sanitizeStyles = (styles: string): string => {
  const cleaned = styles.replace(/<\/style>/gi, "");
  return cleaned.replace(/javascript:/gi, "");
};

const createPrintDocument = (title: string, bodyHtml: string, styles?: string): string => {
  const doc = document.implementation.createHTMLDocument(escapeHtml(title));

  if (styles) {
    const styleElement = doc.createElement("style");
    styleElement.textContent = sanitizeStyles(styles);
    doc.head.appendChild(styleElement);
  }

  const metaCharset = doc.createElement("meta");
  metaCharset.setAttribute("charset", "utf-8");
  doc.head.insertBefore(metaCharset, doc.head.firstChild);

  doc.body.innerHTML = bodyHtml;

  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
};

export const printHtml = ({ title, bodyHtml, styles }: PrintHtmlOptions) => {
  const printWindow = window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) return false;

  try {
    const documentContent = createPrintDocument(title, bodyHtml, styles);
    printWindow.document.open();
    printWindow.document.write(documentContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return true;
  } catch (error) {
    printWindow.close();
    return false;
  }
};

export const escapeForHtml = escapeHtml;
