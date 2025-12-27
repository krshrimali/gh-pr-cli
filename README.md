# 🚀 GitHub PR Review CLI

NOTE: Made with Claude Code :)

The most advanced GitHub Pull Request reviewer for the terminal! Built with modern TypeScript, React (Ink), and a beautiful TUI interface that brings the full GitHub PR experience to your command line.

## ✨ Features

### 📋 **PR Management**
- **Interactive PR listing** with real-time updates
- **Smart search** with GitHub's advanced query syntax
- **Beautiful status indicators** (open/closed/merged/draft)
- **Live refresh** capabilities
- **Multi-repository support**

### 🔍 **PR Detail Views**
- **Comprehensive overview** with stats and metadata
- **File diff browser** with syntax highlighting
- **Comment threading** with inline reviews
- **Review history** with detailed status
- **Responsive navigation** with vim-like shortcuts

### ✅ **Review Capabilities**
- **Submit reviews** (approve/request changes/comment)
- **Add comments** with GitHub Markdown support
- **Interactive forms** for review submission
- **Real-time feedback** and status updates

### 🎨 **Beautiful UI/UX**
- **Modern terminal interface** built with Ink (React for CLI)
- **Color-coded status** indicators throughout
- **Responsive design** that adapts to terminal size
- **Intuitive keyboard navigation**
- **Professional styling** with borders and formatting

### ⚡ **Performance & Integration**
- **GitHub API integration** via @octokit/rest
- **Fast and lightweight** TypeScript implementation
- **Configuration management** with local settings
- **Authentication handling** with token support

## 🛠 Installation

### Prerequisites
- Node.js 16+ 
- GitHub CLI (`gh`) or personal access token
- Terminal with emoji support (recommended)

### Quick Start

```bash
# Clone and install
git clone <repository-url>
cd gh-pr-review
npm install

# Build the application
npm run build

# Run with your GitHub repository
npm start -- --repo owner/repo

# Or from a git repository directory
npm start
```

### Global Installation

```bash
# Install globally
npm install -g .

# Run from anywhere
gh-pr-review --repo facebook/react
```

## 🔑 Authentication

Set up GitHub authentication using one of these methods:

### Option 1: GitHub CLI (Recommended)
```bash
gh auth login
```

### Option 2: Personal Access Token
```bash
export GITHUB_TOKEN=your_token_here
# or
export GH_TOKEN=your_token_here
```

### Option 3: Configuration File
The tool will create `~/.gh-pr-review/config.json` for persistent settings.

## 📖 Usage

### Command Line Options

```bash
gh-pr-review [options]

Options:
  -r, --repo <owner/repo>   GitHub repository (e.g., facebook/react)
  -t, --token <token>       GitHub personal access token
  -h, --help               Display help information
  -V, --version            Display version number
```

### Navigation & Keyboard Shortcuts

#### Main PR List
- `↑↓` or `j/k` - Navigate PRs (vim-style)
- `g` - Go to top PR
- `G` - Go to bottom PR
- `PgUp/PgDn` - Navigate by pages
- `Enter` - Open PR details
- `b` - **Open selected PR in browser**
- `/` - Search PRs
- `r` - Refresh list
- `q` - Quit

#### PR Detail View
- `o` - Overview tab
- `f` - Files changed tab
- `d` - Diff viewer tab
- `c` - Comments tab
- `r` - Reviews tab
- `R` - Submit review
- `b` - **Open PR/file in browser**
- `↑↓` or `j/k` - Navigate within tabs
- `Enter` - (Files tab) View file diff
- `ESC` - Go back

#### Diff Viewer
- `↑↓` or `j/k` - Scroll line by line
- `PgUp/PgDn` - Scroll by pages
- `g` - Go to top of file
- `G` - Go to bottom of file
- `w` - Toggle line wrapping
- `n` - Toggle line numbers
- `b` - **Open file diff in browser**
- `ESC` - Back to files list

#### Search Mode
- Type to search
- `Enter` - Execute search
- `ESC` - Cancel search

#### Review Submission
- `a` - Approve
- `r` - Request changes  
- `c` - Comment only
- `Enter` - Continue to comment
- `Ctrl+Enter` - Submit review
- `ESC` - Cancel

