import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  placeholder?: string;
}

export function CommentForm({ onSubmit, onCancel, loading = false, placeholder = "Write a comment..." }: CommentFormProps) {
  const [body, setBody] = useState('');

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.return && key.ctrl) {
      if (body.trim()) {
        onSubmit(body);
      }
      return;
    }

    if (key.backspace || key.delete) {
      setBody(body.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input) {
      setBody(body + input);
    }
  });

  if (loading) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="yellow">🔄 Posting comment...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <Box borderStyle="round" borderColor="cyan" padding={2} minWidth={60}>
        <Box flexDirection="column">
          <Text color="cyan" bold marginBottom={1}>
            💬 Write Comment
          </Text>

          <Box borderStyle="single" borderColor="gray" padding={1} minHeight={5} marginBottom={1}>
            <Text color="white">
              {body || <Text color="gray">{placeholder}</Text>}
              <Text color="cyan">█</Text>
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text color="gray">
              Supports GitHub Markdown syntax:
            </Text>
          </Box>
          
          <Box flexDirection="column" marginTop={1}>
            <Text color="gray">• **bold** and *italic* text</Text>
            <Text color="gray">• `code` and ```code blocks```</Text>
            <Text color="gray">• @mentions and #issue references</Text>
            <Text color="gray">• [links](url) and lists</Text>
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