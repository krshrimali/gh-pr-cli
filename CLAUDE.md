# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`gh-pr-review` is a terminal-based GitHub Pull Request reviewer built with TypeScript, React (Ink), and the Octokit GitHub API client. It provides a full-featured TUI for browsing, reviewing, and managing PRs directly from the command line.

## Development Commands

### Running the Application
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run with specific repository
npm start -- --repo owner/repo

# Run with GitHub Enterprise
npm start -- --repo owner/repo --url https://github.enterprise.com
```

### Building
```bash
# Install dependencies (automatically runs tsx preparation)
npm install

# Note: There is no dedicated build script - the app runs via tsx which handles TypeScript compilation on-the-fly
```

### Testing
Currently no test suite is configured (`npm test` will error). Tests should be added in the future.

## Authentication

The app tries authentication methods in this order:
1. `--token` CLI argument
2. `GITHUB_TOKEN` environment variable
3. `GH_TOKEN` environment variable
4. GitHub CLI (`gh auth token`)
5. Saved config at `~/.gh-pr-review/config.json`

## Architecture

### Entry Point & Initialization Flow

1. **`src/cli.ts`** - Main entry point that:
   - Parses CLI arguments using Commander.js
   - Loads config from `~/.gh-pr-review/config.json`
   - Resolves GitHub token from environment or `gh` CLI
   - Determines repository from `--repo` arg or git remote
   - Validates TTY and raw mode support for terminal interaction
   - Sets up signal handlers (SIGINT, SIGTERM) for cleanup
   - Renders the Ink React app with proper stdin/stdout/stderr

### Core Services

**`src/services/github.ts` - GitHubService**
- Wraps `@octokit/rest` for all GitHub API interactions
- Supports both github.com and GitHub Enterprise (via `baseUrl` and `apiUrl`)
- Key methods:
  - `listPullRequests()` - Fetch PRs with state filtering
  - `getPullRequest()` - Get detailed PR info
  - `getFiles()` / `getComments()` / `getReviews()` / `getReviewComments()` - PR metadata
  - `createReview()` / `createComment()` - Review submission
  - `searchPullRequests()` - GitHub search API integration
  - `createPullRequest()` / `mergePullRequest()` - PR management
  - `getWebUrl()` - Generate web URLs for browser integration
- Enterprise support: Auto-generates API URL from base URL (`https://github.enterprise.com` → `https://github.enterprise.com/api/v3`)

**`src/utils/git.ts` - GitService**
- Wraps git commands via `execSync` for local repository operations
- Provides `getGitStatus()` which returns comprehensive branch status
- Used for PR creation feature to detect:
  - Current branch and base branch
  - Uncommitted changes
  - Unpushed commits
  - Recent commits and diff stats
- `pushCurrentBranch()` - Automatically determines if `-u origin` is needed

**`src/utils/config.ts`**
- Loads/saves user config from `~/.gh-pr-review/config.json`
- `getGitHubToken()` - Attempts to resolve token from multiple sources
- `parseRepoFromGit()` - Extracts owner/repo from git remote URL (supports Enterprise)
- `parseRepoFromArgs()` - Parses `owner/repo` format from CLI args

**`src/utils/browser.ts`**
- `openInBrowser()` - Platform-aware browser launching (`open` on macOS, `start` on Windows, `xdg-open` on Linux)

### React/Ink UI Components

The UI is built with React components rendered to the terminal via Ink:

**`src/components/App.tsx`** - Root component
- Manages global state (PRs, selected PR, mode, loading, errors)
- Handles top-level keyboard navigation
- Modes: `'list' | 'detail' | 'search' | 'review' | 'comment' | 'create'`
- Global keybindings:
  - `q` - Quit (list mode only)
  - `ESC` - Go back
  - `r` - Refresh (list mode)
  - `1/2/3` - Filter by open/closed/all PRs
  - `/` - Enter search mode
  - `c` - Create PR (when in git repo)

**`src/components/PRList.tsx`**
- Displays PR list with state indicators (🟢 open, 🔴 closed, 🟣 merged, 📝 draft)
- Shows stats: additions/deletions, file count, comments, commits
- Keybindings: `j/k` or `↑↓`, `g/G` for top/bottom, `PgUp/PgDn`, `Enter` to open, `b` to open in browser

