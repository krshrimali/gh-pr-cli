import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import type { AppConfig } from '../types/github.js';

const CONFIG_DIR = path.join(os.homedir(), '.gh-pr-review');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const defaultConfig: AppConfig = {
  theme: 'auto',
  keybindings: {
    quit: 'q',
    refresh: 'r',
    search: '/',
    back: 'ESC',
    up: 'UP',
    down: 'DOWN',
    enter: 'ENTER',
    overview: 'o',
    files: 'f',
    comments: 'c',
    reviews: 'r',
  },
};

export async function loadConfig(): Promise<AppConfig> {
  try {
    await fs.access(CONFIG_FILE);
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData);
    return { ...defaultConfig, ...config };
  } catch (error) {
    return defaultConfig;
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

export function getGitHubToken(): string {
  // First try environment variables
  const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (envToken) {
    return envToken;
  }

  // Try to get token from GitHub CLI
  try {
    const ghToken = execSync('gh auth token', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    if (ghToken && ghToken.length > 0 && !ghToken.includes('error')) {
      return ghToken;
    }
  } catch (error) {
    console.log('Failed to get token from gh CLI:', error);
  }

  throw new Error(
    'GitHub token not found. Please set GITHUB_TOKEN or GH_TOKEN environment variable, or run "gh auth login".'
  );
}

export function parseRepoFromGit(): { owner: string; repo: string } | null {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    return match ? { owner: match[1], repo: match[2] } : null;
  } catch (error) {
    return null;
  }
}

export function parseRepoFromArgs(repoArg?: string): { owner: string; repo: string } | null {
  if (!repoArg) return null;
  
  const parts = repoArg.split('/');
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  
  return null;
}