import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { ReviewComment } from '../types/github.js';

interface InlineReviewFormProps {
  file: string;
  line: number;
  startLine?: number;
  replyingTo?: ReviewComment;
  onSubmit: (comment: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function InlineReviewForm({ file, line, startLine, replyingTo, onSubmit, onCancel, loading = false }: InlineReviewFormProps) {
  const [comment, setComment] = useState('');

  useInput((input, key) => {
    // Ctrl+q to cancel and go back
    if (key.ctrl && input === 'q') {
      onCancel();
      return;
    }
  }, { isActive: !loading });

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment);
      setComment('');
    }
  };

  if (loading) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="yellow">🔄 Adding review comment...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <Box borderStyle="round" borderColor="yellow" padding={2} minWidth={70}>
        <Box flexDirection="column">
          <Text color="yellow" bold marginBottom={1}>
            {replyingTo ? '↳ Reply to Comment' : '📝 Add Pending Review Comment'}
          </Text>

          {replyingTo && (
            <Box borderStyle="single" borderColor="gray" padding={1} marginBottom={1}>
              <Box flexDirection="column">
                <Text color="gray">Replying to {replyingTo.user.login}:</Text>
                <Text color="white">
                  {replyingTo.body.substring(0, 60)}
                  {replyingTo.body.length > 60 ? '...' : ''}
                </Text>
              </Box>
            </Box>
          )}

          <Box marginBottom={1}>
            <Text color="white">
              File: <Text color="cyan">{file}</Text>
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text color="white">
              {startLine ? (
                <>Line: <Text color="cyan">{startLine}-{line}</Text></>
              ) : (
                <>Line: <Text color="cyan">{line}</Text></>
              )}
            </Text>
          </Box>

          <Box borderStyle="double" borderColor="cyan" padding={1} minHeight={3} marginBottom={1}>
            <Box flexDirection="column" width="100%">
              <Text color="gray" dimColor marginBottom={1}>
                💬 Type your comment:
              </Text>
              <TextInput
                value={comment}
                onChange={setComment}
                onSubmit={handleSubmit}
                placeholder="Enter your review comment here..."
              />
            </Box>
          </Box>

          <Box marginTop={1}>
            <Text color="gray">
              {replyingTo
                ? 'This reply will be added as pending and submitted with your review'
                : 'This comment will be added as pending and submitted with your review'
              }
            </Text>
          </Box>

          <Box justifyContent="center" marginTop={1}>
            <Text color="green" bold>✓ Enter: Submit comment</Text>
            <Text color="gray"> • </Text>
            <Text color="red" bold>✗ Ctrl+q: Cancel and return to diff</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}