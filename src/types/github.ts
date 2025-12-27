export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  user: User;
  assignees: User[];
  labels: Label[];
  base: Branch;
  head: Branch;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  draft: boolean;
  mergeable?: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  html_url: string;
  diff_url: string;
  patch_url: string;
  comments: number;
  review_comments: number;
  commits: number;
}

export interface User {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description?: string | null;
}

export interface Branch {
  label: string;
  ref: string;
  sha: string;
  repo: Repository;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: User;
  private: boolean;
  html_url: string;
  description?: string | null;
}

export interface Comment {
  id: number;
  body: string;
  user: User;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface ReviewComment {
  id: number;
  body: string;
  user: User;
  created_at: string;
  updated_at: string;
  path: string;
  position?: number;
  line?: number;
  commit_id: string;
  diff_hunk: string;
  html_url: string;
}

export interface Review {
  id: number;
  user: User;
  body?: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
  html_url: string;
  submitted_at?: string;
}

export interface File {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  raw_url: string;
  blob_url: string;
  patch?: string;
  previous_filename?: string;
}

export type ReviewState = 'approve' | 'request_changes' | 'comment';

export interface PendingComment {
  id: string;
  path: string;
  line: number;
  body: string;
}

export interface AppConfig {
  githubToken?: string;
  defaultRepo?: string;
  githubUrl?: string;
  githubApiUrl?: string;
  theme: 'light' | 'dark' | 'auto';
  keybindings: Record<string, string>;
}