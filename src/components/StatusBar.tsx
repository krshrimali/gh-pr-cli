import React from 'react';
import { Box, Text } from 'ink';
import type { PullRequest } from '../types/github.js';

interface StatusBarProps {
  mode: string;
  loading: boolean;
  error: string | null;
  prCount: number;
  selectedPR: PullRequest | null;
  prState?: 'open' | 'closed' | 'all';
}

export function StatusBar({ mode, loading, error, prCount, selectedPR, prState = 'open' }: StatusBarProps) {
  const getModeDisplay = () => {
    switch (mode) {
      case 'list': return `📋 ${prState.charAt(0).toUpperCase() + prState.slice(1)} (${prCount} PRs)`;
      case 'detail': return `🔍 Detail: ${selectedPR ? `#${selectedPR.number}` : ''}`;
      case 'search': return '🔍 Search';
      case 'review': return '✅ Review';
      case 'create': return '📝 Create PR';
      case 'merge_form': return '🔀 Merge PR';
      default: return mode;
    }
  };

  const getStatusIndicator = () => {
    if (loading) return '🔄 Loading...';
    if (error) return `❌ ${error}`;
    return '✅ Ready';
  };

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Box width="100%" justifyContent="space-between">
        <Box>
          <Text color="cyan" bold>
            {getModeDisplay()}
          </Text>
        </Box>
        
        <Box>
          <Text color={loading ? 'yellow' : error ? 'red' : 'green'}>
            {getStatusIndicator()}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}