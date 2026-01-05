import { DocRenderer } from "../../components/doc-renderer";

const QUICK_START_CONTENT = `# Quick Start

Get up and running with EasyDocs in minutes.

## Installation

EasyDocs is a web application that requires no installation. Simply visit the website and start using it!

For developers who want to run it locally or contribute:

\`\`\`bash
# Clone the repository
git clone https://github.com/gaon12/EasyDocs.git
cd easydocs

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the application.

## First Steps

### 1. Open a Document

Choose one of three methods:

**Method 1: Drag & Drop**
- Drag any supported file onto the homepage
- Supported formats: PDF, HTML, Markdown, Jupyter (.ipynb), Text

**Method 2: URL Input**
- Go to [/open](/open)
- Paste a public document URL
- Click "Open Document"

**Method 3: Tagged Sources**
- Use shortcuts like \`arxiv:2301.12345\` or \`hitomi:123456\`
- These automatically resolve to the correct document

### 2. Navigate the Document

- **PDF**: Use arrow keys, mouse wheel, or toolbar buttons
- **HTML/Markdown**: Scroll normally
- **Jupyter**: Navigate cells with keyboard

### 3. Search (PDF only)

Press \`Ctrl+Shift+F\` or click the search icon to find text in PDFs.

### 4. Download or Export

Click the "Download" button to see export options:
- PDF: Download original or save as PDF
- Images: Export as PNG, JPG, WebP, or AVIF
- Text: Download original file

### 5. Share or Embed

Click "Embed Code" to get an iframe snippet for your website.

## Next Steps

- **[Usage Guide](/guide/usage)**: Learn all features in detail
- **[Embedding](/guide/embedding)**: Embed documents on your site
- **[Keyboard Shortcuts](/guide/shortcuts)**: Become a power user
`;

export default function QuickStartPage() {
  return <DocRenderer content={QUICK_START_CONTENT} />;
}
