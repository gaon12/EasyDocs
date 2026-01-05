import { DocRenderer } from "../components/doc-renderer";

const INTRO_CONTENT = `# Welcome to EasyDocs

EasyDocs is a modern, clean document viewer with embed-ready links. View PDFs, HTML, Markdown, Jupyter notebooks, and more—all in one place.

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

### Viewing Documents

#### Method 1: Drag & Drop
Simply drag and drop any supported file onto the home page.

#### Method 2: Paste URL
1. Go to the [home page](/)
2. Paste a document URL
3. Click "Open"

#### Method 3: Tagged Sources
Use shortcuts for popular sources:
\`\`\`
arxiv:2301.12345    # arXiv papers
hitomi:123456       # Hitomi galleries
\`\`\`

## 📚 Documentation Sections

- **[Quick Start](/guide/quick-start)**: Get up and running in minutes
- **[Usage Guide](/guide/usage)**: Detailed usage instructions
- **[Embedding](/guide/embedding)**: How to embed documents on your site
- **[Download & Export](/guide/download)**: Export options and formats
- **[Keyboard Shortcuts](/guide/shortcuts)**: Power user shortcuts
- **[Architecture](/guide/architecture)**: Technical architecture details
- **[Contributing](/guide/contributing)**: How to contribute to EasyDocs
- **[API Reference](/guide/api)**: API documentation for developers

## 🤝 Community

- **GitHub**: [github.com/gaon12/EasyDocs](https://github.com/gaon12/EasyDocs)
- **Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas

## 📜 License

EasyDocs is licensed under the MIT License. See [LICENSE](https://github.com/gaon12/EasyDocs/blob/main/LICENSE) for details.
`;

export default function GuidePage() {
  return <DocRenderer content={INTRO_CONTENT} />;
}
