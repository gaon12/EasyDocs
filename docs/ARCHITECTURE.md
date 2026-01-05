# EasyDocs Architecture

This document describes the architecture and design decisions of EasyDocs.

## 📐 Architecture Overview

EasyDocs follows a modern Next.js App Router architecture with server and client components.

```
┌─────────────────────────────────────────┐
│          User Interface Layer           │
│  (React Client Components + Tailwind)   │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│        Application Layer                │
│  (Next.js App Router + Server Actions)  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Service Layer                   │
│  (File Type Detection, Download Utils)  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│          Data Layer                     │
│  (IndexedDB, External APIs, Proxy)      │
└─────────────────────────────────────────┘
```

## 🎯 Core Principles

### 1. **Separation of Concerns**
- UI components are separate from business logic
- Utilities are modular and reusable
- API routes handle external communication

### 2. **Type Safety**
- TypeScript everywhere
- Strict type checking
- No `any` types in production code

### 3. **Performance**
- Server Components by default
- Client Components only when needed
- Lazy loading for heavy components
- Efficient caching strategies

### 4. **Security First**
- Input sanitization
- Private IP blocking
- CSP headers
- No server-side secrets in client code

## 🏗️ Component Architecture

### Component Hierarchy

```
App Layout
├── ToastContainer (Global notifications)
├── GlobalDropzone (File upload)
└── Page Routes
    ├── Home Page
    ├── Open Page
    ├── Viewer Page
    │   ├── ViewerHeader
    │   │   ├── InfoModal
    │   │   ├── EmbedModal
    │   │   └── DownloadModal
    │   └── Document Viewers
    │       ├── PdfViewer
    │       │   └── PdfToolbar
    │       ├── HitomiViewer
    │       ├── HtmlViewer
    │       ├── MarkdownViewer
    │       └── NotebookViewer
    └── Embed Page
        ├── EmbedHeader
        └── Document Viewers
```

### Component Types

#### 1. **Layout Components**
- [app/layout.tsx](../app/layout.tsx): Root layout with global providers

#### 2. **Page Components**
- [app/viewer/[...doc]/page.tsx](../app/viewer/[...doc]/page.tsx): Main viewer
- [app/embed/[...doc]/page.tsx](../app/embed/[...doc]/page.tsx): Embed viewer

#### 3. **Feature Components**
- [app/components/pdf-viewer.tsx](../app/components/pdf-viewer.tsx): PDF rendering
- [app/components/hitomi-viewer.tsx](../app/components/hitomi-viewer.tsx): Gallery viewer

#### 4. **UI Components**
- [app/components/modals/](../app/components/modals/): Modal dialogs
- [app/components/toast-container.tsx](../app/components/toast-container.tsx): Notifications

## 📚 Library Organization

### Utility Libraries

#### 1. **File Type Detection** ([app/lib/file-type.ts](../app/lib/file-type.ts))
- Detects file types from URLs, content-type, and magic bytes
- Supports: PDF, HTML, Markdown, Jupyter, Text

#### 2. **Download Management** ([app/lib/download.ts](../app/lib/download.ts))
- Triggers browser downloads
- HTML sanitization for print
- Filename handling

#### 3. **Toast System** ([app/lib/toast.ts](../app/lib/toast.ts))
- Event-based notification system
- No external dependencies
- Types: success, error, info, loading

#### 4. **Theme Management** ([app/lib/theme.ts](../app/lib/theme.ts))
- System theme detection
- Theme subscription
- Light/dark mode support

#### 5. **UI Utilities** ([app/lib/ui-utils.ts](../app/lib/ui-utils.ts))
- Theme-dependent class names
- Common UI patterns
- Styling helpers

## 🛣️ Routing Architecture

### Route Structure

```
/                           # Home page
/open                       # Document opener
/viewer/[...doc]            # Main viewer
  ├── /viewer/local/{id}            # Local file
  ├── /viewer/{encodedUrl}          # Remote URL
  └── /viewer/{service}:{id}        # Tagged service
/embed/[...doc]             # Embed viewer (same patterns)
/embed-builder              # Embed code generator
/guide                      # User guide
/library                    # Document library
```

### Dynamic Routes

The `[...doc]` catch-all route handles multiple URL patterns:

```typescript
// Examples:
/viewer/arxiv:2301.12345
/viewer/hitomi:123456
/viewer/local/abc123
/viewer/https%3A%2F%2Fexample.com%2Fdoc.pdf
```

## 🔌 API Architecture

### API Routes

#### 1. **Proxy API** ([app/api/proxy/route.ts](../app/api/proxy/route.ts))
```
GET /api/proxy?url={encoded}
HEAD /api/proxy?url={encoded}
OPTIONS /api/proxy?url={encoded}
```

**Features:**
- CORS headers
- Private IP blocking
- Range requests
- Content-length limits

#### 2. **arXiv PDF Proxy**
```
GET /api/arxiv-pdf?url={pdfUrl}
```

#### 3. **Hitomi Image Proxy**
```
GET /api/hitomi-image?url={imageUrl}&gid={galleryId}
```