**`src/components/PRDetail.tsx`**
- Tab-based PR detail view with tabs:
  - Overview: PR metadata, description, stats
  - Files: Changed files list
  - Diff: File diff viewer (when file selected)
  - Comments: Issue comments thread
  - Reviews: Review history with status
- Keybindings: `o/f/d/c/r` for tab switching, `R` to submit review, `b` to open in browser

**`src/components/DiffViewer.tsx`**
- Scrollable diff view with syntax highlighting
- Keybindings: `j/k` scroll, `g/G` top/bottom, `PgUp/PgDn`, `w` toggle wrap, `n` toggle line numbers, `ESC` back

**`src/components/ReviewForm.tsx`**
- Interactive review submission with state selection (approve/request changes/comment)
- Comment input field

**`src/components/PRCreateForm.tsx`**
- PR creation form using git status
- Auto-detects current branch, base branch, commits, and diff stats
- Validates before creation

**`src/components/SearchBox.tsx`**
- Search input supporting GitHub's advanced query syntax
- Examples: `"author:username"`, `"label:bug"`, `"state:closed"`

**`src/components/StatusBar.tsx`**
- Bottom status bar showing contextual help text and current state

**Other UI Components**:
- `ScrollableBox.tsx` - Scrollable container with scrollbar
- `TextBlock.tsx` - Text formatting utilities
- `CommentForm.tsx` - Comment input
- `InlineReviewForm.tsx` - Inline code review comments
- `MergeForm.tsx` - PR merge UI

### Type Definitions

**`src/types/github.ts`**
- TypeScript interfaces for all GitHub entities:
  - `PullRequest`, `User`, `Label`, `Branch`, `Repository`
  - `Comment`, `ReviewComment`, `Review`, `File`
  - `ReviewState` - `'approve' | 'request_changes' | 'comment'`
  - `AppConfig` - User configuration schema

### Key Technical Details

**Module System**:
- ESM modules (`"type": "module"` in package.json)
- TypeScript config uses `"module": "Node16"` with `"moduleResolution": "node16"`
- All imports must use `.js` extensions (even for `.ts` files)

**TSX Execution**:
- App runs via `tsx` which provides on-the-fly TypeScript compilation
- No separate build step needed for development
- `tsx watch` enables hot reload

**Terminal Handling**:
- Requires TTY with raw mode support
- Explicit raw mode setup in cli.ts with validation checks
- Cleanup handlers for SIGINT/SIGTERM to restore terminal state
- stdin must be resumed with proper event listeners to prevent early exit

**GitHub Enterprise Support**:
- `--url` flag for base URL
- `--api-url` flag for API endpoint (auto-generated if not provided)
- URL parsing logic in both GitHubService and config utils handles enterprise patterns

## Common Development Patterns

### Adding New GitHub API Features
1. Add method to `GitHubService` class in `src/services/github.ts`
2. Use `this.octokit` to call Octokit methods
3. Map response to types from `src/types/github.ts`
4. Handle enterprise URL differences via `this.baseUrl`

### Adding New UI Components
1. Create new React component in `src/components/`
2. Use Ink components (`Box`, `Text`, `useInput`) for layout
3. Add keybindings via `useInput` hook
4. Integrate into App.tsx mode system if it's a new top-level view

### Adding Keyboard Shortcuts
1. Global shortcuts: Add to `App.tsx` useInput handler
2. Component-specific: Add useInput hook in the component
3. Document in StatusBar.tsx for user visibility
4. Update README.md keyboard shortcuts section

## Important Notes

- **Terminal State Management**: Always ensure stdin raw mode is properly set and cleaned up. The app will fail if TTY or raw mode is unavailable.
- **Enterprise URLs**: When working with GitHub Enterprise, the base URL must not have trailing slashes, and API URLs follow the pattern `{baseUrl}/api/v3`.
- **Git Remote Parsing**: The regex patterns for parsing git remotes support both HTTPS and SSH formats, and both github.com and enterprise domains.
- **Ink React Patterns**: Ink uses a reconciler similar to React DOM but for terminal output. State updates trigger re-renders. Avoid blocking the event loop.
- **Error Handling**: GitHub API errors should be caught and displayed via the `error` state in App.tsx, shown in the StatusBar.
