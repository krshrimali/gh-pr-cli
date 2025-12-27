import type { ReviewComment, CommentThread } from '../types/github.js';

/**
 * Groups review comments by thread, organizing them by line number
 * Top-level comments (those without in_reply_to_id) are treated as thread starters
 * Replies (those with in_reply_to_id) are grouped under their parent comment
 */
export function groupCommentsByThread(comments: ReviewComment[]): Map<number, CommentThread> {
  const threads = new Map<number, CommentThread>();

  // First pass: identify top-level comments
  const topLevelComments = comments.filter(c => !c.in_reply_to_id);

  // Second pass: build threads with their replies
  topLevelComments.forEach(comment => {
    const line = comment.line || 0;

    // Find all replies to this comment
    const replies = comments.filter(c => c.in_reply_to_id === comment.id);

    // Sort replies by creation time (oldest first)
    const sortedReplies = replies.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // If there's already a thread for this line, we need to handle multiple top-level comments
    // For now, we'll use the first one as the main thread
    if (!threads.has(line)) {
      threads.set(line, {
        topLevelComment: comment,
        replies: sortedReplies,
        line: line,
        startLine: comment.start_line,
      });
    }
  });

  return threads;
}

/**
 * Gets all comments for a specific file path
 */
export function getCommentsForFile(comments: ReviewComment[], filePath: string): ReviewComment[] {
  return comments.filter(c => c.path === filePath);
}

/**
 * Checks if a comment is a reply to another comment
 */
export function isReply(comment: ReviewComment): boolean {
  return comment.in_reply_to_id !== undefined;
}

/**
 * Gets the total count of comments in a thread (including top-level and all replies)
 */
export function getThreadCommentCount(thread: CommentThread): number {
  return 1 + thread.replies.length; // 1 for top-level + all replies
}
