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
  currentState: 'open' | 'closed' | 'all';
}

export function PRList({ prs, selectedIndex, loading, error, currentState }: PRListProps) {
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

  const getStateFilterDisplay = () => {
    const stateInfo = {
      open: { label: 'Open', icon: '🟢', key: '1' },
      closed: { label: 'Closed', icon: '🔴', key: '2' },
      all: { label: 'All', icon: '📋', key: '3' }
    };

    return (
      <Box borderStyle="single" borderColor="gray" padding={1} marginBottom={1}>
        <Box>
          <Text color="white" bold>Filter: </Text>
          {Object.entries(stateInfo).map(([state, info], index) => (
            <Text key={state}>
              <Text color={currentState === state ? 'cyan' : 'gray'} bold={currentState === state}>
                {info.icon} {info.label}
              </Text>
              <Text color="gray"> ({info.key})</Text>
              {index < Object.entries(stateInfo).length - 1 && <Text color="gray"> • </Text>}
            </Text>
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box flexDirection="column" height="100%">
        <Box justifyContent="center" alignItems="center" flex={1}>
          <Box flexDirection="column" alignItems="center">
            <Text color="yellow">🔄 Loading {currentState} pull requests...</Text>
            <Text color="gray" marginTop={1}>
              Current filter: {currentState.toUpperCase()}
            </Text>
          </Box>
        </Box>
        
        <Box borderStyle="single" borderColor="gray" padding={1}>
          <Text color="gray">
            1/2/3: Filter • /: Search • c: Create PR • r: Refresh • q: Quit
          </Text>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" height="100%">
        <Box justifyContent="center" alignItems="center" flex={1}>
          <Box flexDirection="column" alignItems="center">
            <Text color="red" bold>❌ Error loading {currentState} pull requests</Text>
            <Text color="red" marginTop={1}>{error}</Text>
            <Text color="gray" marginTop={2}>
              Press 'r' to refresh or try switching filters:
            </Text>
            <Box marginTop={1}>
              <Text color="cyan">Press 1</Text>
              <Text color="gray"> for open PRs • </Text>
              <Text color="cyan">Press 2</Text>
              <Text color="gray"> for closed PRs • </Text>
              <Text color="cyan">Press 3</Text>
              <Text color="gray"> for all PRs</Text>
            </Box>
          </Box>
        </Box>
        
        <Box borderStyle="single" borderColor="gray" padding={1}>
          <Text color="gray">
            1/2/3: Filter • r: Refresh • /: Search • c: Create PR • q: Quit
          </Text>
        </Box>
      </Box>
    );
  }

  if (prs.length === 0) {
    return (
      <Box flexDirection="column" height="100%">
        {getStateFilterDisplay()}
        
        <Box justifyContent="center" alignItems="center" flex={1}>
          <Box flexDirection="column" alignItems="center">
            <Text color="gray" bold>No {currentState} pull requests found</Text>
            <Text color="gray" marginTop={1}>
              Try switching to a different filter:
            </Text>
            <Box marginTop={1}>
              <Text color="cyan">Press 1</Text>
              <Text color="gray"> for open PRs • </Text>
              <Text color="cyan">Press 2</Text>
              <Text color="gray"> for closed PRs • </Text>
              <Text color="cyan">Press 3</Text>
              <Text color="gray"> for all PRs</Text>
            </Box>
            {currentState === 'open' && (
              <Text color="yellow" marginTop={1}>
                💡 Try creating a PR with 'c' or check closed PRs with '2'
              </Text>
            )}
          </Box>
        </Box>

        <Box borderStyle="single" borderColor="gray" padding={1}>
          <Text color="gray">
            1/2/3: Filter • /: Search • c: Create PR • r: Refresh • q: Quit
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <ScrollableBox height={25} title={`🔍 ${currentState.charAt(0).toUpperCase() + currentState.slice(1)} Pull Requests (${prs.length})`} borderColor="cyan">
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
          ↑↓/j/k: Navigate • Enter: View PR • b: Open in browser • /: Search • 1/2/3: Filter • c: Create PR • r: Refresh • q: Quit
        </Text>
      </Box>
    </Box>
  );
}