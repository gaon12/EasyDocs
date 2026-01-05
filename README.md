# 📚 EasyDocs

> A modern, clean document viewer with embed-ready links. View PDFs, HTML, Markdown, Jupyter notebooks, and more—all in one place.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## ✨ Features

### 🎯 Core Features
- **Multi-format Support**: PDF, HTML, Markdown, Jupyter Notebooks (.ipynb), Plain Text
- **Embed Anywhere**: Generate iframe code for any public document
- **Zero Setup**: Drag & drop files or paste URLs—no installation required
- **Dark Mode**: Automatic system theme detection with seamless switching
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile

### 🚀 Advanced Features
- **Local File Support**: Upload and view files with IndexedDB persistence
- **Tagged Sources**: Direct integration with arXiv and Hitomi
- **Download Options**: Export to PDF, images (PNG/JPG/WebP/AVIF), or original format
- **Search & Navigate**: Full-text search in PDFs with keyboard shortcuts
- **Proxy Support**: Bypass CORS restrictions for remote resources
- **Real-time Feedback**: Toast notifications for all user actions

### 🔒 Security
- **Private Network Protection**: Blocks access to private IPs and localhost
- **Content Security Policy**: Strict CSP headers to prevent XSS
- **Input Sanitization**: All user inputs are escaped and validated
- **HTTPS Enforcement**: Upgrade insecure requests automatically
- **No Tracking**: Privacy-focused with no analytics or cookies

## 🎬 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm/yarn
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/gaon12/EasyDocs.git
cd easydocs

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start viewing documents!

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📖 Usage Guide

### Viewing Documents

#### Method 1: Drag & Drop
Simply drag and drop any supported file onto the home page.

#### Method 2: Paste URL
1. Go to the home page
2. Paste a document URL
3. Click "Open"

#### Method 3: Tagged Sources
Use shortcuts for popular sources:
```
arxiv:2301.12345    # arXiv papers
hitomi:123456       # Hitomi galleries
```

### Embedding Documents

1. Open any document in the viewer
2. Click the **"Embed Code"** button
3. Copy the generated iframe code
4. Paste into your website

Example embed code:
```html
<iframe
  src="https://yourdomain.com/embed/..."
  style="width: 100%; height: 600px; border: 0;"
  loading="lazy"
  title="Embedded document">
</iframe>
```

### Downloading & Exporting

Click the **"Download"** button to see available options:

- **PDF**: Download original or print to PDF
- **Images** (Hitomi only): Export as PNG, JPG, WebP, or AVIF
  - Single files or ZIP bundle
  - Combine pages into one image
  - Automatic splitting for large images

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `PageDown` / `PageUp` | Navigate PDF pages |
| `Ctrl+Shift+F` | Focus search |
| `Ctrl+Shift+T` | Toggle thumbnails |
| `Ctrl+Shift+D` | Download PDF |

## 🏗️ Project Structure

```
easydocs/
├── app/
│   ├── api/                    # API routes
│   │   ├── proxy/             # CORS proxy
│   │   ├── arxiv-pdf/         # arXiv PDF proxy
│   │   └── hitomi-image/      # Hitomi image proxy
│   ├── components/            # React components
│   │   ├── modals/           # Modal components
│   │   │   ├── info-modal.tsx
│   │   │   ├── embed-modal.tsx
│   │   │   └── download-modal.tsx
│   │   ├── pdf-viewer.tsx    # PDF viewer
│   │   ├── hitomi-viewer.tsx # Gallery viewer
│   │   ├── toast-container.tsx
│   │   └── ...
│   ├── lib/                   # Utilities & helpers
│   │   ├── file-type.ts      # File type detection
│   │   ├── download.ts       # Download utilities
│   │   ├── toast.ts          # Toast system
│   │   ├── theme.ts          # Theme management
│   │   ├── ui-utils.ts       # UI helpers
│   │   └── ...
│   ├── viewer/[...doc]/      # Main viewer route
│   ├── embed/[...doc]/       # Embed route
│   ├── embed-builder/        # Embed code generator
│   ├── open/                 # Document opener
│   └── layout.tsx            # Root layout
├── public/                    # Static assets
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS config
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Optional: Custom domain for embed URLs
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Security Headers

Security headers are configured in `next.config.ts`:
- Content Security Policy (CSP)
- HSTS
- X-Frame-Options
- Access-Control-Allow-Private-Network

### Proxy Settings

The proxy API (`app/api/proxy/route.ts`) has the following limits:
- Max content size: 150 MB
- Timeout: 30 seconds
- Cache: 5 minutes

## 🎨 Customization

### Changing Colors

Edit `tailwind.config.ts` and `app/globals.css`:

```css
/* Change primary color */
.bg-emerald-600 {
  --tw-bg-opacity: 1;
  background-color: rgb(5 150 105 / var(--tw-bg-opacity));
}
```

### Adding New File Types

1. Update `app/lib/file-type.ts`:
```typescript
export type FileType = 'pdf' | 'html' | 'markdown' | 'text' | 'ipynb' | 'yournewtype';
```

2. Create a viewer component in `app/components/`

3. Add to viewer page routing in `app/viewer/[...doc]/page.tsx`

## 🧪 Development

### Running Tests

```bash
# Run type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Project Dependencies

Key dependencies:
- **Next.js 16**: React framework
- **@embedpdf/react-pdf-viewer**: PDF viewing
- **React Markdown**: Markdown rendering
- **fflate**: Fast ZIP compression
- **Tailwind CSS**: Utility-first CSS

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/gaon12/EasyDocs)

1. Push to GitHub
2. Import to Vercel
3. Deploy!

### Docker

```bash
# Build Docker image
docker build -t easydocs .

# Run container
docker run -p 3000:3000 easydocs
```

### Manual Deployment

```bash
npm run build
npm start
```

Deploy the `.next` folder to any Node.js hosting platform.

## 📝 API Documentation

### Proxy API

**Endpoint**: `/api/proxy?url={encodedUrl}`

**Methods**: `GET`, `HEAD`, `OPTIONS`

**Features**:
- CORS headers included
- Private IP blocking
- Range request support
- 150MB size limit

**Example**:
```javascript
fetch('/api/proxy?url=' + encodeURIComponent('https://example.com/doc.pdf'))
  .then(res => res.blob())
  .then(blob => console.log(blob));
```

### Tagged Services

**arXiv**: `/viewer/arxiv:{paper_id}`
- Automatically fetches PDF from arXiv
- Shows metadata (authors, abstract, etc.)

**Hitomi**: `/viewer/hitomi:{gallery_id}`
- Displays gallery viewer
- Image export options

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages

### Adding Features

When adding features, please:
1. Update relevant documentation
2. Add JSDoc comments to functions
3. Test on multiple browsers
4. Ensure accessibility (ARIA labels, keyboard navigation)

## 🐛 Troubleshooting

### Common Issues

**Issue**: CORS errors when embedding
- **Solution**: Use the `/embed/` route instead of `/viewer/`

**Issue**: PDF not loading
- **Solution**: Check if the URL is publicly accessible and not blocked by firewalls

**Issue**: Local files not persisting
- **Solution**: Check browser storage settings and IndexedDB support

**Issue**: Toast notifications not showing
- **Solution**: Ensure `<ToastContainer />` is in your root layout

### Browser Compatibility

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [EmbedPDF](https://github.com/embedpdf/react-pdf-viewer) - PDF viewing library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [fflate](https://github.com/101arrowz/fflate) - Compression library

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/gaon12/EasyDocs/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gaon12/EasyDocs/discussions)

---

Made with ❤️ by [gaon12](https://github.com/gaon12)
