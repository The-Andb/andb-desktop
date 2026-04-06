# TheAndb Desktop

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
- **Core Engine**: Framework-based `@the-andb/core`
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

**Proprietary Source-Available License**

Copyright (c) 2026 <your name>. All rights reserved.

### ✅ Permitted Use

- View, clone, and run the software locally for personal and evaluation purposes.

### ❌ Restrictions

You may NOT:

- Use the software in production environments
- Offer the software as a service (SaaS)
- Redistribute, sublicense, or sell the software
- Modify and distribute modified versions

### 💼 Commercial License

For production use, SaaS deployment, or commercial licensing, please contact:
https://theandb.xyz
© 2024 - 2026 TheAndb. All rights reserved.

### Note:

> This project is source-available to promote transparency and learning.
> If you need production usage, please consider a commercial license.

---

**Made with ❤️ by TheAndb**
