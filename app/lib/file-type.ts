export type FileType = 'pdf' | 'html' | 'markdown' | 'text' | 'ipynb' | 'unknown';

const EXTENSION_MAP: Record<string, FileType> = {
  pdf: 'pdf',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  markdown: 'markdown',
  ipynb: 'ipynb',
  txt: 'text',
  text: 'text',
};

const CONTENT_TYPE_MAP: Record<string, FileType> = {
  'application/pdf': 'pdf',
  'text/html': 'html',
  'text/markdown': 'markdown',
  'text/plain': 'text',
  'application/x-ipynb+json': 'ipynb',
};

const resolveTypeFromToken = (value: string): FileType | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const token = normalized.startsWith('.') ? normalized.slice(1) : normalized;
  if (EXTENSION_MAP[token]) return EXTENSION_MAP[token];
  const contentType = token.split(';')[0].trim();
  if (CONTENT_TYPE_MAP[contentType]) return CONTENT_TYPE_MAP[contentType];
  return null;
};

const resolveTypeFromValue = (value: string): FileType | null => {
  const tokenType = resolveTypeFromToken(value);
  if (tokenType) return tokenType;
  const match = value
    .toLowerCase()
    .match(/\.(pdf|html?|md|markdown|ipynb|txt|text)(?:$|[/?#&])/);
  if (match) {
    return EXTENSION_MAP[match[1]];
  }
  return null;
};

export function getFileType(filename: string): FileType {
  const raw = filename ?? '';
  const cleaned = raw.split('#')[0]?.split('?')[0] ?? '';
  const lastSegment = cleaned.split('/').pop() ?? cleaned;
  const hasDot = lastSegment.includes('.');
  const ext = hasDot ? lastSegment.toLowerCase().split('.').pop() || '' : '';
  const direct = ext ? resolveTypeFromToken(ext) : null;
  if (direct) return direct;

  const pathMatch = cleaned
    .toLowerCase()
    .match(/\.(pdf|html?|md|markdown|ipynb|txt|text)(?:$|[\\/])/);
  if (pathMatch) {
    return EXTENSION_MAP[pathMatch[1]];
  }

  const queryIndex = raw.indexOf('?');
  if (queryIndex !== -1) {
    const query = raw.slice(queryIndex + 1).split('#')[0];
    if (query) {
      try {
        const params = new URLSearchParams(query);
        for (const [key, value] of params.entries()) {
          const resolved =
            resolveTypeFromValue(value) ?? resolveTypeFromToken(key);
          if (resolved) return resolved;
        }
      } catch {
        // Ignore invalid query strings.
      }
    }
  }

  return 'unknown';
}

export const resolveFileType = (...candidates: string[]): FileType => {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const resolved = getFileType(candidate);
    if (resolved !== 'unknown') return resolved;
  }
  return 'unknown';
};

export function getAcceptedFileTypes(): string {
  return 'application/pdf,application/x-ipynb+json,.html,.htm,.md,.markdown,.ipynb,.txt,.text';
}

const isHttpUrl = (value: string) =>
  value.startsWith('https://') || value.startsWith('http://');

const parseContentDispositionFilename = (header: string | null): string => {
  if (!header) return '';
  const value = header.trim();
  if (!value) return '';

  const filenameStarMatch = value.match(/filename\*\s*=\s*([^']*)''([^;]+)/i);
  if (filenameStarMatch) {
    const encoded = filenameStarMatch[2]?.trim() ?? '';
    if (!encoded) return '';
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }

  const filenameMatch = value.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i);
  if (!filenameMatch) return '';
  const filename = (filenameMatch[1] ?? filenameMatch[2] ?? '').trim();
  if (!filename) return '';
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
};

const sniffFileType = (bytes: Uint8Array): FileType => {
  if (bytes.length >= 5) {
    const signature = String.fromCharCode(
      bytes[0] ?? 0,
      bytes[1] ?? 0,
      bytes[2] ?? 0,
      bytes[3] ?? 0,
      bytes[4] ?? 0,
    );
    if (signature === '%PDF-') return 'pdf';
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const trimmed = text.replace(/^\uFEFF/, '').trimStart().toLowerCase();
    if (
      trimmed.startsWith('<!doctype html') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<head') ||
      trimmed.startsWith('<meta')
    ) {
      return 'html';
    }
    if (
      trimmed.startsWith('{') &&
      trimmed.includes('"nbformat"') &&
      trimmed.includes('"cells"')
    ) {
      return 'ipynb';
    }
  } catch {
    // Ignore decoding failures.
  }

  return 'unknown';
};

const readFirstBytes = async (
  response: Response,
  limit: number,
): Promise<Uint8Array> => {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < limit) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.byteLength;
      if (total >= limit) break;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // Ignore cancellation failures.
    }
  }

  if (!chunks.length) return new Uint8Array();

  const output = new Uint8Array(Math.min(total, limit));
  let offset = 0;
  for (const chunk of chunks) {
    if (offset >= output.length) break;
    const remaining = output.length - offset;
    const slice = chunk.subarray(0, remaining);
    output.set(slice, offset);
    offset += slice.byteLength;
  }
  return output;
};

export async function resolveRemoteFileType(url: string): Promise<FileType> {
  if (!isHttpUrl(url)) return 'unknown';

  const resolveFromResponse = (response: Response): FileType => {
    const fromDisposition = getFileType(
      parseContentDispositionFilename(response.headers.get('content-disposition')),
    );
    if (fromDisposition !== 'unknown') return fromDisposition;

    const contentType = response.headers.get('content-type');
    const fromContentType = contentType ? resolveTypeFromToken(contentType) : null;
    if (fromContentType) return fromContentType;

    const fromFinalUrl = response.url ? getFileType(response.url) : 'unknown';
    if (fromFinalUrl !== 'unknown') return fromFinalUrl;

    return 'unknown';
  };

  try {
    const headResponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
    });
    const headResolved = resolveFromResponse(headResponse);
    if (headResolved !== 'unknown') return headResolved;
  } catch {
    // Ignore HEAD errors and fall back to GET.
  }

  try {
    const getResponse = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-2047' },
      redirect: 'follow',
      cache: 'no-store',
    });

    const resolved = resolveFromResponse(getResponse);
    if (resolved !== 'unknown') return resolved;

    const bytes = await readFirstBytes(getResponse, 2048);
    return sniffFileType(bytes);
  } catch {
    return 'unknown';
  }
}
