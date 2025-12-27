import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ReviewState } from '../types/github.js';

interface ReviewFormProps {
  onSubmit: (state: ReviewState, body: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ReviewForm({ onSubmit, onCancel, loading = false }: ReviewFormProps) {
  const [selectedState, setSelectedState] = useState<ReviewState>('comment');
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<'select' | 'comment'>('select');

  useInput((input, key) => {
    if (key.escape) {
      if (mode === 'comment') {
        setMode('select');
      } else {
        onCancel();
      }
      return;
    }

    if (mode === 'select') {
      if (input === 'a') {
        setSelectedState('approve');
      } else if (input === 'r') {
        setSelectedState('request_changes');
      } else if (input === 'c') {
        setSelectedState('comment');
      } else if (key.return) {
        if (selectedState === 'approve') {
          onSubmit(selectedState, body || 'Approved');
        } else {
          setMode('comment');
        }
      }
    } else if (mode === 'comment') {
      if (key.return && key.ctrl) {
        onSubmit(selectedState, body);
      } else if (key.backspace || key.delete) {
        setBody(body.slice(0, -1));
      } else if (!key.ctrl && !key.meta && input) {
        setBody(body + input);
      }
    }
  });

  if (loading) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="yellow">🔄 Submitting review...</Text>
      </Box>
    );
  }

  if (mode === 'comment') {
    return (
      <Box flexDirection="column" justifyContent="center" alignItems="center" height="100%">
        <Box borderStyle="round" borderColor="cyan" padding={2} minWidth={60}>
          <Box flexDirection="column">
            <Text color="cyan" bold marginBottom={1}>
              ✍️  Write Review Comment
            </Text>

            <Box marginBottom={1}>
              <Text color="white">
                Review Type: <Text color="yellow" bold>{selectedState.replace('_', ' ').toUpperCase()}</Text>
              </Text>
            </Box>

            <Box borderStyle="single" borderColor="gray" padding={1} minHeight={5} marginBottom={1}>
              <Text color="white">
                {body}
                <Text color="cyan">█</Text>
              </Text>
            </Box>

            <Box justifyContent="center" marginTop={1}>
              <Text color="gray">
                Ctrl+Enter: Submit • ESC: Back
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  const getStateColor = (state: ReviewState) => {
    switch (state) {
      case 'approve': return 'green';
      case 'request_changes': return 'red';
      case 'comment': return 'yellow';
    }
  };

  const getStateIcon = (state: ReviewState) => {
    switch (state) {
      case 'approve': return '✅';
      case 'request_changes': return '❌';
      case 'comment': return '💬';
    }
  };

  const getStateDescription = (state: ReviewState) => {
    switch (state) {
      case 'approve': return 'Submit an approving review';
      case 'request_changes': return 'Request changes to the PR';
      case 'comment': return 'Comment without explicit approval';
    }
  };

  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <Box borderStyle="round" borderColor="cyan" padding={2} minWidth={60}>
        <Box flexDirection="column">
          <Text color="cyan" bold marginBottom={2}>
            🔍 Submit Review
          </Text>

          <Box flexDirection="column" marginBottom={2}>
            {(['approve', 'request_changes', 'comment'] as ReviewState[]).map((state) => {
              const isSelected = state === selectedState;
              const color = getStateColor(state);

              return (
                <Box
                  key={state}
                  borderStyle={isSelected ? 'round' : undefined}
                  borderColor={isSelected ? color as any : undefined}
                  paddingX={1}
                  marginBottom={1}
                >
                  <Box width="100%">
                    <Text color={color as any} bold>
                      {getStateIcon(state)} {state.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text color="gray" marginLeft={2}>
                      - {getStateDescription(state)}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box justifyContent="center" marginTop={1}>
            <Text color="gray">
              a: Approve • r: Request Changes • c: Comment • Enter: Next • ESC: Cancel
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}