import React from 'react';
import { Box, Text } from 'ink';
import { formatDistanceToNow } from 'date-fns';
import chalk from 'chalk';
import { ScrollableBox } from './ScrollableBox.js';
import type { PullRequest } from '../types/github.js';

interface PRListProps {
  prs: PullRequest[];
  selectedIndex: number;
  onSelect: (pr: PullRequest) => void;
  loading: boolean;
  error: string | null;
}

export function PRList({ prs, selectedIndex, loading, error }: PRListProps) {
  if (loading) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="yellow">🔄 Loading pull requests...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  if (prs.length === 0) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="gray">No pull requests found</Text>
      </Box>
    );
  }

  const getStateColor = (state: string, draft: boolean) => {
    if (draft) return 'gray';
    switch (state) {
      case 'open': return 'green';
      case 'merged': return 'magenta';
      case 'closed': return 'red';
      default: return 'white';
    }
  };

  const getStateIcon = (state: string, draft: boolean) => {
    if (draft) return '📝';
    switch (state) {
      case 'open': return '🟢';
      case 'merged': return '🟣';
      case 'closed': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <ScrollableBox height={25} title={`🔍 Pull Requests (${prs.length})`} borderColor="cyan">
        <Box flexDirection="column" paddingX={1}>
          {prs.map((pr, index) => {
            const isSelected = index === selectedIndex;
            const stateColor = getStateColor(pr.state, pr.draft);
            const stateIcon = getStateIcon(pr.state, pr.draft);
            const timeAgo = formatDistanceToNow(new Date(pr.updated_at), { addSuffix: true });

            return (
              <Box
                key={pr.id}
                borderStyle={isSelected ? 'round' : 'single'}
                borderColor={isSelected ? 'cyan' : 'gray'}
                paddingX={1}
                paddingY={1}
                marginBottom={1}
                backgroundColor={isSelected ? 'blue' : undefined}
              >
                <Box width="100%" flexDirection="column">
                  <Box>
                    <Text color={isSelected ? 'white' : stateColor} bold>
                      {stateIcon} #{pr.number}
                    </Text>
                    <Text color={isSelected ? 'white' : 'white'} bold marginLeft={1}>
                      {pr.title}
                    </Text>
                    {isSelected && (
                      <Text color="white" marginLeft={2}>
                        ← Press Enter to view
                      </Text>
                    )}
                  </Box>
                  
                  <Box marginTop={1}>
                    <Text color={isSelected ? 'white' : 'gray'}>
                      by {pr.user.login} • {timeAgo}
                    </Text>
                    
                    {pr.labels.length > 0 && (
                      <Box marginLeft={2}>
                        {pr.labels.slice(0, 3).map(label => (
                          <Text key={label.id} color={isSelected ? 'white' : 'yellow'} marginRight={1}>
                            🏷️ {label.name}
                          </Text>
                        ))}
                        {pr.labels.length > 3 && (
                          <Text color={isSelected ? 'white' : 'gray'}>+{pr.labels.length - 3} more</Text>
                        )}
                      </Box>
                    )}
                  </Box>

                  <Box marginTop={1}>
                    <Text color={isSelected ? 'white' : 'green'}>+{pr.additions}</Text>
                    <Text color={isSelected ? 'white' : 'red'} marginLeft={1}>-{pr.deletions}</Text>
                    <Text color={isSelected ? 'white' : 'gray'} marginLeft={2}>
                      📄 {pr.changed_files} files
                    </Text>
                    <Text color={isSelected ? 'white' : 'blue'} marginLeft={2}>
                      💬 {pr.comments + pr.review_comments} comments
                    </Text>
                    <Text color={isSelected ? 'white' : 'yellow'} marginLeft={2}>
                      📝 {pr.commits} commits
                    </Text>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </ScrollableBox>

      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Text color="gray">
          ↑↓/j/k: Navigate • Enter: View PR • b: Open in browser • /: Search • c: Create PR • r: Refresh • q: Quit
        </Text>
      </Box>
    </Box>
  );
}