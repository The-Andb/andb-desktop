# TheAndb Desktop

> Compare and sync your database schemas across environments — safely, visually, and fast.

📸 Screenshots

<!-- TODO: Add GIF or screenshot of comparison UI here -->

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

## 📋 Prerequisites

- Node.js >= 18
- macOS (Windows support coming soon)
- MySQL 5.7+ or 8.0+

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/The-Andb/andb-desktop.git
cd andb-desktop

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

## 📄 License

**TheAndb Desktop** and **TheAndb Core** are free to download and use for internal business operations including production use. A commercial license is required only if you redistribute, white-label, or resell the software as a competing product.

---

**Made with ❤️ by TheAndb**
