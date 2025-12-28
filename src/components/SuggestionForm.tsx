import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface SuggestionFormProps {
  onSubmit: (suggestion: string, comment?: string) => void;
  onCancel: () => void;
  originalLines: string[];
  filePath: string;
  startLine: number;
  endLine?: number;
}

export function SuggestionForm({ onSubmit, onCancel, originalLines, filePath, startLine, endLine }: SuggestionFormProps) {
  const [mode, setMode] = useState<'suggestion' | 'comment'>('suggestion');
  const [suggestionText, setSuggestionText] = useState('');
  const [commentText, setCommentText] = useState('');

  // Initialize suggestion with original lines
  useEffect(() => {
    const text = originalLines.join('\n');
    setSuggestionText(text);
  }, [originalLines]);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.ctrl && input === 's') {
      handleSubmit();
      return;
    }

    if (key.tab && !key.shift) {
      setMode(mode === 'suggestion' ? 'comment' : 'suggestion');
      return;
    }

    if (key.tab && key.shift) {
      setMode(mode === 'comment' ? 'suggestion' : 'comment');
      return;
    }
  });

  const handleSubmit = () => {
    if (suggestionText.trim() !== originalLines.join('\n')) {
      onSubmit(suggestionText, commentText.trim() || undefined);
    } else {
      onCancel();
    }
  };

  const lineRange = endLine && endLine !== startLine 
    ? `${startLine}-${endLine}` 
    : startLine.toString();

  return (
    <Box position="absolute" top={0} left={0} right={0} bottom={0}>
      <Box 
        flexDirection="column" 
        height="100%" 
        width="100%"
        borderStyle="double" 
        borderColor="green" 
        backgroundColor="black"
        padding={1}
      >
        {/* Header */}
        <Box marginBottom={1} justifyContent="space-between">
          <Text color="green" bold>
            💡 Create Suggestion for {filePath}:{lineRange}
          </Text>
          <Text color="gray">
            ESC: Cancel • Ctrl+S: Submit
          </Text>
        </Box>

        {/* Mode tabs */}
        <Box marginBottom={1}>
          <Text color={mode === 'suggestion' ? 'green' : 'gray'} bold>
            [Tab] Code
          </Text>
          <Text color="white"> • </Text>
          <Text color={mode === 'comment' ? 'cyan' : 'gray'} bold>
            [Shift+Tab] Comment
          </Text>
          <Text color="white"> • Press Tab to switch modes</Text>
        </Box>

        {/* Current mode content */}
        <Box flexDirection="column" flexGrow={1}>
          {mode === 'suggestion' ? (
            <Box flexDirection="column" height="100%">
              <Text color="green" marginBottom={1}>
                Edit the code below (original content loaded):
              </Text>
              <Box borderStyle="single" borderColor="green" padding={1} flexGrow={1}>
                <Box flexDirection="column" width="100%">
                  <Text color="gray" marginBottom={1}>
                    Original: {originalLines.length} lines
                  </Text>
                  <TextInput
                    value={suggestionText}
                    onChange={setSuggestionText}
                    placeholder="Code will appear here..."
                  />
                </Box>
              </Box>
            </Box>
          ) : (
            <Box flexDirection="column" height="100%">
              <Text color="cyan" marginBottom={1}>
                Explain your suggestion (optional):
              </Text>
              <Box borderStyle="single" borderColor="cyan" padding={1} flexGrow={1}>
                <TextInput
                  value={commentText}
                  onChange={setCommentText}
                  placeholder="Why this change is needed..."
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
          <Box justifyContent="space-between">
            <Text color="white">
              Current: {mode === 'suggestion' ? 'Editing Code' : 'Adding Comment'}
            </Text>
            <Text color="gray">
              Changes: {suggestionText !== originalLines.join('\n') ? '✓ Modified' : '○ None'}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}