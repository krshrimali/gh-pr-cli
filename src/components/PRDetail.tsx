import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { formatDistanceToNow } from 'date-fns';
import chalk from 'chalk';
import { GitHubService } from '../services/github.js';
import { ReviewForm } from './ReviewForm.js';
import { DiffViewer } from './DiffViewer.js';
import { MergeForm } from './MergeForm.js';
import { ScrollableBox } from './ScrollableBox.js';
import { TextBlock } from './TextBlock.js';
import { openInBrowser } from '../utils/browser.js';
import type { PullRequest, Comment, ReviewComment, Review, File, ReviewState, PendingComment } from '../types/github.js';

interface PRDetailProps {
  pr: PullRequest;
  githubService: GitHubService;
}

type DetailMode = 'overview' | 'files' | 'diff' | 'comments' | 'reviews' | 'review_form' | 'merge_form';

export function PRDetail({ pr, githubService }: PRDetailProps) {
  const [mode, setMode] = useState<DetailMode>('overview');
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mergeable, setMergeable] = useState<boolean | null>(null);
  const [mergeableState, setMergeableState] = useState<string>('');
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([]);

  useEffect(() => {
    loadData();
  }, [pr.number]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get fresh PR data to ensure stats are up to date
      const freshPR = await githubService.getPullRequest(pr.number);
      
      // Update PR data with fresh stats
      pr.additions = freshPR.additions;
      pr.deletions = freshPR.deletions;
      pr.changed_files = freshPR.changed_files;
      pr.comments = freshPR.comments;
      pr.review_comments = freshPR.review_comments;
      pr.commits = freshPR.commits;
      
      const [commentsData, reviewCommentsData, reviewsData, filesData, mergeabilityData] = await Promise.all([
        githubService.getComments(pr.number),
        githubService.getReviewComments(pr.number),
        githubService.getReviews(pr.number),
        githubService.getFiles(pr.number),
        githubService.checkPullRequestMergeability(pr.number),
      ]);

      setComments(commentsData);
      setReviewComments(reviewCommentsData);
      setReviews(reviewsData);
      setFiles(filesData);
      setMergeable(mergeabilityData.mergeable);
      setMergeableState(mergeabilityData.mergeable_state);
    } catch (error) {
      console.error('Failed to load PR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPendingComment = (path: string, line: number, body: string) => {
    const newComment: PendingComment = {
      id: crypto.randomUUID(),
      path,
      line,
      body,
    };
    setPendingComments([...pendingComments, newComment]);
  };

  const deletePendingComment = (id: string) => {
    setPendingComments(pendingComments.filter(c => c.id !== id));
  };

  const clearPendingComments = () => {
    setPendingComments([]);
  };

  useInput((input, key) => {
    // Mode switching
    if (input === 'o') setMode('overview');
    if (input === 'f') setMode('files');
    if (input === 'd') setMode('diff');
    if (input === 'c') setMode('comments');
    if (input === 'r') setMode('reviews');
    if (input === 'R' && mode !== 'review_form') setMode('review_form');
    if (input === 'M' && mode !== 'merge_form' && pr.state === 'open') setMode('merge_form');
    
    // Browser shortcuts
    if (input === 'b') {
      if (mode === 'files' && files[selectedIndex]) {
        // Open file in GitHub browser
        const fileUrl = githubService.getWebUrl(`/pull/${pr.number}/files#diff-${encodeURIComponent(files[selectedIndex].filename)}`);
        openInBrowser(fileUrl);
      } else {
        // Open PR in browser
        const prUrl = githubService.getWebUrl(`/pull/${pr.number}`);
        openInBrowser(prUrl);
      }
    }

    // Navigation
    const currentItems = getCurrentItems();
    if (key.upArrow || input === 'k') {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(Math.min(currentItems.length - 1, selectedIndex + 1));
    } else if (key.return && mode === 'files' && files[selectedIndex]) {
      // Open diff view for selected file
      setSelectedFile(files[selectedIndex]);
      setMode('diff');
    }
  });

  const submitReview = async (state: ReviewState, body: string) => {
    setReviewLoading(true);
    try {
      const comments = pendingComments.length > 0
        ? pendingComments.map(pc => ({
            path: pc.path,
            line: pc.line,
            body: pc.body,
          }))
        : undefined;

      await githubService.createReview(pr.number, state, body, comments);
      await loadData(); // Reload to show new review
      clearPendingComments(); // Clear after success
      setMode('reviews');
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const cancelReview = () => {
    setMode('overview');
  };

  const mergePullRequest = async (options: {
    commit_title: string;
    commit_message: string;
    merge_method: 'merge' | 'squash' | 'rebase';
  }) => {
    setMergeLoading(true);
    try {
      const result = await githubService.mergePullRequest(pr.number, options);
      console.log(`✅ Pull request merged: ${result.sha}`);
      
      // Update PR state
      pr.state = 'closed';
      
      // Reload data to get updated state
      await loadData();
      setMode('overview');
    } catch (error) {
      console.error('❌ Failed to merge PR:', error);
    } finally {
      setMergeLoading(false);
    }
  };

  const cancelMerge = () => {
    setMode('overview');
  };


  const getCurrentItems = () => {
    switch (mode) {
      case 'files': return files;
      case 'comments': return comments;
      case 'reviews': return reviews;
      default: return [];
    }
  };

  const renderOverview = () => (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text color="cyan" bold>
            #{pr.number}: {pr.title}
          </Text>
          <Text color="gray">
            by {pr.user.login} • {formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}
          </Text>
          <Text color="gray">
            {pr.base.ref} ← {pr.head.ref}
          </Text>
        </Box>
      </Box>

      {pr.body && (
        <Box borderStyle="single" borderColor="gray" padding={1} marginBottom={1}>
          <Box flexDirection="column">
            <Text color="white" bold marginBottom={1}>Description:</Text>
            <TextBlock content={pr.body} maxWidth={65} />
          </Box>
        </Box>
      )}

      <Box flexDirection="column" marginBottom={1}>
        <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
          <Box flexDirection="column">
            <Text color="white" bold>📊 Changes:</Text>
            <Text color="green">+{pr.additions} additions</Text>
            <Text color="red">-{pr.deletions} deletions</Text>
            <Text color="gray">{pr.changed_files} files changed</Text>
          </Box>

          <Box flexDirection="column">
            <Text color="white" bold>💬 Discussion:</Text>
            <Text color="blue">{pr.comments} comments</Text>
            <Text color="blue">{pr.review_comments} review comments</Text>
            <Text color="yellow">{pr.commits} commits</Text>
          </Box>
        </Box>

        {pr.state === 'open' && (
          <Box borderStyle="single" borderColor="gray" padding={1}>
            <Box flexDirection="column">
              <Text color="white" bold>🔀 Merge Status:</Text>
              {mergeable === null ? (
                <Text color="yellow">⏳ Checking mergeability...</Text>
              ) : mergeable && mergeableState !== 'blocked' ? (
                <Text color="green">✅ Ready to merge (Press M to merge)</Text>
              ) : (
                <Text color="red">❌ Cannot merge - {mergeableState}</Text>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {pr.labels.length > 0 && (
        <Box borderStyle="single" borderColor="gray" padding={1}>
          <Box flexDirection="column">
            <Text color="white" bold>🏷️  Labels:</Text>
            <Box flexDirection="row">
              {pr.labels.map(label => (
                <Text key={label.id} color={`#${label.color}` as any} marginRight={2}>
                  {label.name}
                </Text>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderFiles = () => (
    <ScrollableBox height={25} title={`📁 Files Changed (${files.length})`} borderColor="cyan">
      <Box flexDirection="column" paddingX={1}>
        {files.length === 0 ? (
          <Box justifyContent="center" alignItems="center" height={10}>
            <Text color="gray">No files changed</Text>
          </Box>
        ) : (
          files.map((file, index) => {
            const isSelected = index === selectedIndex;
            const statusMapping = {
              added: { color: 'green', icon: '➕' },
              removed: { color: 'red', icon: '➖' },
              modified: { color: 'yellow', icon: '📝' },
              renamed: { color: 'blue', icon: '🔄' },
              copied: { color: 'cyan', icon: '📋' },
              changed: { color: 'yellow', icon: '📝' },
              unchanged: { color: 'gray', icon: '📄' },
            };

            const status = statusMapping[file.status] || { color: 'white', icon: '📄' };
            const statusColor = status.color;
            const statusIcon = status.icon;

            const pendingCount = pendingComments.filter(pc => pc.path === file.filename).length;

            return (
              <Box
                key={file.filename}
                borderStyle={isSelected ? 'round' : 'single'}
                borderColor={isSelected ? 'cyan' : 'gray'}
                paddingX={1}
                marginBottom={1}
                backgroundColor={isSelected ? 'blue' : undefined}
              >
                <Box width="100%" justifyContent="space-between">
                  <Box flexDirection="column" flexGrow={1}>
                    <Box>
                      <Text color={isSelected ? 'black' : statusColor as any} bold={isSelected}>
                        {statusIcon} {file.filename}
                      </Text>
                      {pendingCount > 0 && (
                        <Text color="yellow" marginLeft={1}>
                          ({pendingCount} pending)
                        </Text>
                      )}
                      {file.previous_filename && (
                        <Text color={isSelected ? 'black' : 'gray'} marginLeft={1}>
                          (was {file.previous_filename})
                        </Text>
                      )}
                    </Box>
                    <Box>
                      <Text color={isSelected ? 'black' : 'green'}>+{file.additions}</Text>
                      <Text color={isSelected ? 'black' : 'red'} marginLeft={1}>-{file.deletions}</Text>
                      <Text color={isSelected ? 'black' : 'gray'} marginLeft={2}>
                        {file.changes} changes
                      </Text>
                      {isSelected && (
                        <Text color="black" marginLeft={3}>
                          ← Press Enter to view diff
                        </Text>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </ScrollableBox>
  );

  const renderComments = () => (
    <ScrollableBox height={25} title={`💬 Comments (${comments.length + reviewComments.length})`} borderColor="cyan">
      <Box flexDirection="column" paddingX={1}>
        {comments.length === 0 && reviewComments.length === 0 ? (
          <Box justifyContent="center" alignItems="center" height={10}>
            <Text color="gray">No comments yet</Text>
          </Box>
        ) : (
          <>
            {comments.map((comment, index) => {
              const isSelected = index === selectedIndex;
              const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

              return (
                <Box
                  key={comment.id}
                  borderStyle={isSelected ? 'round' : 'single'}
                  borderColor={isSelected ? 'cyan' : 'gray'}
                  padding={1}
                  marginBottom={1}
                  backgroundColor={isSelected ? 'blue' : undefined}
                >
                  <Box flexDirection="column" width="100%">
                    <Box marginBottom={1}>
                      <Text color={isSelected ? 'black' : 'cyan'} bold>{comment.user.login}</Text>
                      <Text color={isSelected ? 'black' : 'gray'} marginLeft={1}>{timeAgo}</Text>
                    </Box>
                    <Text color={isSelected ? 'black' : 'white'}>{comment.body}</Text>
                  </Box>
                </Box>
              );
            })}

            {reviewComments.map((comment, index) => {
              const isSelected = (index + comments.length) === selectedIndex;
              const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

              return (
                <Box
                  key={comment.id}
                  borderStyle={isSelected ? 'round' : 'single'}
                  borderColor={isSelected ? 'cyan' : 'yellow'}
                  padding={1}
                  marginBottom={1}
                  backgroundColor={isSelected ? 'blue' : undefined}
                >
                  <Box flexDirection="column" width="100%">
                    <Box marginBottom={1}>
                      <Text color={isSelected ? 'black' : 'yellow'}>📝</Text>
                      <Text color={isSelected ? 'black' : 'cyan'} bold marginLeft={1}>{comment.user.login}</Text>
                      <Text color={isSelected ? 'black' : 'gray'} marginLeft={1}>{timeAgo}</Text>
                      <Text color={isSelected ? 'black' : 'gray'} marginLeft={2}>on {comment.path}:{comment.line}</Text>
                    </Box>
                    <Text color={isSelected ? 'black' : 'white'}>{comment.body}</Text>
                  </Box>
                </Box>
              );
            })}
          </>
        )}
      </Box>
    </ScrollableBox>
  );

  const renderReviews = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="white" bold marginBottom={1}>
        🔍 Reviews ({reviews.length})
      </Text>

      {reviews.map((review, index) => {
        const isSelected = index === selectedIndex;
        const timeAgo = review.submitted_at 
          ? formatDistanceToNow(new Date(review.submitted_at), { addSuffix: true })
          : 'pending';

        const stateColor = {
          APPROVED: 'green',
          CHANGES_REQUESTED: 'red',
          COMMENTED: 'yellow',
          PENDING: 'gray',
        }[review.state];

        const stateIcon = {
          APPROVED: '✅',
          CHANGES_REQUESTED: '❌',
          COMMENTED: '💬',
          PENDING: '⏳',
        }[review.state];

        return (
          <Box
            key={review.id}
            borderStyle={isSelected ? 'round' : 'single'}
            borderColor={isSelected ? 'cyan' : stateColor as any}
            padding={1}
            marginBottom={1}
          >
            <Box flexDirection="column">
              <Box marginBottom={1}>
                <Text color={stateColor as any}>{stateIcon}</Text>
                <Text color="cyan" bold marginLeft={1}>{review.user.login}</Text>
                <Text color="gray" marginLeft={1}>{timeAgo}</Text>
                <Text color={stateColor as any} marginLeft={2}>{review.state}</Text>
              </Box>
              {review.body && <Text color="white">{review.body}</Text>}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  const renderContent = () => {
    switch (mode) {
      case 'files': return renderFiles();
      case 'diff': return selectedFile ? (
        <DiffViewer
          file={selectedFile}
          onBack={() => setMode('files')}
          height={25}
          githubService={githubService}
          prNumber={pr.number}
          commitSha={pr.head.sha}
          onAddPendingComment={addPendingComment}
          pendingComments={pendingComments.filter(pc => pc.path === selectedFile.filename)}
        />
      ) : (
        <Box justifyContent="center" alignItems="center" height={25}>
          <Text color="gray">Select a file to view diff</Text>
        </Box>
      );
      case 'comments': return renderComments();
      case 'reviews': return renderReviews();
      case 'review_form': return (
        <ReviewForm
          onSubmit={submitReview}
          onCancel={cancelReview}
          loading={reviewLoading}
          pendingComments={pendingComments}
          onDeletePendingComment={deletePendingComment}
        />
      );
      case 'merge_form': return (
        <MergeForm
          pr={pr}
          onMerge={mergePullRequest}
          onCancel={cancelMerge}
          loading={mergeLoading}
          mergeable={mergeable}
          mergeableState={mergeableState}
        />
      );
      default: return renderOverview();
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="single" borderColor="gray" padding={1} marginBottom={1}>
        <Box width="100%" justifyContent="space-between">
          <Text color="white">
            <Text color={mode === 'overview' ? 'cyan' : 'gray'} bold>o</Text>verview |{' '}
            <Text color={mode === 'files' ? 'cyan' : 'gray'} bold>f</Text>iles |{' '}
            <Text color={mode === 'diff' ? 'cyan' : 'gray'} bold>d</Text>iff |{' '}
            <Text color={mode === 'comments' ? 'cyan' : 'gray'} bold>c</Text>omments |{' '}
            <Text color={mode === 'reviews' ? 'cyan' : 'gray'} bold>r</Text>eviews |{' '}
            <Text color={mode === 'review_form' ? 'cyan' : 'green'} bold>R</Text>eview
            {pr.state === 'open' && (
              <>
                {' | '}
                <Text color={mode === 'merge_form' ? 'cyan' : 'green'} bold>M</Text>erge
              </>
            )}
          </Text>
          {mode === 'diff' && selectedFile && (
            <Text color="yellow">
              📄 {selectedFile.filename}
            </Text>
          )}
        </Box>
      </Box>

      <Box flex={1}>
        {loading ? (
          <Box justifyContent="center" alignItems="center" height="100%">
            <Text color="yellow">🔄 Loading...</Text>
          </Box>
        ) : (
          renderContent()
        )}
      </Box>

      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Box width="100%" justifyContent="space-between">
          <Text color="gray">
            ESC: Back • ↑↓/j/k: Navigate • o/f/d/c/r: Tabs • b: Browser • R: Review
            {pendingComments.length > 0 && (
              <Text color="yellow">
                {' • '}{pendingComments.length} pending comment{pendingComments.length !== 1 ? 's' : ''}
              </Text>
            )}
            {pr.state === 'open' && ' • M: Merge'}
            {mode === 'files' && ' • Enter: View diff'}
            {mode === 'diff' && ' • c: Comment on line • w: Wrap • n: Line numbers'}
          </Text>
          <Text color="cyan">
            {mode.toUpperCase()}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}