### Security Layers

```
Request
  ├── URL Validation
  ├── Private IP Check
  ├── Protocol Check (http/https only)
  ├── Size Limit Check
  ├── Timeout Protection
  └── Response Sanitization
```

## 💾 Data Flow

### Document Loading Flow

```
User Input (URL/File)
  │
  ├─→ File Type Detection
  │     └─→ Magic Byte / Extension / Content-Type
  │
  ├─→ Source Resolution
  │     ├─→ Local File: IndexedDB
  │     ├─→ Remote URL: Proxy API
  │     └─→ Tagged: Service API (arXiv, Hitomi)
  │
  └─→ Viewer Rendering
        ├─→ PDF: @embedpdf/react-pdf-viewer
        ├─→ HTML: Iframe
        ├─→ Markdown: react-markdown
        └─→ Hitomi: Custom Gallery Viewer
```

### Download Flow

```
User Click Download Button
  │
  ├─→ ViewerHeader: Open DownloadModal
  │
  ├─→ User Select Options
  │     └─→ Format, Packaging, etc.
  │
  ├─→ Dispatch ViewerDownloadRequest Event
  │
  ├─→ Viewer Component Handles Event
  │     ├─→ PDF: Use Export Plugin
  │     ├─→ Images: Canvas Rendering
  │     └─→ Original: Direct Download
  │
  └─→ Toast Notification (Success/Error)
```

### Toast Notification Flow

```
Action (Copy, Download, etc.)
  │
  ├─→ Call toast.success() / toast.error()
  │
  ├─→ Dispatch Custom Event
  │
  ├─→ ToastContainer Subscribes
  │     └─→ Update State
  │
  └─→ Render Toast UI
        └─→ Auto-dismiss after duration
```

## 🎨 Styling Architecture

### Tailwind CSS Organization

1. **Global Styles** ([app/globals.css](../app/globals.css))
   - CSS variables
   - Font definitions
   - Base styles

2. **Component Classes**
   - Utility-first approach
   - Dark mode variants
   - Responsive breakpoints

3. **Theme System**
   ```typescript
   const classes = getThemeClasses(isDark);
   // Returns: { header, panel, card, control, ... }
   ```

### Color Palette

```css
Primary: emerald-600 (#059669)
Text (Light): slate-900 (#0f172a)
Text (Dark): slate-100 (#f1f5f9)
Background (Light): white (#ffffff)
Background (Dark): slate-950 (#020617)
```

## 🔐 Security Architecture

### Input Validation

```typescript
// URL Validation
URL.parse() → Private IP Check → Protocol Check → Proceed

// HTML Sanitization
escapeHtml() → Remove javascript: → Remove <script> → Safe Output
```

### CSP Policy

```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline'
style-src 'self' 'unsafe-inline' fonts.googleapis.com
connect-src 'self' https:
img-src 'self' data: blob: https:
```

### Private IP Blocking

Blocks:
- Localhost: `127.0.0.1`, `::1`
- Private IPv4: `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`
- Link-local: `169.254.x.x`, `fe80::`
- Private IPv6: `fc00::/7`, `fd00::/8`

## 📊 State Management

### Local State (useState)
- UI state (modals, inputs)
- Component-specific data

### Event System (Custom Events)
- Toast notifications
- Download requests
- Cross-component communication

### Persistent Storage
- **IndexedDB**: Local file storage
- **LocalStorage**: Recent documents, settings
- **Session**: None (stateless)

## 🚀 Performance Optimizations

### 1. **Code Splitting**
```typescript
// Dynamic imports
const PdfViewer = dynamic(() => import('./pdf-viewer'));
```

### 2. **Memoization**
```typescript
const embedUrl = useMemo(() => {
  return embedTarget ? `${origin}${embedTarget}` : "";
}, [embedTarget, origin]);
```

### 3. **Callback Optimization**
```typescript
const handleDownload = useCallback((detail) => {
  requestViewerDownload(detail);
}, []);
```

### 4. **Asset Optimization**
- Next.js font optimization
- Image lazy loading
- Blob URL management

## 🧪 Testing Strategy

### 1. **Type Checking**
```bash
npm run type-check
```

### 2. **Linting**
```bash
npm run lint
```

### 3. **Manual Testing**
- Browser compatibility
- Responsive design
- Accessibility
- Keyboard navigation

## 📈 Future Architecture Considerations

### Potential Improvements

1. **State Management**
   - Consider Zustand/Jotai for complex state
   - Redux if needed for time-travel debugging

2. **Testing**
   - Add unit tests (Vitest)
   - E2E tests (Playwright)
   - Visual regression tests

3. **Performance**
   - Service Worker for offline support
   - Progressive Web App (PWA)
   - Virtual scrolling for large galleries

4. **Features**
   - Real-time collaboration
   - Annotations and comments
   - Version history

## 🤝 Contributing to Architecture

When proposing architectural changes:

1. Open a discussion first
2. Explain the problem and solution
3. Consider backward compatibility
4. Update this document
5. Add migration guide if needed

---

Last updated: 2025-01-05
