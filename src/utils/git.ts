import { execSync } from 'child_process';

export interface GitStatus {
  currentBranch: string;
  hasUncommittedChanges: boolean;
  hasUnpushedCommits: boolean;
  recentCommits: Array<{
    hash: string;
    message: string;
  }>;
  diffStats: {
    files: number;
    additions: number;
    deletions: number;
  };
  baseBranch: string;
}

export class GitService {
  private static execGit(command: string): string {
    try {
      return execSync(`git ${command}`, { encoding: 'utf-8' }).trim();
    } catch (error) {
      throw new Error(`Git command failed: git ${command}`);
    }
  }

  static getCurrentBranch(): string {
    return this.execGit('branch --show-current');
  }

  static getBaseBranch(): string {
    try {
      // Try to get the default branch from remote
      const defaultBranch = this.execGit('symbolic-ref refs/remotes/origin/HEAD');
      return defaultBranch.replace('refs/remotes/origin/', '');
    } catch {
      // Fallback to common default branches
      const branches = ['main', 'master', 'develop'];
      for (const branch of branches) {
        try {
          this.execGit(`rev-parse --verify refs/remotes/origin/${branch}`);
          return branch;
        } catch {
          continue;
        }
      }
      return 'main'; // Ultimate fallback
    }
  }

  static hasUncommittedChanges(): boolean {
    const status = this.execGit('status --porcelain');
    return status.length > 0;
  }

  static hasUnpushedCommits(baseBranch: string = 'main'): boolean {
    try {
      const currentBranch = this.getCurrentBranch();
      const unpushed = this.execGit(`rev-list origin/${baseBranch}..${currentBranch} --count`);
      return parseInt(unpushed) > 0;
    } catch {
      return false;
    }
  }

  static getRecentCommits(baseBranch: string = 'main', limit: number = 10): Array<{hash: string, message: string}> {
    try {
      const currentBranch = this.getCurrentBranch();
      const commits = this.execGit(`log origin/${baseBranch}..${currentBranch} --oneline -n ${limit}`);
      
      if (!commits) return [];

      return commits.split('\n').map(line => {
        const [hash, ...messageParts] = line.split(' ');
        return {
          hash,
          message: messageParts.join(' ')
        };
      });
    } catch {
      return [];
    }
  }

  static getDiffStats(baseBranch: string = 'main'): { files: number; additions: number; deletions: number } {
    try {
      const currentBranch = this.getCurrentBranch();
      const diffStat = this.execGit(`diff origin/${baseBranch}..${currentBranch} --numstat`);
      
      if (!diffStat) return { files: 0, additions: 0, deletions: 0 };

      const lines = diffStat.split('\n').filter(line => line.trim());
      let additions = 0;
      let deletions = 0;

      for (const line of lines) {
        const [add, del] = line.split('\t');
        if (add !== '-') additions += parseInt(add) || 0;
        if (del !== '-') deletions += parseInt(del) || 0;
      }

      return {
        files: lines.length,
        additions,
        deletions
      };
    } catch {
      return { files: 0, additions: 0, deletions: 0 };
    }
  }

  static getGitStatus(): GitStatus {
    const currentBranch = this.getCurrentBranch();
    const baseBranch = this.getBaseBranch();
    
    return {
      currentBranch,
      hasUncommittedChanges: this.hasUncommittedChanges(),
      hasUnpushedCommits: this.hasUnpushedCommits(baseBranch),
      recentCommits: this.getRecentCommits(baseBranch),
      diffStats: this.getDiffStats(baseBranch),
      baseBranch
    };
  }

  static async pushCurrentBranch(): Promise<void> {
    const currentBranch = this.getCurrentBranch();
    
    try {
      // Check if remote branch exists
      this.execGit(`ls-remote --exit-code origin ${currentBranch}`);
      // Remote exists, just push
      this.execGit('push');
    } catch {
      // Remote doesn't exist, push with upstream
      this.execGit(`push -u origin ${currentBranch}`);
    }
  }

  static isValidRepository(): boolean {
    try {
      this.execGit('rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }
}