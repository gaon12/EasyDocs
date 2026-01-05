import { DocRenderer } from "../../components/doc-renderer";

const API_CONTENT = `# API Reference

Advanced API documentation for developers.

## Proxy API

### Endpoint

\`\`\`
GET /api/proxy?url={encodedUrl}
HEAD /api/proxy?url={encodedUrl}
OPTIONS /api/proxy?url={encodedUrl}
\`\`\`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`url\` | string | Yes | Encoded document URL |

### Headers

**Request:**
- \`Range\`: Byte range (optional)

**Response:**
- \`Content-Type\`: Document MIME type
- \`Content-Length\`: Document size
- \`Access-Control-Allow-Origin\`: *
- \`Access-Control-Allow-Private-Network\`: true

### Example

\`\`\`javascript
const url = 'https://example.com/document.pdf';
const encodedUrl = encodeURIComponent(url);

fetch(\`/api/proxy?url=\${encodedUrl}\`)
  .then(res => res.blob())
  .then(blob => {
    // Use blob
  });
\`\`\`

### Limits

- Max size: 150 MB
- Timeout: 30 seconds
- Cache: 5 minutes

### Security

Blocked:
- Private IPs (10.x, 192.168.x, etc.)
- Localhost (127.0.0.1, ::1)
- Link-local addresses
- Redirects

## Tagged Services

### arXiv

\`\`\`
/viewer/arxiv:{paper_id}
/viewer/arxiv/{paper_id}
\`\`\`

Example:
\`\`\`
/viewer/arxiv:2301.12345
\`\`\`

### Hitomi

\`\`\`
/viewer/hitomi:{gallery_id}
/viewer/hitomi/{gallery_id}
\`\`\`

Example:
\`\`\`
/viewer/hitomi:123456
\`\`\`

## Download Events

### Request Download

\`\`\`typescript
import { requestViewerDownload } from '@/app/lib/viewer-download';

// Download PDF
requestViewerDownload({ kind: 'pdf' });

// Download original
requestViewerDownload({ kind: 'original' });

// Download images
requestViewerDownload({
  kind: 'images',
  format: 'png',
  packaging: 'zip',
  split: true,
  combine: false
});
\`\`\`

### Subscribe to Downloads

\`\`\`typescript
import { subscribeToViewerDownload } from '@/app/lib/viewer-download';

const unsubscribe = subscribeToViewerDownload((request) => {
  if (request.kind === 'pdf') {
    // Handle PDF download
  }
});

// Cleanup
return unsubscribe;
\`\`\`

## Toast Notifications

\`\`\`typescript
import { toast } from '@/app/lib/toast';

// Success
toast.success('Operation completed!');

// Error
toast.error('Something went wrong');

// Info
toast.info('Processing...');

// Loading (persistent)
const id = toast.loading('Downloading...');
// Later dismiss:
dismissToast(id);
\`\`\`

## i18n (Internationalization)

\`\`\`typescript
import { t, setLocale } from '@/app/lib/i18n';

// Get translation
t('common.loading'); // "Loading..."

// With replacements
t('toast.downloadSuccess', undefined, { count: 10 });
// "Successfully downloaded 10 images!"

// Change language
setLocale('ko'); // Korean
setLocale('ja'); // Japanese
setLocale('en'); // English
\`\`\`

## Theme Management

\`\`\`typescript
import { getSystemTheme, subscribeToSystemTheme } from '@/app/lib/theme';

// Get current theme
const theme = getSystemTheme(); // 'light' | 'dark'

// Subscribe to changes
const unsubscribe = subscribeToSystemTheme((theme) => {
  console.log('Theme changed:', theme);
});
\`\`\`

## File Type Detection

\`\`\`typescript
import { getFileType, resolveRemoteFileType } from '@/app/lib/file-type';

// From URL
const type = getFileType('https://example.com/doc.pdf');
// Returns: 'pdf' | 'html' | 'markdown' | 'text' | 'ipynb' | 'unknown'

// Remote detection (async)
const remoteType = await resolveRemoteFileType('https://example.com/doc');
\`\`\`

## TypeScript Types

\`\`\`typescript
import type { FileType } from '@/app/lib/file-type';
import type { Locale } from '@/app/lib/i18n';
import type { ViewerDownloadRequest } from '@/app/lib/viewer-download';
\`\`\`

## Rate Limits

No rate limits currently, but may be added in future.

## Support

- [GitHub Issues](https://github.com/gaon12/EasyDocs/issues)
- [API Documentation](https://github.com/gaon12/EasyDocs/blob/main/docs/API.md)
`;

export default function APIPage() {
  return <DocRenderer content={API_CONTENT} />;
}
