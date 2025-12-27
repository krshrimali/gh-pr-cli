import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface InlineReviewFormProps {
  file: string;
  line: number;
  onSubmit: (comment: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function InlineReviewForm({ file, line, onSubmit, onCancel, loading = false }: InlineReviewFormProps) {
  const [comment, setComment] = useState('');

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.return && key.ctrl) {
      if (comment.trim()) {
        onSubmit(comment);
      }
      return;
    }

    if (key.backspace || key.delete) {
      setComment(comment.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input) {
      setComment(comment + input);
    }
  });

  if (loading) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="yellow">🔄 Adding review comment...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <Box borderStyle="round" borderColor="yellow" padding={2} minWidth={60}>
        <Box flexDirection="column">
          <Text color="yellow" bold marginBottom={1}>
            📝 Add Pending Review Comment
          </Text>

          <Box marginBottom={1}>
            <Text color="white">
              File: <Text color="cyan">{file}</Text>
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text color="white">
              Line: <Text color="cyan">{line}</Text>
            </Text>
          </Box>

          <Box borderStyle="single" borderColor="gray" padding={1} minHeight={5} marginBottom={1}>
            <Text color="white">
              {comment || <Text color="gray">Write your review comment...</Text>}
              <Text color="cyan">█</Text>
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text color="gray">
              This comment will be added as pending and submitted with your review
            </Text>
          </Box>

          <Box justifyContent="center" marginTop={2}>
            <Text color="gray">
              Ctrl+Enter: Submit • ESC: Cancel
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}