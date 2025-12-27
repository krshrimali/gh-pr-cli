import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface SearchBoxProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onCancel: () => void;
}

export function SearchBox({ query, onQueryChange, onSearch, onCancel }: SearchBoxProps) {
  const [currentQuery, setCurrentQuery] = useState(query);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.return) {
      onQueryChange(currentQuery);
      onSearch(currentQuery);
      onCancel();
    } else if (key.backspace || key.delete) {
      const newQuery = currentQuery.slice(0, -1);
      setCurrentQuery(newQuery);
    } else if (!key.ctrl && !key.meta && input) {
      const newQuery = currentQuery + input;
      setCurrentQuery(newQuery);
    }
  });

  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <Box borderStyle="round" borderColor="cyan" padding={2} minWidth={60}>
        <Box flexDirection="column">
          <Text color="cyan" bold marginBottom={1}>
            🔍 Search Pull Requests
          </Text>
          
          <Box borderStyle="single" borderColor="gray" paddingX={1}>
            <Text color="white">
              {currentQuery}
              <Text color="cyan">█</Text>
            </Text>
          </Box>

          <Box marginTop={2}>
            <Text color="gray">
              Type your search query and press Enter to search.
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text color="yellow">
              Examples:
            </Text>
          </Box>
          
          <Box flexDirection="column" marginTop={1}>
            <Text color="gray">• "bug fix" - Search in title and body</Text>
            <Text color="gray">• "author:username" - PRs by specific author</Text>
            <Text color="gray">• "label:bug" - PRs with bug label</Text>
            <Text color="gray">• "state:closed" - Closed PRs</Text>
            <Text color="gray">• "base:main" - PRs targeting main branch</Text>
          </Box>

          <Box marginTop={2} justifyContent="center">
            <Text color="gray">
              ESC: Cancel • Enter: Search
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}