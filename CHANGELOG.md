# Changelog

All notable changes to EasyDocs will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Toast notification system for user feedback
- Loading indicators for downloads and copy operations
- Improved CORS handling with Private Network Access support
- Modular component architecture (InfoModal, EmbedModal, DownloadModal)
- Theme management utilities
- Enhanced UI helper functions
- Comprehensive JSDoc documentation

### Changed
- Refactored viewer header into separate modal components
- Improved code organization with utility libraries
- Enhanced security with better IP validation
- Optimized React component performance with useMemo and useCallback

### Fixed
- CORS InsecurePrivateNetwork errors in embedded contexts
- Missing user feedback for clipboard and download operations
- Security vulnerabilities in private IP detection

### Security
- Enhanced private IP blocking (IPv4 and IPv6)
- Improved HTML sanitization in download utilities
- Added OPTIONS handler for CORS preflight requests
- Strengthened CSP headers with Access-Control-Allow-Private-Network

## [1.0.0] - Initial Release

### Added
- PDF viewer with full-text search
- HTML, Markdown, and Jupyter notebook support
- Drag-and-drop file upload
- Local file storage with IndexedDB
- Embed code generation
- arXiv and Hitomi integration
- Dark mode support
- Image export (PNG, JPG, WebP, AVIF)
- CORS proxy for remote resources
- Responsive design
- Keyboard shortcuts
- Security headers (CSP, HSTS, etc.)

[Unreleased]: https://github.com/gaon12/EasyDocs/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/gaon12/EasyDocs/releases/tag/v1.0.0
