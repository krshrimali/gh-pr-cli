import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ScrollableBoxProps {
  children: React.ReactNode;
  height: number;
  showScrollbar?: boolean;
  border?: boolean;
  borderColor?: string;
  title?: string;
  onScroll?: (offset: number) => void;
}

export function ScrollableBox({ 
  children, 
  height, 
  showScrollbar = true,
  border = true,
  borderColor = 'gray',
  title,
  onScroll
}: ScrollableBoxProps) {
  const [scrollOffset, setScrollOffset] = useState(0);
  
  const maxHeight = height - (border ? 2 : 0) - (title ? 1 : 0);
  // Estimate content height based on children count (simplified)
  const contentHeight = React.Children.count(children) * 3; // rough estimate
  const maxScroll = Math.max(0, contentHeight - maxHeight);

  const handleScroll = (newOffset: number) => {
    const clampedOffset = Math.max(0, Math.min(maxScroll, newOffset));
    setScrollOffset(clampedOffset);
    onScroll?.(clampedOffset);
  };

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      handleScroll(scrollOffset - 1);
    } else if (key.downArrow || input === 'j') {
      handleScroll(scrollOffset + 1);
    } else if (key.pageUp) {
      handleScroll(scrollOffset - maxHeight);
    } else if (key.pageDown) {
      handleScroll(scrollOffset + maxHeight);
    } else if (input === 'g') {
      handleScroll(0);
    } else if (input === 'G') {
      handleScroll(maxScroll);
    }
  });

  const renderScrollbar = () => {
    if (!showScrollbar || maxScroll === 0) return null;

    const scrollbarHeight = maxHeight;
    const thumbHeight = Math.max(1, Math.floor((maxHeight / contentHeight) * scrollbarHeight));
    const thumbPosition = Math.floor((scrollOffset / maxScroll) * (scrollbarHeight - thumbHeight));

    const scrollbarElements = [];
    for (let i = 0; i < scrollbarHeight; i++) {
      const isThumb = i >= thumbPosition && i < thumbPosition + thumbHeight;
      scrollbarElements.push(
        <Text key={i} color="gray">
          {isThumb ? '█' : '│'}
        </Text>
      );
    }

    return (
      <Box flexDirection="column" marginLeft={1}>
        {scrollbarElements}
      </Box>
    );
  };

  const boxProps = border 
    ? { borderStyle: 'single' as const, borderColor } 
    : {};

  return (
    <Box flexDirection="column" height={height}>
      {title && (
        <Box borderStyle="single" borderColor={borderColor} paddingX={1}>
          <Text color="cyan" bold>{title}</Text>
        </Box>
      )}
      
      <Box flexDirection="row" flexGrow={1} {...boxProps}>
        <Box flexDirection="column" flexGrow={1} height={maxHeight} overflow="hidden">
          <Box 
            flexDirection="column" 
            marginTop={-scrollOffset}
          >
            {children}
          </Box>
        </Box>
        {renderScrollbar()}
      </Box>

      {(showScrollbar && maxScroll > 0) && (
        <Box borderStyle="single" borderColor={borderColor} paddingX={1}>
          <Text color="gray">
            {scrollOffset + 1}-{Math.min(scrollOffset + maxHeight, contentHeight)} / {contentHeight}
          </Text>
        </Box>
      )}
    </Box>
  );
}