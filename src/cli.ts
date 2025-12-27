import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { GitHubService } from './services/github.js';
import { App } from './components/App.js';
import { getGitHubToken, parseRepoFromGit, parseRepoFromArgs, loadConfig } from './utils/config.js';

const program = new Command();

program
  .name('gh-pr-review')
  .description('Interactive GitHub Pull Request reviewer for the terminal')
  .version('1.0.0')
  .option('-r, --repo <owner/repo>', 'GitHub repository (e.g., facebook/react)')
  .option('-t, --token <token>', 'GitHub personal access token')
  .option('-u, --url <url>', 'GitHub base URL (e.g., https://github.enterprise.com for enterprise)')
  .option('--api-url <url>', 'GitHub API URL (e.g., https://github.enterprise.com/api/v3)')
  .parse();

async function main() {
  try {
    const options = program.opts();
    const config = await loadConfig();

    let token = options.token || config.githubToken;
    if (!token) {
      token = getGitHubToken();
    }

    let repoInfo = parseRepoFromArgs(options.repo);
    if (!repoInfo) {
      repoInfo = parseRepoFromGit();
    }
    
    if (!repoInfo) {
      console.error('❌ Could not determine GitHub repository.');
      console.error('Please specify with --repo owner/repo or run from a git repository.');
      process.exit(1);
    }

    // Use CLI options, then git-detected URLs, then config, then defaults
    const baseUrl = options.url || repoInfo.baseUrl || config.githubUrl;
    const apiUrl = options.apiUrl || config.githubApiUrl;

    const githubService = new GitHubService(
      token, 
      repoInfo.owner, 
      repoInfo.repo,
      baseUrl,
      apiUrl
    );

    const urlInfo = options.url ? ` on ${options.url}` : '';
    console.log(`🚀 Starting GitHub PR Review for ${repoInfo.owner}/${repoInfo.repo}${urlInfo}`);
    
    const { waitUntilExit } = render(
      React.createElement(App, {
        config: { ...config, githubToken: token },
        githubService,
      })
    );

    await waitUntilExit();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}