import { DocRenderer } from "../../components/doc-renderer";

const SHORTCUTS_CONTENT = `# Keyboard Shortcuts

Master EasyDocs with these keyboard shortcuts.

## PDF Viewer

### Navigation

| Shortcut | Action |
|----------|--------|
| \`PageDown\` or \`Space\` | Next page |
| \`PageUp\` or \`Shift+Space\` | Previous page |
| \`Home\` | First page |
| \`End\` | Last page |
| \`Arrow Up/Down\` | Scroll |

### Search

| Shortcut | Action |
|----------|--------|
| \`Ctrl+Shift+F\` | Open search |
| \`Ctrl+F\` | Open browser find (default) |
| \`Enter\` | Next result |
| \`Shift+Enter\` | Previous result |
| \`Esc\` | Close search |

### Sidebar

| Shortcut | Action |
|----------|--------|
| \`Ctrl+Shift+T\` | Toggle thumbnails |
| \`Ctrl+Shift+O\` | Toggle outline |

### Actions

| Shortcut | Action |
|----------|--------|
| \`Ctrl+Shift+D\` | Download PDF |
| \`Ctrl+P\` | Print |

## General

### Browser

| Shortcut | Action |
|----------|--------|
| \`Ctrl+T\` | New tab |
| \`Ctrl+W\` | Close tab |
| \`Ctrl+Tab\` | Next tab |
| \`Ctrl+Shift+Tab\` | Previous tab |
| \`F5\` | Reload |
| \`Ctrl+R\` | Reload |

### Zoom

| Shortcut | Action |
|----------|--------|
| \`Ctrl++\` | Zoom in |
| \`Ctrl+-\` | Zoom out |
| \`Ctrl+0\` | Reset zoom |

## Tips

- All shortcuts work when focus is on the document viewer
- Shortcuts don't work when typing in input fields
- Some browsers may override certain shortcuts
- Use \`Cmd\` instead of \`Ctrl\` on macOS

## Accessibility

### Screen Readers

EasyDocs works with screen readers:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

### High Contrast

Use browser high contrast mode:
- Windows: \`Alt+Shift+Print Screen\`
- macOS: System Preferences → Accessibility

### Text Size

Adjust text size:
- Browser zoom: \`Ctrl++\` / \`Ctrl+-\`
- System settings: OS accessibility settings
`;

export default function ShortcutsPage() {
  return <DocRenderer content={SHORTCUTS_CONTENT} />;
}
