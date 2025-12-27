import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { openInBrowser } from '../utils/browser.js';
import { InlineReviewForm } from './InlineReviewForm.js';
import type { File, PendingComment, ReviewComment } from '../types/github.js';
import type { GitHubService } from '../services/github.js';
import { groupCommentsByThread } from '../utils/commentThreads.js';

interface DiffViewerProps {
  file: File;
  onBack: () => void;
  height?: number;
  githubService: GitHubService;
  prNumber: number;
  commitSha: string;
  onAddPendingComment: (path: string, line: number, body: string, startLine?: number, inReplyTo?: number) => void;
  pendingComments: PendingComment[];
  existingComments: ReviewComment[];
}

interface ParsedDiffLine {
  type: 'header' | 'context' | 'add' | 'remove' | 'hunk';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
  originalLine: string;
}

export function DiffViewer({ file, onBack, height = 20, githubService, prNumber, commitSha, onAddPendingComment, pendingComments, existingComments }: DiffViewerProps) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [wrapLines, setWrapLines] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [diffLines, setDiffLines] = useState<ParsedDiffLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentFormLine, setCommentFormLine] = useState<number | null>(null);
  const [commentFormStartLine, setCommentFormStartLine] = useState<number | undefined>(undefined);
  const [replyingToComment, setReplyingToComment] = useState<ReviewComment | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Group comments by thread for display
  const commentThreads = groupCommentsByThread(existingComments);

  useEffect(() => {
    if (file.patch) {
      setDiffLines(parseDiff(file.patch));
    } else {
      setDiffLines([]);
    }
    setScrollOffset(0);
  }, [file]);

  const parseDiff = (patch: string): ParsedDiffLine[] => {
    const lines = patch.split('\n');
    const parsed: ParsedDiffLine[] = [];
    let oldLineNum = 0;
    let newLineNum = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // Hunk header
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          oldLineNum = parseInt(match[1]);
          newLineNum = parseInt(match[2]);
        }
        parsed.push({
          type: 'hunk',
          content: line,
          originalLine: line,
        });
      } else if (line.startsWith('+++') || line.startsWith('---')) {
        // File header
        parsed.push({
          type: 'header',
          content: line,
          originalLine: line,
        });
      } else if (line.startsWith('+')) {
        // Addition
        parsed.push({
          type: 'add',
          content: line.substring(1),
          newLineNumber: newLineNum++,
          originalLine: line,
        });
      } else if (line.startsWith('-')) {
        // Deletion
        parsed.push({
          type: 'remove',
          content: line.substring(1),
          oldLineNumber: oldLineNum++,
          originalLine: line,
        });
      } else if (line.startsWith(' ')) {
        // Context
        parsed.push({
          type: 'context',
          content: line.substring(1),
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
          originalLine: line,
        });
      } else if (line.trim() === '') {
        // Empty line
        parsed.push({
          type: 'context',
          content: '',
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
          originalLine: line,
        });
      }
    }

    return parsed;
  };

  const isCommentableLine = (line: ParsedDiffLine): boolean => {
    return line.newLineNumber !== undefined && (line.type === 'add' || line.type === 'context');
  };

  const getSelectedRange = (): { start: number; end: number } | null => {
    if (!selectionStart) return null;
    const start = Math.min(selectionStart, selectionEnd || selectionStart);
    const end = Math.max(selectionStart, selectionEnd || selectionStart);
    return { start, end };
  };

  const handleCommentSubmit = async (body: string) => {
    if (commentFormLine && file.filename) {
      onAddPendingComment(
        file.filename,
        commentFormLine,
        body,
        commentFormStartLine,
        replyingToComment?.id
      );
      setShowCommentForm(false);
      setCommentFormLine(null);
      setCommentFormStartLine(undefined);
      setReplyingToComment(null);
    }
  };

  const handleCommentCancel = () => {
    setShowCommentForm(false);
    setCommentFormLine(null);
    setCommentFormStartLine(undefined);
    setReplyingToComment(null);
  };

  const getVisibleLines = () => {
    const viewHeight = height - 4; // Account for header and footer
    const start = scrollOffset;
    const end = start + viewHeight;
    return diffLines.slice(start, end);
  };

  const wrapText = (text: string, maxWidth: number): string[] => {
    if (!wrapLines || text.length <= maxWidth) {
      return [text];
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  };

  const renderLineNumber = (line: ParsedDiffLine): string => {
    if (!showLineNumbers) return '';
    
    const oldNum = line.oldLineNumber?.toString().padStart(4, ' ') || '    ';
    const newNum = line.newLineNumber?.toString().padStart(4, ' ') || '    ';
    
    if (line.type === 'add') return `     ${newNum} `;
    if (line.type === 'remove') return ` ${oldNum}     `;
    if (line.type === 'context') return ` ${oldNum} ${newNum} `;
    return '           ';
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'add': return 'green';
      case 'remove': return 'red';
      case 'header': return 'blue';
      case 'hunk': return 'cyan';
      case 'context': return 'white';
      default: return 'white';
    }
  };

  const getLinePrefix = (type: string) => {
    switch (type) {
      case 'add': return '+';
      case 'remove': return '-';
      case 'context': return ' ';
      case 'hunk': return '@';
      case 'header': return '';
      default: return ' ';
    }
  };

  const visibleLines = getVisibleLines();
  const maxScroll = Math.max(0, diffLines.length - (height - 4));

  useInput((input, key) => {
    // If comment form is showing, don't handle input here
    if (showCommentForm) {
      return;
    }

    if (key.escape) {
      if (isSelecting) {
        // Cancel selection
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      } else {
        // Go back to files
        onBack();
      }
      return;
    }

    const maxScroll = Math.max(0, diffLines.length - (height - 4));
    const viewHeight = height - 4;

    if (key.upArrow || input === 'k') {
      // Move cursor up or scroll up
      if (currentLineIndex > 0) {
        setCurrentLineIndex(currentLineIndex - 1);
      } else if (scrollOffset > 0) {
        setScrollOffset(scrollOffset - 1);
      }
      // Update selection end if selecting
      if (isSelecting) {
        const currentLine = visibleLines[Math.max(0, currentLineIndex - 1)] || visibleLines[currentLineIndex];
        if (currentLine?.newLineNumber) {
          setSelectionEnd(currentLine.newLineNumber);
        }
      }
    } else if (key.downArrow || input === 'j') {
      // Move cursor down or scroll down
      if (currentLineIndex < viewHeight - 1 && currentLineIndex < visibleLines.length - 1) {
        setCurrentLineIndex(currentLineIndex + 1);
      } else if (scrollOffset < maxScroll) {
        setScrollOffset(scrollOffset + 1);
      }
      // Update selection end if selecting
      if (isSelecting) {
        const currentLine = visibleLines[Math.min(visibleLines.length - 1, currentLineIndex + 1)] || visibleLines[currentLineIndex];
        if (currentLine?.newLineNumber) {
          setSelectionEnd(currentLine.newLineNumber);
        }
      }
    } else if (key.pageUp) {
      setScrollOffset(Math.max(0, scrollOffset - viewHeight));
      setCurrentLineIndex(0);
    } else if (key.pageDown) {
      setScrollOffset(Math.min(maxScroll, scrollOffset + viewHeight));
      setCurrentLineIndex(0);
    } else if (input === 'g') {
      setScrollOffset(0);
      setCurrentLineIndex(0);
    } else if (input === 'G') {
      setScrollOffset(maxScroll);
      setCurrentLineIndex(Math.min(viewHeight - 1, diffLines.length - maxScroll - 1));
    } else if (input === 'c' || (isSelecting && key.return)) {
      // Handle multi-line selection
      const currentLine = visibleLines[currentLineIndex];
      if (!currentLine || !isCommentableLine(currentLine) || !currentLine.newLineNumber) {
        return;
      }

      if (!isSelecting) {
        // Start selection
        setSelectionStart(currentLine.newLineNumber);
        setSelectionEnd(currentLine.newLineNumber);
        setIsSelecting(true);
      } else {
        // Complete selection and open form
        const range = getSelectedRange();
        if (range && currentLine.newLineNumber) {
          setCommentFormLine(range.end);
          setCommentFormStartLine(range.start !== range.end ? range.start : undefined);
          setShowCommentForm(true);
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      }
    } else if (input === 'r') {
      // Reply to comment thread on current line
      const currentLine = visibleLines[currentLineIndex];
      if (!currentLine?.newLineNumber) return;

      const thread = commentThreads.get(currentLine.newLineNumber);
      if (thread) {
        setReplyingToComment(thread.topLevelComment);
        setCommentFormLine(currentLine.newLineNumber);
        setShowCommentForm(true);
      }
    } else if (input === 'w') {
      setWrapLines(!wrapLines);
    } else if (input === 'n') {
      setShowLineNumbers(!showLineNumbers);
    } else if (input === 'b') {
      // Open file diff in browser
      const fileUrl = githubService.getWebUrl(`/pull/${prNumber}/files#diff-${encodeURIComponent(file.filename)}`);
      openInBrowser(fileUrl);
    }
  }, { isActive: !showCommentForm });

  return (
    <Box flexDirection="column" height={height} width="100%">
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Box width="100%" justifyContent="space-between">
          <Text color="cyan" bold>
            📄 {file.filename}
          </Text>
          <Text color="gray">
            +{file.additions} -{file.deletions}
          </Text>
        </Box>
      </Box>

      {/* Controls */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Box width="100%" justifyContent="space-between">
          <Text color="white">
            <Text color={showLineNumbers ? 'cyan' : 'gray'}>n</Text>umbers |{' '}
            <Text color={wrapLines ? 'cyan' : 'gray'}>w</Text>rap |{' '}
            <Text color="gray">g/G</Text>: top/bottom
          </Text>
          <Text color="gray">
            {scrollOffset + 1}-{Math.min(scrollOffset + (height - 4), diffLines.length)} / {diffLines.length}
          </Text>
        </Box>
      </Box>

      {/* Diff Content */}
      <Box borderStyle="single" borderColor="gray" flexDirection="column" flexGrow={1} paddingX={1}>
        {diffLines.length === 0 ? (
          <Box justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color="gray">No diff available for this file</Text>
          </Box>
        ) : (
          visibleLines.map((line, index) => {
            const displayIndex = scrollOffset + index;
            const isCursorLine = index === currentLineIndex;
            const hasPendingComment = line.newLineNumber &&
              pendingComments.some(pc => pc.line === line.newLineNumber);
            const lineColor = getLineColor(line.type);
            const linePrefix = getLinePrefix(line.type);
            const lineNumber = renderLineNumber(line);
            const wrappedContent = wrapText(line.content, 80);

            // Check if line is in selection range
            const range = getSelectedRange();
            const isInSelection = range && line.newLineNumber &&
              line.newLineNumber >= range.start &&
              line.newLineNumber <= range.end;

            return (
              <Box key={displayIndex} flexDirection="column">
                {wrappedContent.map((wrappedLine, wrapIndex) => (
                  <Box key={`${displayIndex}-${wrapIndex}`}>
                    {/* Cursor indicator */}
                    {wrapIndex === 0 && (
                      <Text color={isCursorLine ? 'cyan' : 'gray'} bold={isCursorLine}>
                        {isCursorLine ? '>' : ' '}
                      </Text>
                    )}
                    {wrapIndex > 0 && <Text> </Text>}

                    {/* Line numbers */}
                    {wrapIndex === 0 && showLineNumbers && (
                      <Text color="gray">{lineNumber}</Text>
                    )}
                    {wrapIndex > 0 && showLineNumbers && (
                      <Text color="gray">           </Text>
                    )}

                    {/* Content */}
                    <Text
                      color={lineColor as any}
                      backgroundColor={
                        isInSelection ? 'magenta' :
                        isCursorLine && isCommentableLine(line) ? 'blue' :
                        undefined
                      }
                    >
                      {wrapIndex === 0 ? linePrefix : ' '}
                      {wrappedLine}
                    </Text>

                    {/* Pending comment indicator */}
                    {wrapIndex === 0 && hasPendingComment && (
                      <Text color="yellow" marginLeft={1}>
                        💬 pending
                      </Text>
                    )}
                  </Box>
                ))}

                {/* Existing comment threads */}
                {(() => {
                  const lineThread = line.newLineNumber ? commentThreads.get(line.newLineNumber) : null;
                  if (!lineThread) return null;

                  return (
                    <Box borderStyle="single" borderColor="gray" marginLeft={2} marginTop={1} padding={1} flexDirection="column">
                      {/* Top level comment */}
                      <Box flexDirection="column" marginBottom={1}>
                        <Text color="cyan" bold>
                          {lineThread.topLevelComment.user.login} commented:
                        </Text>
                        <Text color="white">{lineThread.topLevelComment.body}</Text>
                      </Box>

                      {/* Replies */}
                      {lineThread.replies.map(reply => (
                        <Box key={reply.id} flexDirection="column" marginLeft={2} marginBottom={1}>
                          <Text color="gray">
                            ↳ {reply.user.login} replied:
                          </Text>
                          <Text color="white">{reply.body}</Text>
                        </Box>
                      ))}

                      {/* Reply prompt */}
                      {isCursorLine && (
                        <Text color="yellow" marginTop={1}>
                          [Press 'r' to reply]
                        </Text>
                      )}
                    </Box>
                  );
                })()}
              </Box>
            );
          })
        )}
      </Box>

      {/* Status Bar */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Box width="100%" justifyContent="space-between">
          <Text color="cyan">
            {file.status.toUpperCase()} • {file.changes} changes
            {pendingComments.length > 0 && (
              <Text color="yellow">
                {' • '}{pendingComments.length} pending
              </Text>
            )}
            {isSelecting && selectionStart && selectionEnd && (
              <Text color="magenta">
                {' • '}Selecting lines {Math.min(selectionStart, selectionEnd)}-{Math.max(selectionStart, selectionEnd)}
              </Text>
            )}
          </Text>
          <Text color="gray">
            ESC: {isSelecting ? 'Cancel selection' : 'Back'} • ↑↓/j/k: Navigate • c: {isSelecting ? 'Confirm selection' : 'Comment/Select'} • r: Reply
            {' • w: Wrap • n: Line numbers • b: Open in browser'}
          </Text>
        </Box>
      </Box>

      {/* Comment Form Overlay */}
      {showCommentForm && commentFormLine && (
        <InlineReviewForm
          file={file.filename}
          line={commentFormLine}
          startLine={commentFormStartLine}
          replyingTo={replyingToComment || undefined}
          onSubmit={handleCommentSubmit}
          onCancel={handleCommentCancel}
          loading={false}
        />
      )}
    </Box>
  );
}