### 🌐 Browser Integration

Press `b` anywhere to open the current context in your default browser:

- **PR List**: Opens selected PR in GitHub
- **PR Detail**: Opens current PR in GitHub  
- **Files Tab**: Opens selected file diff in GitHub
- **Diff Viewer**: Opens current file diff in GitHub

Works on **all platforms** (macOS, Windows, Linux) and automatically detects your system's default browser.

### Search Syntax

Use GitHub's powerful search syntax:

```bash
# Search examples:
"bug fix"              # Search in title/body
"author:username"      # PRs by specific author
"label:bug"           # PRs with bug label
"state:closed"        # Closed PRs
"base:main"          # PRs targeting main branch
"is:draft"           # Draft PRs
"review:required"    # PRs needing review
```

## 🏗 Architecture

### Tech Stack
- **TypeScript** - Type-safe development
- **React (Ink)** - Component-based TUI framework
- **@octokit/rest** - GitHub API client
- **Commander.js** - CLI argument parsing
- **Chalk** - Terminal colors and styling
- **date-fns** - Date formatting

### Project Structure
```
src/
├── components/           # React components for UI
│   ├── App.tsx          # Main application component
│   ├── PRList.tsx       # PR listing interface
│   ├── PRDetail.tsx     # PR detail view with tabs
│   ├── ReviewForm.tsx   # Review submission form
│   ├── CommentForm.tsx  # Comment writing interface
│   ├── SearchBox.tsx    # Search functionality
│   └── StatusBar.tsx    # Status and navigation bar
├── services/
│   └── github.ts        # GitHub API service layer
├── types/
│   └── github.ts        # TypeScript type definitions
├── utils/
│   └── config.ts        # Configuration management
└── cli.ts               # CLI entry point
```

## 🎨 Screenshots

### PR List View
```
┌─────────────────────────────────────────────────────────────┐
│ 🚀 GitHub PR Review CLI                                     │
└─────────────────────────────────────────────────────────────┘

Pull Requests (15)

┌─────────────────────────────────────────────────────────────┐
│ 🟢 #1234 Fix authentication bug in OAuth flow               │
│ by alice • 2 hours ago                                      │
│ +127 -43 📄 5 files 💬 3 comments 📝 2 commits             │
└─────────────────────────────────────────────────────────────┘

🟣 #1233 Add dark mode support
by bob • 1 day ago  🏷️ feature 🏷️ ui
+89 -12 📄 8 files 💬 7 comments 📝 4 commits

┌─────────────────────────────────────────────────────────────┐
│ ↑↓ Navigate • Enter: View PR • /: Search • r: Refresh • q: Quit │
└─────────────────────────────────────────────────────────────┘
```

### PR Detail View
```
┌─────────────────────────────────────────────────────────────┐
│ overview | files | comments | reviews | Review             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ #1234: Fix authentication bug in OAuth flow                │
│ by alice • 2 hours ago                                     │
│ main ← feature/oauth-fix                                   │
└─────────────────────────────────────────────────────────────┘

📊 Changes:          💬 Discussion:
+127 additions       3 comments
-43 deletions       5 review comments
5 files changed     2 commits

┌─────────────────────────────────────────────────────────────┐
│ ESC: Back • ↑↓: Navigate • o/f/c/r: Switch tabs • R: Review │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Advanced Features

### Smart Configuration
- Auto-detects repository from git remote
- Saves user preferences locally
- Supports multiple authentication methods
- Configurable keyboard shortcuts

### Performance Optimizations
- Efficient API calls with pagination
- Smart caching for repeated requests
- Minimal resource usage
- Fast startup times

### Error Handling
- Graceful fallbacks for network issues
- Clear error messages with suggestions
- Retry mechanisms for failed requests
- Offline mode detection

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **GitHub CLI team** for inspiration
- **Ink framework** for amazing terminal UI capabilities
- **Octokit** for excellent GitHub API integration
- **Open source community** for all the amazing tools

---

**Made with ❤️ for the terminal-loving developer community**

*The best GitHub PR experience you've never had in your terminal.*
