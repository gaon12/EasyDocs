import { DocRenderer } from "../../components/doc-renderer";

const ARCHITECTURE_CONTENT = `# Architecture

Technical overview of EasyDocs architecture.

## Technology Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS

### Libraries
- **@embedpdf/react-pdf-viewer**: PDF rendering
- **React Markdown**: Markdown rendering
- **fflate**: ZIP compression
- **remark-gfm**: GitHub Flavored Markdown
- **rehype-highlight**: Syntax highlighting

## Project Structure

\`\`\`
app/
├── api/              # API routes
│   ├── proxy/       # CORS proxy
│   ├── arxiv-pdf/   # arXiv proxy
│   └── hitomi-image/# Hitomi proxy
├── components/      # React components
│   └── modals/     # Modal components
├── lib/            # Utilities
├── viewer/         # Main viewer
├── embed/          # Embed viewer
└── guide/          # Documentation
\`\`\`

## Key Features

### File Type Detection
Multiple strategies:
1. URL extension
2. Content-Type header
3. Magic byte detection
4. HEAD request

### CORS Proxy
- Blocks private IPs
- 150MB size limit
- 30s timeout
- Range request support

### Local Storage
- IndexedDB for files
- LocalStorage for settings
- No server upload

### Security
- CSP headers
- XSS prevention
- Private IP blocking
- Input sanitization

## Data Flow

\`\`\`
User → URL/File → File Type Detection
                ↓
         Source Resolution
         ├─ Local: IndexedDB
         ├─ Remote: Proxy API
         └─ Tagged: Service API
                ↓
         Viewer Component
         ├─ PDF Viewer
         ├─ HTML Viewer
         ├─ Markdown Viewer
         └─ Hitomi Viewer
\`\`\`

## For detailed architecture, see [ARCHITECTURE.md](https://github.com/gaon12/EasyDocs/blob/main/docs/ARCHITECTURE.md)
`;

export default function ArchitecturePage() {
  return <DocRenderer content={ARCHITECTURE_CONTENT} />;
}
