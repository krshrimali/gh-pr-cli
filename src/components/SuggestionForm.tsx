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
  const [isEditingText, setIsEditingText] = useState(false);
  const [editTimeout, setEditTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize suggestion with original lines
  useEffect(() => {
    setSuggestionText(originalLines.join('\n'));
  }, [originalLines]);

  // Reset editing state when switching modes
  useEffect(() => {
    setIsEditingText(false);
    if (editTimeout) {
      clearTimeout(editTimeout);
      setEditTimeout(null);
    }
  }, [mode, editTimeout]);

  // Helper function to manage editing timeout
  const startEditingTimeout = () => {
    if (editTimeout) {
      clearTimeout(editTimeout);
    }
    setIsEditingText(true);
    const timeout = setTimeout(() => {
      setIsEditingText(false);
      setEditTimeout(null);
    }, 2000); // 2 seconds of inactivity before allowing navigation
    setEditTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (editTimeout) {
        clearTimeout(editTimeout);
      }
    };
  }, [editTimeout]);

  useInput((input, key) => {
    // Always allow these shortcuts regardless of editing state
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.ctrl && input === 's') {
      handleSubmit();
      return;
    }

    // Only allow mode switching when not editing text
    if (!isEditingText) {
      if (key.tab && !key.shift) {
        // Tab to go to next mode
        setMode(mode === 'suggestion' ? 'comment' : 'suggestion');
        return;
      }

      if (key.tab && key.shift) {
        // Shift+Tab to go to previous mode
        setMode(mode === 'comment' ? 'suggestion' : 'comment');
        return;
      }
    }
  });

  const handleSubmit = () => {
    if (suggestionText.trim() !== originalLines.join('\n')) {
      onSubmit(suggestionText, commentText.trim() || undefined);
    } else {
      // No changes made
      onCancel();
    }
  };

  const lineRange = endLine && endLine !== startLine 
    ? `${startLine}-${endLine}` 
    : startLine.toString();

  return (
    <Box position="absolute" top={2} left={2} right={2} bottom={2}>
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
        <Box flexDirection="column" flex={1}>
          {mode === 'suggestion' ? (
            <Box flexDirection="column" height="100%">
              <Text color="green" marginBottom={1}>
                Edit the code below (this will replace the original):
              </Text>
              <Box borderStyle="single" borderColor="green" padding={1} flex={1}>
                <TextInput
                  value={suggestionText}
                  onChange={(value) => {
                    setSuggestionText(value);
                    startEditingTimeout();
                  }}
                  onSubmit={() => setIsEditingText(false)}
                  placeholder="Edit the code..."
                  focus={mode === 'suggestion'}
                />
              </Box>
            </Box>
          ) : (
            <Box flexDirection="column" height="100%">
              <Text color="cyan" marginBottom={1}>
                Explain your suggestion (optional):
              </Text>
              <Box borderStyle="single" borderColor="cyan" padding={1} flex={1}>
                <TextInput
                  value={commentText}
                  onChange={(value) => {
                    setCommentText(value);
                    startEditingTimeout();
                  }}
                  onSubmit={() => setIsEditingText(false)}
                  placeholder="Why this change is needed..."
                  focus={mode === 'comment'}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer with instructions */}
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