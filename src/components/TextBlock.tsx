import React from 'react';
import { Box, Text } from 'ink';

interface TextBlockProps {
  content: string;
  maxWidth?: number;
}

export function TextBlock({ content, maxWidth = 80 }: TextBlockProps) {
  // Simple word wrapping function
  const wrapText = (text: string, width: number): string[] => {
    if (!text) return [''];
    
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= width) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Handle very long words by breaking them
          if (word.length > width) {
            for (let i = 0; i < word.length; i += width) {
              lines.push(word.slice(i, i + width));
            }
          } else {
            lines.push(word);
          }
        }
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
  };

  const lines = content.split('\n').flatMap(line => wrapText(line, maxWidth));

  return (
    <Box flexDirection="column">
      {lines.map((line, index) => (
        <Text key={index} color="white">
          {line}
        </Text>
      ))}
    </Box>
  );
}