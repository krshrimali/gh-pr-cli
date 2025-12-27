import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  placeholder?: string;
}

export function CommentForm({ onSubmit, onCancel, loading = false, placeholder = "Write a comment..." }: CommentFormProps) {
  const [body, setBody] = useState('');

  useInput((input, key) => {
    // Ctrl+q to cancel and go back
    if (key.ctrl && input === 'q') {
      onCancel();
      return;
    }
  }, { isActive: !loading });

  const handleSubmit = () => {
    if (body.trim()) {
      onSubmit(body);
      setBody('');
    }
  };

  if (loading) {
    return (
      <Box justifyContent="center" alignItems="center" height="100%">
        <Text color="yellow">🔄 Posting comment...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <Box borderStyle="round" borderColor="cyan" padding={2} minWidth={70}>
        <Box flexDirection="column">
          <Text color="cyan" bold marginBottom={1}>
            💬 Write Comment
          </Text>

          <Box borderStyle="double" borderColor="cyan" padding={1} minHeight={3} marginBottom={1}>
            <Box flexDirection="column" width="100%">
              <Text color="gray" dimColor marginBottom={1}>
                ✍️  Type your comment:
              </Text>
              <TextInput
                value={body}
                onChange={setBody}
                onSubmit={handleSubmit}
                placeholder={placeholder}
              />
            </Box>
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

          <Box justifyContent="center" marginTop={1}>
            <Text color="green" bold>✓ Enter: Submit</Text>
            <Text color="gray"> • </Text>
            <Text color="red" bold>✗ Ctrl+q: Cancel</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}