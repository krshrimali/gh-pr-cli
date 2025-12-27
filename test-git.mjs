import { execSync } from 'child_process';

function execGit(command) {
  try {
    return execSync(`git ${command}`, { encoding: 'utf-8' }).trim();
  } catch (error) {
    throw new Error(`Git command failed: git ${command}`);
  }
}

try {
  const currentBranch = execGit('branch --show-current');
  const hasUncommitted = execGit('status --porcelain').length > 0;
  const recentCommits = execGit('log --oneline -5').split('\n').map(line => {
    const [hash, ...messageParts] = line.split(' ');
    return { hash, message: messageParts.join(' ') };
  });

  console.log('✅ Git Service Test Results:');
  console.log('- Current branch:', currentBranch);
  console.log('- Has uncommitted changes:', hasUncommitted);
  console.log('- Recent commits:', recentCommits.length);
  console.log('- First commit:', recentCommits[0]);
  
  if (hasUncommitted) {
    console.log('🎯 Perfect! We have uncommitted changes to test with');
  }
} catch (error) {
  console.error('❌ Git test failed:', error.message);
}