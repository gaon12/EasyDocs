import { DocRenderer } from "../../components/doc-renderer";

const EMBEDDING_CONTENT = `# Embedding Documents

Learn how to embed EasyDocs documents on your website.

## Basic Embedding

### Step 1: Open Your Document

Navigate to any document in EasyDocs:

\`\`\`
/viewer/https://example.com/document.pdf
/viewer/arxiv:2301.12345
\`\`\`

### Step 2: Get Embed Code

1. Click the **"Embed Code"** button in the header
2. Copy the generated iframe code
3. Paste it into your HTML

### Example Embed Code

\`\`\`html
<iframe
  src="https://yourdomain.com/embed/..."
  style="width: 100%; height: 600px; border: 0;"
  loading="lazy"
  title="Document - EasyDocs">
</iframe>
\`\`\`

## Customization Options

### Query Parameters

Customize the embedded viewer with URL parameters:

| Parameter | Values | Description |
|-----------|--------|-------------|
| \`toolbar\` | \`0\`, \`1\` | Show/hide PDF toolbar |
| \`header\` | \`0\`, \`1\` | Show/hide document header |
| \`theme\` | \`light\`, \`dark\`, \`system\` | Color theme |
| \`page\` | Number | Start page |

### Examples

**With toolbar and header:**
\`\`\`
/embed/document.pdf?toolbar=1&header=1
\`\`\`

**Dark theme, page 5:**
\`\`\`
/embed/document.pdf?theme=dark&page=5
\`\`\`

**Complete example:**
\`\`\`
/embed/arxiv:2301.12345?toolbar=1&header=1&theme=dark&page=3
\`\`\`

## Responsive Embedding

### Full Width

\`\`\`html
<iframe
  src="..."
  style="width: 100%; height: 600px; border: 0;">
</iframe>
\`\`\`

### Fixed Size

\`\`\`html
<iframe
  src="..."
  width="800"
  height="600"
  style="border: 0;">
</iframe>
\`\`\`

### Aspect Ratio

\`\`\`html
<div style="position: relative; padding-bottom: 75%; height: 0;">
  <iframe
    src="..."
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;">
  </iframe>
</div>
\`\`\`

## Security Considerations

### HTTPS Only

Always use HTTPS URLs for embedded documents:

✅ \`https://example.com/doc.pdf\`
❌ \`http://example.com/doc.pdf\`

### Content Security Policy

If your site has CSP headers, allow EasyDocs:

\`\`\`
Content-Security-Policy: frame-src 'self' https://yourdomain.com;
\`\`\`

### Same-Origin Policy

EasyDocs respects CORS policies. Ensure your documents are publicly accessible.

## Best Practices

### 1. Loading Attribute

Use \`loading="lazy"\` for better performance:

\`\`\`html
<iframe src="..." loading="lazy"></iframe>
\`\`\`

### 2. Title Attribute

Always include a descriptive title for accessibility:

\`\`\`html
<iframe src="..." title="Research Paper - EasyDocs"></iframe>
\`\`\`

### 3. Referrer Policy

Control referrer information:

\`\`\`html
<iframe src="..." referrerpolicy="no-referrer-when-downgrade"></iframe>
\`\`\`

### 4. Fallback Content

Provide fallback for browsers without iframe support:

\`\`\`html
<iframe src="...">
  <p>Your browser does not support iframes.
     <a href="...">View document</a>
  </p>
</iframe>
\`\`\`

## Examples

### Blog Post Embedding

\`\`\`html
<article>
  <h2>My Research Paper</h2>
  <p>Check out my latest research:</p>
  <iframe
    src="https://easydocs.example.com/embed/arxiv:2301.12345?theme=light&page=1"
    style="width: 100%; height: 800px; border: 1px solid #ddd; border-radius: 8px;"
    loading="lazy"
    title="Research Paper - EasyDocs">
  </iframe>
</article>
\`\`\`

### Documentation Site

\`\`\`html
<div class="documentation">
  <h1>User Manual</h1>
  <iframe
    src="https://easydocs.example.com/embed/manual.pdf?toolbar=1&header=1"
    style="width: 100%; height: 100vh; border: 0;"
    title="User Manual - EasyDocs">
  </iframe>
</div>
\`\`\`

## Troubleshooting

### CORS Errors

If you see CORS errors:
- Ensure the document URL is publicly accessible
- Use the \`/embed/\` route instead of \`/viewer/\`
- Check your server's CORS headers

### Blank Iframe

If the iframe appears blank:
- Check browser console for errors
- Verify the document URL is correct
- Ensure HTTPS is used

### Slow Loading

For faster loading:
- Use \`loading="lazy"\`
- Specify explicit width/height
- Consider using thumbnails or preview images

## Next Steps

- **[Download & Export](/guide/download)**: Export options
- **[API Reference](/guide/api)**: Advanced integration
- **[Contributing](/guide/contributing)**: Help improve EasyDocs
`;

export default function EmbeddingPage() {
  return <DocRenderer content={EMBEDDING_CONTENT} />;
}
