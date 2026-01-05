import { DocRenderer } from "../../components/doc-renderer";

const DOWNLOAD_CONTENT = `# Download & Export

Export documents in various formats.

## PDF Documents

### Download Original

Click **Download** → **Download PDF** to save the original file.

### Print to PDF (HTML/Markdown/Text)

For non-PDF documents:
1. Click **Download**
2. Select **Save as PDF**
3. Browser print dialog opens
4. Save as PDF

## Image Export (Hitomi only)

### Formats

- **PNG**: Lossless, larger files
- **JPG**: Smaller size, lossy compression
- **WebP**: Modern format, good compression
- **AVIF**: Best compression, smaller files

### Packaging Options

**Zip Bundle**: All images in one zip file
**Individual Files**: Download images separately

### Advanced Options

**Combine Pages**: Merge all images into one large image
**Auto-split**: Large images split automatically

## Examples

### Export as PNG Zip

1. Open Hitomi gallery
2. Click **Download**
3. Select **Images** mode
4. Choose **PNG** format
5. Select **Zip bundle**
6. Click **Download images**

### Export as WebP Individual Files

1. Choose **Images** mode
2. Select **WebP** format
3. Choose **Individual files**
4. Click **Download images**

## Keyboard Shortcuts

- \`Ctrl+Shift+D\`: Download PDF (PDF viewer only)

## Tips

- Use **PNG** for screenshots or diagrams
- Use **JPG** for photos
- Use **WebP** for web publishing
- Use **AVIF** for maximum compression
`;

export default function DownloadPage() {
  return <DocRenderer content={DOWNLOAD_CONTENT} />;
}
