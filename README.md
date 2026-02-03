# The Andb Desktop

**The Intelligent Database Orchestrator** — Professional desktop application for seamless schema visualization, comparison, and synchronization.

## 🚀 Features

- **Auto-hide Sidebar**: Collapsible navigation with keyboard shortcuts
- **Dual-Pane Layout**: Resizable source/destination panes for efficient comparison
- **Atomic Operations**: Smart Refresh & Compare individual objects or categories
- **Multiple Database Connections**: Manage multiple database configurations
- **Connection Pairs**: Select source ↔ target for compare/migrate operations
- **Visual Diff**: Side-by-side comparison with status indicators & syntax highlighting
- **Context-Aware Dashboard**: Intelligent filtering of connections and pairs based on active project context
- **Export Preview**: Live SQL preview with syntax highlighting (Rainbow brackets + Line numbers)
- **Migration Management**: Create and track database migrations
- **High-Performance Storage**: SQLite-backed metadata and snapshot management
- **Dark/Light Theme**: Modern UI with theme support

## 🛠️ Tech Stack

- **Frontend**: Vue.js 3 + TypeScript
- **Desktop**: Electron
- **Core Engine**: NestJS-based `@the-andb/core`
- **Styling**: Tailwind CSS
- **Icons**: Lucide Vue Next
- **State Management**: Pinia
- **Build Tool**: Vite
- **Metadata Storage**: SQLite (better-sqlite3)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/The-Andb/andb.git
cd andb

# Install dependencies
npm install

# Build core and desktop
npm run build:all

# Start Electron app in dev mode
npm run dev:desktop
```

## ⌨️ Keyboard Shortcuts

- `Ctrl+B`: Toggle sidebar
- `Ctrl+Left/Right`: Resize panes
- `Ctrl+Shift+C`: Compare selected
- `Ctrl+Shift+E`: Export selected
- `Ctrl+Shift+M`: Create migration

## 📄 License & Commercial

**Proprietary Software**

- ✅ **Source-Available**: View, Clone, Run locally for engineering evaluation.
- ❌ **No Commercial Use**: Production deployment, SaaS distribution, or redistribution are strictly prohibited without a commercial license.
- 🛡️ **DMCA Protected**: Unauthorized reproduction or distribution is prohibited under DMCA guidelines.

© 2024 - 2026 The Andb. All rights reserved.

---

**Made with ❤️ by The Andb**
