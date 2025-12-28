#!/usr/bin/env node

import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { GitHubService } from './services/github.js';
import { App } from './components/App.js';
import { getGitHubToken, parseRepoFromGit, parseRepoFromArgs, loadConfig } from './utils/config.js';

// Custom function to check if raw mode is supported
function isRawModeSupported(): boolean {
  try {
    return Boolean(
      process.stdin && 
      process.stdin.isTTY === true && 
      typeof process.stdin.setRawMode === 'function'
    );
  } catch {
    return false;
  }
}

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
    
    // Debug terminal state
    console.log(`🔍 Debug: TTY: ${process.stdin.isTTY}, Raw Mode Supported: ${isRawModeSupported()}`);
    
    // Check if stdin is available and in TTY mode
    if (!process.stdin || process.stdin.isTTY !== true) {
      console.error('❌ This application requires an interactive terminal (TTY).');
      console.error('Try running in a proper terminal or use: script -q /dev/null gh-pr-review');
      console.error('Current environment: stdin exists:', !!process.stdin, 'isTTY:', process.stdin?.isTTY);
      process.exit(1);
    }

    if (!isRawModeSupported()) {
      console.error('❌ Raw mode is not supported on this terminal.');
      console.error('Try running in a different terminal or SSH with -t flag.');
      process.exit(1);
    }

    // Add a small delay to ensure terminal is ready
    console.log('⏳ Initializing terminal interface...');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Ensure stdin is in raw mode for proper input handling
    try {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      
      // Listen for data to keep stdin active
      process.stdin.on('data', () => {});
      
    } catch (error) {
      console.error('❌ Failed to set terminal to raw mode:', error);
      process.exit(1);
    }

    console.log('🎮 Starting interactive interface...');

    const { waitUntilExit } = render(
      React.createElement(App, {
        config: { ...config, githubToken: token },
        githubService,
      }),
      {
        stdin: process.stdin,
        stdout: process.stdout,
        stderr: process.stderr,
        exitOnCtrlC: false,
      }
    );

    // Handle cleanup on exit
    const cleanup = () => {
      try {
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
          process.stdin.pause();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };

    process.on('SIGINT', () => {
      console.log('📟 Received SIGINT');
      cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      console.log('📟 Received SIGTERM');
      cleanup();
      process.exit(0);
    });
    process.on('exit', cleanup);

    console.log('🔄 Waiting for user interaction...');
    
    // Add process event debugging
    process.on('uncaughtException', (err) => {
      console.error('💥 Uncaught Exception:', err);
      cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      cleanup();
      process.exit(1);
    });

    await waitUntilExit();
    console.log('✅ Application exited normally');
    cleanup();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    
    // Restore terminal state before exit
    try {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}