import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { ReviewState, PendingComment } from '../types/github.js';

interface ReviewFormProps {
  onSubmit: (state: ReviewState, body: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  pendingComments?: PendingComment[];
  onDeletePendingComment?: (id: string) => void;
}

export function ReviewForm({ onSubmit, onCancel, loading = false, pendingComments, onDeletePendingComment }: ReviewFormProps) {
  const [selectedState, setSelectedState] = useState<ReviewState>('comment');
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<'select' | 'comment'>('select');

  useInput((input, key) => {
    // Ctrl+q to cancel/go back
    if (key.ctrl && input === 'q') {
      if (mode === 'comment') {
        setMode('select');
      } else {
        onCancel();
      }
      return;
    }

    // Only handle other shortcuts in select mode
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
    }
  }, { isActive: !loading });

  const handleSubmit = () => {
    if (body.trim() || selectedState === 'approve') {
      onSubmit(selectedState, body || 'Approved');
    }
  };

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
        <Box borderStyle="round" borderColor="cyan" padding={2} minWidth={70}>
          <Box flexDirection="column">
            <Text color="cyan" bold marginBottom={1}>
              ✍️  Write Review Comment
            </Text>

            <Box marginBottom={1}>
              <Text color="white">
                Review Type: <Text color="yellow" bold>{selectedState.replace('_', ' ').toUpperCase()}</Text>
              </Text>
            </Box>

            <Box borderStyle="double" borderColor="cyan" padding={1} minHeight={3} marginBottom={1}>
              <Box flexDirection="column" width="100%">
                <Text color="gray" dimColor marginBottom={1}>
                  💬 Type your review comment:
                </Text>
                <TextInput
                  value={body}
                  onChange={setBody}
                  onSubmit={handleSubmit}
                  placeholder="Enter your review comment (optional for approvals)..."
                />
              </Box>
            </Box>

            <Box justifyContent="center" marginTop={1}>
              <Text color="green" bold>✓ Enter: Submit review</Text>
              <Text color="gray"> • </Text>
              <Text color="red" bold>✗ Ctrl+q: Back to review type selection</Text>
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

          {/* Pending Comments Summary */}
          {pendingComments && pendingComments.length > 0 && (
            <Box flexDirection="column" borderStyle="single" borderColor="yellow" padding={1} marginBottom={2}>
              <Text color="yellow" bold marginBottom={1}>
                📝 {pendingComments.length} Pending Comment{pendingComments.length !== 1 ? 's' : ''}
              </Text>
              <Box flexDirection="column">
                {pendingComments.slice(0, 3).map((comment) => (
                  <Box key={comment.id} flexDirection="column" marginBottom={1}>
                    <Text color="gray">
                      {comment.path}:{comment.line}
                    </Text>
                    <Text color="white">
                      {comment.body.substring(0, 40)}
                      {comment.body.length > 40 ? '...' : ''}
                    </Text>
                  </Box>
                ))}
                {pendingComments.length > 3 && (
                  <Text color="gray">
                    ... and {pendingComments.length - 3} more
                  </Text>
                )}
              </Box>
              <Text color="gray" marginTop={1}>
                These will be submitted with your review
              </Text>
            </Box>
          )}

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