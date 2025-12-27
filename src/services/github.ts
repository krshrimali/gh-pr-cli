import { Octokit } from '@octokit/rest';
import type { PullRequest, Comment, ReviewComment, Review, File, ReviewState } from '../types/github.js';

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private baseUrl: string;

  constructor(token: string, owner: string, repo: string, baseUrl?: string, apiUrl?: string) {
    // Determine the API URL
    let finalApiUrl = apiUrl;
    if (!finalApiUrl && baseUrl) {
      // Auto-generate API URL from base URL for common enterprise patterns
      if (baseUrl.includes('github.com')) {
        finalApiUrl = 'https://api.github.com';
      } else {
        // For enterprise: https://github.enterprise.com -> https://github.enterprise.com/api/v3
        finalApiUrl = `${baseUrl.replace(/\/$/, '')}/api/v3`;
      }
    }

    this.octokit = new Octokit({
      auth: token,
      baseUrl: finalApiUrl,
    });
    
    this.owner = owner;
    this.repo = repo;
    this.baseUrl = baseUrl || 'https://github.com';
  }

  static parseRepoFromUrl(url: string): { owner: string; repo: string; baseUrl?: string } | null {
    // Match various GitHub URL patterns including enterprise
    const patterns = [
      // Standard GitHub
      /(?:https?:\/\/)?github\.com[:/]([^/]+)\/([^/.]+)/,
      // Enterprise GitHub: https://github.enterprise.com/owner/repo
      /(?:https?:\/\/)?([^/]+\.com)[:/]([^/]+)\/([^/.]+)/,
      // Generic git URL pattern
      /(?:https?:\/\/)?([^/]+)[:/]([^/]+)\/([^/.]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        if (match.length === 3) {
          // Standard github.com pattern
          return { owner: match[1], repo: match[2] };
        } else if (match.length === 4) {
          // Enterprise pattern with hostname
          const hostname = match[1];
          const owner = match[2];
          const repo = match[3];
          
          // Extract base URL from hostname
          const baseUrl = hostname.includes('github.com') 
            ? 'https://github.com' 
            : `https://${hostname}`;
            
          return { owner, repo, baseUrl };
        }
      }
    }
    
    return null;
  }

  getWebUrl(path: string = ''): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}/${this.owner}/${this.repo}${cleanPath}`;
  }

  async listPullRequests(
    state: 'open' | 'closed' | 'all' = 'open',
    limit: number = 30
  ): Promise<PullRequest[]> {
    const response = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state,
      per_page: limit,
      sort: 'updated',
      direction: 'desc',
    });

    return response.data.map(pr => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: pr.state as 'open' | 'closed',
      user: {
        login: pr.user?.login || '',
        id: pr.user?.id || 0,
        avatar_url: pr.user?.avatar_url || '',
        html_url: pr.user?.html_url || '',
        type: pr.user?.type || '',
      },
      assignees: pr.assignees?.map(assignee => ({
        login: assignee?.login || '',
        id: assignee?.id || 0,
        avatar_url: assignee?.avatar_url || '',
        html_url: assignee?.html_url || '',
        type: assignee?.type || '',
      })) || [],
      labels: pr.labels?.map(label => ({
        id: typeof label === 'object' && label.id ? label.id : 0,
        name: typeof label === 'string' ? label : label.name || '',
        color: typeof label === 'object' && label.color ? label.color : '',
        description: typeof label === 'object' ? label.description : undefined,
      })) || [],
      base: {
        label: pr.base.label,
        ref: pr.base.ref,
        sha: pr.base.sha,
        repo: {
          id: pr.base.repo?.id || 0,
          name: pr.base.repo?.name || '',
          full_name: pr.base.repo?.full_name || '',
          owner: {
            login: pr.base.repo?.owner?.login || '',
            id: pr.base.repo?.owner?.id || 0,
            avatar_url: pr.base.repo?.owner?.avatar_url || '',
            html_url: pr.base.repo?.owner?.html_url || '',
            type: pr.base.repo?.owner?.type || '',
          },
          private: pr.base.repo?.private || false,
          html_url: pr.base.repo?.html_url || '',
          description: pr.base.repo?.description,
        },
      },
      head: {
        label: pr.head.label,
        ref: pr.head.ref,
        sha: pr.head.sha,
        repo: {
          id: pr.head.repo?.id || 0,
          name: pr.head.repo?.name || '',
          full_name: pr.head.repo?.full_name || '',
          owner: {
            login: pr.head.repo?.owner?.login || '',
            id: pr.head.repo?.owner?.id || 0,
            avatar_url: pr.head.repo?.owner?.avatar_url || '',
            html_url: pr.head.repo?.owner?.html_url || '',
            type: pr.head.repo?.owner?.type || '',
          },
          private: pr.head.repo?.private || false,
          html_url: pr.head.repo?.html_url || '',
          description: pr.head.repo?.description,
        },
      },
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at || undefined,
      merged_at: pr.merged_at || undefined,
      draft: pr.draft || false,
      mergeable: (pr as any).mergeable,
      additions: (pr as any).additions || 0,
      deletions: (pr as any).deletions || 0,
      changed_files: (pr as any).changed_files || 0,
      html_url: pr.html_url,
      diff_url: pr.diff_url,
      patch_url: pr.patch_url,
      comments: (pr as any).comments || 0,
      review_comments: (pr as any).review_comments || 0,
      commits: (pr as any).commits || 0,
    }));
  }

  async getPullRequest(number: number): Promise<PullRequest> {
    const response = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: number,
    });

    const pr = response.data;
    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: pr.state as 'open' | 'closed',
      user: {
        login: pr.user?.login || '',
        id: pr.user?.id || 0,
        avatar_url: pr.user?.avatar_url || '',
        html_url: pr.user?.html_url || '',
        type: pr.user?.type || '',
      },
      assignees: pr.assignees?.map(assignee => ({
        login: assignee?.login || '',
        id: assignee?.id || 0,
        avatar_url: assignee?.avatar_url || '',
        html_url: assignee?.html_url || '',
        type: assignee?.type || '',
      })) || [],
      labels: pr.labels?.map(label => ({
        id: typeof label === 'object' && label.id ? label.id : 0,
        name: typeof label === 'string' ? label : label.name || '',
        color: typeof label === 'object' && label.color ? label.color : '',
        description: typeof label === 'object' ? label.description : undefined,
      })) || [],
      base: {
        label: pr.base.label,
        ref: pr.base.ref,
        sha: pr.base.sha,
        repo: {
          id: pr.base.repo?.id || 0,
          name: pr.base.repo?.name || '',
          full_name: pr.base.repo?.full_name || '',
          owner: {
            login: pr.base.repo?.owner?.login || '',
            id: pr.base.repo?.owner?.id || 0,
            avatar_url: pr.base.repo?.owner?.avatar_url || '',
            html_url: pr.base.repo?.owner?.html_url || '',
            type: pr.base.repo?.owner?.type || '',
          },
          private: pr.base.repo?.private || false,
          html_url: pr.base.repo?.html_url || '',
          description: pr.base.repo?.description,
        },
      },
      head: {
        label: pr.head.label,
        ref: pr.head.ref,
        sha: pr.head.sha,
        repo: {
          id: pr.head.repo?.id || 0,
          name: pr.head.repo?.name || '',
          full_name: pr.head.repo?.full_name || '',
          owner: {
            login: pr.head.repo?.owner?.login || '',
            id: pr.head.repo?.owner?.id || 0,
            avatar_url: pr.head.repo?.owner?.avatar_url || '',
            html_url: pr.head.repo?.owner?.html_url || '',
            type: pr.head.repo?.owner?.type || '',
          },
          private: pr.head.repo?.private || false,
          html_url: pr.head.repo?.html_url || '',
          description: pr.head.repo?.description,
        },
      },
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at || undefined,
      merged_at: pr.merged_at || undefined,
      draft: pr.draft || false,
      mergeable: (pr as any).mergeable,
      additions: (pr as any).additions || 0,
      deletions: (pr as any).deletions || 0,
      changed_files: (pr as any).changed_files || 0,
      html_url: pr.html_url,
      diff_url: pr.diff_url,
      patch_url: pr.patch_url,
      comments: (pr as any).comments || 0,
      review_comments: (pr as any).review_comments || 0,
      commits: (pr as any).commits || 0,
    };
  }

  async getComments(prNumber: number): Promise<Comment[]> {
    const response = await this.octokit.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
    });

    return response.data.map(comment => ({
      id: comment.id,
      body: comment.body || '',
      user: {
        login: comment.user?.login || '',
        id: comment.user?.id || 0,
        avatar_url: comment.user?.avatar_url || '',
        html_url: comment.user?.html_url || '',
        type: comment.user?.type || '',
      },
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      html_url: comment.html_url,
    }));
  }

  async getReviewComments(prNumber: number): Promise<ReviewComment[]> {
    const response = await this.octokit.pulls.listReviewComments({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return response.data.map(comment => ({
      id: comment.id,
      body: comment.body,
      user: {
        login: comment.user?.login || '',
        id: comment.user?.id || 0,
        avatar_url: comment.user?.avatar_url || '',
        html_url: comment.user?.html_url || '',
        type: comment.user?.type || '',
      },
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      path: comment.path,
      position: comment.position,
      line: comment.line,
      commit_id: comment.commit_id,
      diff_hunk: comment.diff_hunk,
      html_url: comment.html_url,
    }));
  }

  async getReviews(prNumber: number): Promise<Review[]> {
    const response = await this.octokit.pulls.listReviews({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return response.data.map(review => ({
      id: review.id,
      user: {
        login: review.user?.login || '',
        id: review.user?.id || 0,
        avatar_url: review.user?.avatar_url || '',
        html_url: review.user?.html_url || '',
        type: review.user?.type || '',
      },
      body: review.body,
      state: review.state as 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING',
      html_url: review.html_url,
      submitted_at: review.submitted_at,
    }));
  }

  async getFiles(prNumber: number): Promise<File[]> {
    const response = await this.octokit.pulls.listFiles({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return response.data.map(file => ({
      filename: file.filename,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      status: file.status as 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged',
      raw_url: file.raw_url,
      blob_url: file.blob_url,
      patch: file.patch,
      previous_filename: file.previous_filename,
    }));
  }

  async createReview(
    prNumber: number,
    state: ReviewState,
    body?: string,
    comments?: Array<{ path: string; line: number; body: string }>
  ): Promise<Review> {
    const event = state === 'approve' ? 'APPROVE' : 
                 state === 'request_changes' ? 'REQUEST_CHANGES' : 'COMMENT';

    const response = await this.octokit.pulls.createReview({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      event,
      body,
      comments: comments?.map(comment => ({
        path: comment.path,
        line: comment.line,
        body: comment.body,
      })),
    });

    const review = response.data;
    return {
      id: review.id,
      user: {
        login: review.user?.login || '',
        id: review.user?.id || 0,
        avatar_url: review.user?.avatar_url || '',
        html_url: review.user?.html_url || '',
        type: review.user?.type || '',
      },
      body: review.body,
      state: review.state as 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING',
      html_url: review.html_url,
      submitted_at: review.submitted_at,
    };
  }

  async createComment(prNumber: number, body: string): Promise<Comment> {
    const response = await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
      body,
    });

    const comment = response.data;
    return {
      id: comment.id,
      body: comment.body || '',
      user: {
        login: comment.user?.login || '',
        id: comment.user?.id || 0,
        avatar_url: comment.user?.avatar_url || '',
        html_url: comment.user?.html_url || '',
        type: comment.user?.type || '',
      },
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      html_url: comment.html_url,
    };
  }

  async createReviewComment(
    prNumber: number,
    comment: { path: string; line: number; body: string; commit_id: string }
  ): Promise<ReviewComment> {
    const response = await this.octokit.pulls.createReviewComment({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      path: comment.path,
      line: comment.line,
      body: comment.body,
      commit_id: comment.commit_id,
    });

    const reviewComment = response.data;
    return {
      id: reviewComment.id,
      body: reviewComment.body,
      user: {
        login: reviewComment.user?.login || '',
        id: reviewComment.user?.id || 0,
        avatar_url: reviewComment.user?.avatar_url || '',
        html_url: reviewComment.user?.html_url || '',
        type: reviewComment.user?.type || '',
      },
      created_at: reviewComment.created_at,
      updated_at: reviewComment.updated_at,
      path: reviewComment.path,
      position: reviewComment.position,
      line: reviewComment.line,
      commit_id: reviewComment.commit_id,
      diff_hunk: reviewComment.diff_hunk,
      html_url: reviewComment.html_url,
    };
  }

  async searchPullRequests(query: string, limit: number = 30): Promise<PullRequest[]> {
    const searchQuery = `${query} repo:${this.owner}/${this.repo} type:pr`;
    const response = await this.octokit.search.issuesAndPullRequests({
      q: searchQuery,
      per_page: limit,
      sort: 'updated',
      order: 'desc',
    });

    const prNumbers = response.data.items.map(item => item.number);
    const prs = await Promise.all(
      prNumbers.map(number => this.getPullRequest(number))
    );

    return prs;
  }

  async createPullRequest(options: {
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
  }): Promise<PullRequest> {
    const response = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title: options.title,
      body: options.body,
      head: options.head,
      base: options.base,
      draft: options.draft || false,
    });

    const pr = response.data;
    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: pr.state as 'open' | 'closed',
      user: {
        login: pr.user?.login || '',
        id: pr.user?.id || 0,
        avatar_url: pr.user?.avatar_url || '',
        html_url: pr.user?.html_url || '',
        type: pr.user?.type || '',
      },
      assignees: pr.assignees?.map(assignee => ({
        login: assignee?.login || '',
        id: assignee?.id || 0,
        avatar_url: assignee?.avatar_url || '',
        html_url: assignee?.html_url || '',
        type: assignee?.type || '',
      })) || [],
      labels: pr.labels?.map(label => ({
        id: typeof label === 'object' && label.id ? label.id : 0,
        name: typeof label === 'string' ? label : label.name || '',
        color: typeof label === 'object' && label.color ? label.color : '',
        description: typeof label === 'object' ? label.description : undefined,
      })) || [],
      base: {
        label: pr.base.label,
        ref: pr.base.ref,
        sha: pr.base.sha,
        repo: {
          id: pr.base.repo?.id || 0,
          name: pr.base.repo?.name || '',
          full_name: pr.base.repo?.full_name || '',
          owner: {
            login: pr.base.repo?.owner?.login || '',
            id: pr.base.repo?.owner?.id || 0,
            avatar_url: pr.base.repo?.owner?.avatar_url || '',
            html_url: pr.base.repo?.owner?.html_url || '',
            type: pr.base.repo?.owner?.type || '',
          },
          private: pr.base.repo?.private || false,
          html_url: pr.base.repo?.html_url || '',
          description: pr.base.repo?.description,
        },
      },
      head: {
        label: pr.head.label,
        ref: pr.head.ref,
        sha: pr.head.sha,
        repo: {
          id: pr.head.repo?.id || 0,
          name: pr.head.repo?.name || '',
          full_name: pr.head.repo?.full_name || '',
          owner: {
            login: pr.head.repo?.owner?.login || '',
            id: pr.head.repo?.owner?.id || 0,
            avatar_url: pr.head.repo?.owner?.avatar_url || '',
            html_url: pr.head.repo?.owner?.html_url || '',
            type: pr.head.repo?.owner?.type || '',
          },
          private: pr.head.repo?.private || false,
          html_url: pr.head.repo?.html_url || '',
          description: pr.head.repo?.description,
        },
      },
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at || undefined,
      merged_at: pr.merged_at || undefined,
      draft: pr.draft || false,
      mergeable: (pr as any).mergeable,
      additions: (pr as any).additions || 0,
      deletions: (pr as any).deletions || 0,
      changed_files: (pr as any).changed_files || 0,
      html_url: pr.html_url,
      diff_url: pr.diff_url,
      patch_url: pr.patch_url,
      comments: (pr as any).comments || 0,
      review_comments: (pr as any).review_comments || 0,
      commits: (pr as any).commits || 0,
    };
  }

  async mergePullRequest(
    prNumber: number,
    options: {
      commit_title?: string;
      commit_message?: string;
      merge_method?: 'merge' | 'squash' | 'rebase';
    } = {}
  ): Promise<{
    sha: string;
    merged: boolean;
    message: string;
  }> {
    const response = await this.octokit.pulls.merge({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      commit_title: options.commit_title,
      commit_message: options.commit_message,
      merge_method: options.merge_method || 'merge',
    });

    return {
      sha: response.data.sha,
      merged: response.data.merged,
      message: response.data.message,
    };
  }

  async checkPullRequestMergeability(prNumber: number): Promise<{
    mergeable: boolean | null;
    mergeable_state: string;
    rebaseable?: boolean;
  }> {
    const response = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return {
      mergeable: response.data.mergeable,
      mergeable_state: response.data.mergeable_state,
      rebaseable: (response.data as any).rebaseable,
    };
  }
}