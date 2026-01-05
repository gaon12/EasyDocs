import { DocRenderer } from "../../components/doc-renderer";

const USAGE_CONTENT = `# Usage Guide

Complete guide to using EasyDocs for viewing and managing documents.

## Opening Documents

### URL Input
1. Navigate to [/open](/open)
2. Paste your document URL
3. Click "Open Document"

Supported URL formats:
\`\`\`
https://example.com/document.pdf
https://arxiv.org/pdf/2301.12345.pdf
arxiv:2301.12345
hitomi:123456
\`\`\`

### Drag & Drop
Simply drag any supported file onto the homepage or /open page.

Supported formats:
- PDF (.pdf)
- HTML (.html, .htm)
- Markdown (.md, .markdown)
- Jupyter Notebooks (.ipynb)
- Plain Text (.txt)

### Local Files
Files are stored securely in your browser's IndexedDB:
- No server upload required
- Persistent across sessions
- Automatic cleanup

## Viewer Features

### Navigation
- **PDF**: Use arrow keys, mouse wheel, or page navigation buttons
- **HTML/Markdown**: Scroll normally, use page parameter for bookmarks
- **Jupyter**: Cell-by-cell navigation

### Search (PDF only)
1. Press \`Ctrl+Shift+F\` or click search icon
2. Type your query
3. Navigate results with arrow buttons
4. Highlights appear in real-time

### Sidebar (PDF only)
- **Thumbnails**: Visual page preview
- **Outline**: Document structure navigation
- **Search**: Dedicated search panel

Toggle with:
- \`Ctrl+Shift+T\`: Thumbnails
- Click toolbar icons

## Parameters

### Page Parameter
Jump to a specific page:
\`\`\`
/viewer/document.pdf?page=5
/embed/document.pdf?page=10
\`\`\`

### Embed Parameters
Customize embedded viewers:
\`\`\`
?toolbar=1      # Show PDF toolbar
?header=1       # Show document header
?theme=dark     # Set theme (light/dark/system)
?page=3         # Start page
\`\`\`

Example:
\`\`\`
/embed/document.pdf?toolbar=1&header=1&theme=dark&page=5
\`\`\`

## Tagged Services

### arXiv
View academic papers directly:
\`\`\`
/viewer/arxiv:2301.12345
/viewer/arxiv/2301.12345
\`\`\`

Features:
- Automatic PDF fetching
- Metadata display (authors, abstract, categories)
- Direct link to arXiv.org

### Hitomi
View image galleries:
\`\`\`
/viewer/hitomi:123456
/viewer/hitomi/123456
\`\`\`

Features:
- Multi-page gallery viewer
- Image export options
- High-quality image loading

## Themes

EasyDocs supports three theme modes:
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes
- **System**: Matches your OS preference

Change theme in embed URLs:
\`\`\`
?theme=light
?theme=dark
?theme=system
\`\`\`

## Tips & Tricks

### Bookmarking
Save specific pages:
\`\`\`
/viewer/document.pdf?page=42
\`\`\`

### Sharing
Use /embed routes for sharing:
- Cleaner URL
- Customizable appearance
- Optimized for iframes

### Performance
- Large PDFs load progressively
- Images use lazy loading
- Local files use browser cache

## Troubleshooting

### PDF Not Loading
- Check if URL is publicly accessible
- Verify file format (must be valid PDF)
- Try using proxy: \`/viewer/https%3A%2F%2Fexample.com%2Fdoc.pdf\`

### CORS Errors
- Use /embed route instead of /viewer
- Check if server allows cross-origin requests
- Consider using proxy parameter

### Local Files Not Persisting
- Check browser storage settings
- Ensure IndexedDB is enabled
- Clear site data if corrupted

## Next Steps

- **[Embedding](/guide/embedding)**: Embed documents on your website
- **[Download & Export](/guide/download)**: Export documents
- **[Keyboard Shortcuts](/guide/shortcuts)**: Power user tips
`;

export default function UsagePage() {
  return <DocRenderer content={USAGE_CONTENT} />;
}
