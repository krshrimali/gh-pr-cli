import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import chalk from 'chalk';
import { GitHubService } from '../services/github.js';
import { PRList } from './PRList.js';
import { PRDetail } from './PRDetail.js';
import { SearchBox } from './SearchBox.js';
import { StatusBar } from './StatusBar.js';
import { openInBrowser } from '../utils/browser.js';
import { GitService, type GitStatus } from '../utils/git.js';
import { PRCreateForm } from './PRCreateForm.js';
import type { PullRequest, AppConfig } from '../types/github.js';

interface AppProps {
  config: AppConfig;
  githubService: GitHubService;
}

type AppMode = 'list' | 'detail' | 'search' | 'review' | 'comment' | 'create';

export function App({ config, githubService }: AppProps) {
  const [mode, setMode] = useState<AppMode>('list');
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadPRs();
    loadGitStatus();
  }, []);

  const loadGitStatus = async () => {
    try {
      if (GitService.isValidRepository()) {
        const status = GitService.getGitStatus();
        setGitStatus(status);
      }
    } catch (error) {
      console.error('Failed to load git status:', error);
    }
  };

  const loadPRs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading PRs...');
      const pullRequests = await githubService.listPullRequests('open', 50);
      console.log(`📝 Found ${pullRequests.length} PRs`);
      setPrs(pullRequests);
    } catch (err) {
      console.error('❌ Error loading PRs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load PRs');
    } finally {
      setLoading(false);
    }
  };

  const searchPRs = async (query: string) => {
    if (!query.trim()) {
      await loadPRs();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await githubService.searchPullRequests(query, 50);
      setPrs(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const openPRDetail = (pr: PullRequest) => {
    setSelectedPR(pr);
    setMode('detail');
  };

  const goBack = () => {
    if (mode === 'detail') {
      setMode('list');
      setSelectedPR(null);
    } else if (mode === 'search') {
      setMode('list');
      setSearchQuery('');
    } else if (mode === 'create') {
      setMode('list');
    }
  };

  const createPullRequest = async (data: {
    title: string;
    body: string;
    base: string;
    head: string;
    draft: boolean;
  }) => {
    setCreateLoading(true);
    try {
      // First, push the current branch if needed
      if (gitStatus?.hasUnpushedCommits) {
        console.log('🔄 Pushing branch...');
        await GitService.pushCurrentBranch();
      }

      // Create the pull request
      console.log('🚀 Creating pull request...');
      const newPR = await githubService.createPullRequest(data);
      
      // Refresh PR list
      await loadPRs();
      
      // Navigate to the created PR
      setSelectedPR(newPR);
      setMode('detail');
      
      console.log(`✅ Pull request created: #${newPR.number}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create pull request');
      console.error('❌ Failed to create PR:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  useInput((input, key) => {
    // Global navigation
    if (key.escape) {
      goBack();
      return;
    }

    if (input === 'q' && mode === 'list') {
      process.exit(0);
    }

    if (input === 'r' && mode === 'list') {
      loadPRs();
      return;
    }

    if (input === '/' && mode === 'list') {
      setMode('search');
      return;
    }

    if (input === 'c' && mode === 'list' && gitStatus) {
      setMode('create');
      return;
    }

    // List navigation with vim-like keys
    if (mode === 'list') {
      if (key.upArrow || input === 'k') {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      } else if (key.downArrow || input === 'j') {
        setSelectedIndex(Math.min(prs.length - 1, selectedIndex + 1));
      } else if (input === 'g') {
        setSelectedIndex(0); // Go to top
      } else if (input === 'G') {
        setSelectedIndex(prs.length - 1); // Go to bottom
      } else if (key.pageUp) {
        setSelectedIndex(Math.max(0, selectedIndex - 10));
      } else if (key.pageDown) {
        setSelectedIndex(Math.min(prs.length - 1, selectedIndex + 10));
      } else if (key.return) {
        if (prs[selectedIndex]) {
          openPRDetail(prs[selectedIndex]);
        }
      } else if (input === 'b' && prs[selectedIndex]) {
        // Open selected PR in browser
        openInBrowser(prs[selectedIndex].html_url);
      }
    }
  });

  const renderContent = () => {
    switch (mode) {
      case 'search':
        return (
          <SearchBox
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSearch={searchPRs}
            onCancel={goBack}
          />
        );
      case 'detail':
        return selectedPR ? (
          <PRDetail pr={selectedPR} githubService={githubService} />
        ) : (
          <Text>No PR selected</Text>
        );
      case 'create':
        return gitStatus ? (
          <PRCreateForm 
            gitStatus={gitStatus}
            onSubmit={createPullRequest}
            onCancel={goBack}
            loading={createLoading}
          />
        ) : (
          <Box justifyContent="center" alignItems="center" height={20}>
            <Text color="red">Not a git repository or git status unavailable</Text>
          </Box>
        );
      default:
        return (
          <PRList
            prs={prs}
            selectedIndex={selectedIndex}
            onSelect={openPRDetail}
            loading={loading}
            error={error}
          />
        );
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Text color="cyan" bold>
          🚀 GitHub PR Review CLI
        </Text>
      </Box>
      
      <Box flex={1}>
        {renderContent()}
      </Box>

      <StatusBar
        mode={mode}
        loading={loading}
        error={error}
        prCount={prs.length}
        selectedPR={selectedPR}
      />
    </Box>
  );
}