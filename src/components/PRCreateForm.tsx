import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { GitService, type GitStatus } from '../utils/git.js';

interface PRCreateFormProps {
  gitStatus: GitStatus;
  onSubmit: (data: {
    title: string;
    body: string;
    base: string;
    head: string;
    draft: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

type FormStep = 'review' | 'title' | 'description' | 'options' | 'confirm';

export function PRCreateForm({ gitStatus, onSubmit, onCancel, loading }: PRCreateFormProps) {
  const [step, setStep] = useState<FormStep>('review');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [base, setBase] = useState(gitStatus.baseBranch);
  const [draft, setDraft] = useState(false);
  const [inputMode, setInputMode] = useState(false);
  const [currentInput, setCurrentInput] = useState('');

  // Auto-generate title from commit messages
  useEffect(() => {
    if (gitStatus.recentCommits.length > 0) {
      const messages = gitStatus.recentCommits.map(c => c.message);
      if (messages.length === 1) {
        setTitle(messages[0]);
      } else {
        // Create a summary title from multiple commits
        const summary = messages.length > 1 ? `${messages.length} commits: ${messages[0]}` : messages[0];
        setTitle(summary);
      }

      // Auto-generate body from commit list
      if (messages.length > 1) {
        const commitList = gitStatus.recentCommits
          .map(c => `- ${c.message} (${c.hash.substring(0, 7)})`)
          .join('\n');
        setBody(`## Changes\n\n${commitList}\n\n## Description\n\n<!-- Add your description here -->`);
      }
    }
  }, [gitStatus.recentCommits]);

  useInput((input, key) => {
    if (loading) return;

    if (inputMode) {
      if (key.return) {
        // Finish input
        if (step === 'title') {
          setTitle(currentInput);
          setStep('description');
        } else if (step === 'description') {
          setBody(currentInput);
          setStep('options');
        }
        setInputMode(false);
        setCurrentInput('');
      } else if (key.escape) {
        // Cancel input
        setInputMode(false);
        setCurrentInput('');
      } else if (key.backspace || key.delete) {
        setCurrentInput(currentInput.slice(0, -1));
      } else if (input) {
        setCurrentInput(currentInput + input);
      }
      return;
    }

    // Navigation between steps
    if (key.escape) {
      if (step === 'review') {
        onCancel();
      } else {
        // Go back to previous step
        const steps: FormStep[] = ['review', 'title', 'description', 'options', 'confirm'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
          setStep(steps[currentIndex - 1]);
        }
      }
      return;
    }

    if (step === 'review') {
      if (input === 'c' && gitStatus.recentCommits.length > 0) {
        setStep('title');
      } else if (input === 'q') {
        onCancel();
      }
    } else if (step === 'title') {
      if (key.return) {
        setInputMode(true);
        setCurrentInput(title);
      } else if (input === 'n') {
        setStep('description');
      }
    } else if (step === 'description') {
      if (key.return) {
        setInputMode(true);
        setCurrentInput(body);
      } else if (input === 'n') {
        setStep('options');
      }
    } else if (step === 'options') {
      if (input === 'd') {
        setDraft(!draft);
      } else if (input === 'b') {
        // Cycle through common base branches
        const bases = ['main', 'master', 'develop'];
        const currentIndex = bases.indexOf(base);
        setBase(bases[(currentIndex + 1) % bases.length]);
      } else if (input === 'n' || key.return) {
        setStep('confirm');
      }
    } else if (step === 'confirm') {
      if (key.return || input === 'y') {
        onSubmit({
          title,
          body,
          base,
          head: gitStatus.currentBranch,
          draft,
        });
      } else if (input === 'e') {
        setStep('title');
      }
    }
  });

  const renderReview = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>📝 Create Pull Request</Text>
      <Text color="gray">Review your changes before creating a PR</Text>
      
      <Box marginY={1} borderStyle="single" borderColor="gray" padding={1}>
        <Box flexDirection="column">
          <Text color="white" bold>Current Branch: <Text color="cyan">{gitStatus.currentBranch}</Text></Text>
          <Text color="white">Base Branch: <Text color="yellow">{gitStatus.baseBranch}</Text></Text>
          
          {gitStatus.hasUncommittedChanges && (
            <Text color="red">⚠️  You have uncommitted changes</Text>
          )}
          
          {!gitStatus.hasUnpushedCommits && (
            <Text color="red">⚠️  No unpushed commits found</Text>
          )}
        </Box>
      </Box>

      {gitStatus.recentCommits.length > 0 && (
        <Box marginY={1} borderStyle="single" borderColor="green" padding={1}>
          <Box flexDirection="column">
            <Text color="green" bold>📋 Commits to include ({gitStatus.recentCommits.length}):</Text>
            {gitStatus.recentCommits.slice(0, 5).map((commit, index) => (
              <Text key={commit.hash} color="white">
                <Text color="gray">{commit.hash.substring(0, 7)}</Text> {commit.message}
              </Text>
            ))}
            {gitStatus.recentCommits.length > 5 && (
              <Text color="gray">... and {gitStatus.recentCommits.length - 5} more commits</Text>
            )}
          </Box>
        </Box>
      )}

      <Box marginY={1} borderStyle="single" borderColor="blue" padding={1}>
        <Box flexDirection="column">
          <Text color="blue" bold>📊 Changes:</Text>
          <Text color="green">+{gitStatus.diffStats.additions} additions</Text>
          <Text color="red">-{gitStatus.diffStats.deletions} deletions</Text>
          <Text color="gray">{gitStatus.diffStats.files} files changed</Text>
        </Box>
      </Box>

      {gitStatus.hasUnpushedCommits && !gitStatus.hasUncommittedChanges ? (
        <Text color="green">✅ Ready to create PR</Text>
      ) : (
        <Text color="yellow">⚠️  You may need to commit and push your changes first</Text>
      )}
    </Box>
  );

  const renderTitle = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>📝 PR Title</Text>
      <Text color="gray">Enter a descriptive title for your pull request</Text>
      
      <Box marginY={1} borderStyle="single" borderColor="cyan" padding={1}>
        <Box flexDirection="column">
          <Text color="white" bold>Current title:</Text>
          <Text color={inputMode ? "black" : "cyan"} backgroundColor={inputMode ? "cyan" : undefined}>
            {inputMode ? currentInput : title || "Enter title..."}
            {inputMode && <Text color="black">│</Text>}
          </Text>
        </Box>
      </Box>

      <Text color="gray">
        {inputMode ? "Type your title and press Enter to continue" : "Press Enter to edit • n: Next"}
      </Text>
    </Box>
  );

  const renderDescription = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>📋 PR Description</Text>
      <Text color="gray">Add a detailed description (optional)</Text>
      
      <Box marginY={1} borderStyle="single" borderColor="cyan" padding={1} height={8}>
        <Box flexDirection="column">
          <Text color="white" bold>Description:</Text>
          <Text color={inputMode ? "black" : "white"} backgroundColor={inputMode ? "cyan" : undefined}>
            {inputMode ? currentInput : body || "Add description..."}
            {inputMode && <Text color="black">│</Text>}
          </Text>
        </Box>
      </Box>

      <Text color="gray">
        {inputMode ? "Type your description and press Enter to continue" : "Press Enter to edit • n: Next"}
      </Text>
    </Box>
  );

  const renderOptions = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>⚙️  PR Options</Text>
      <Text color="gray">Configure your pull request settings</Text>
      
      <Box marginY={1} borderStyle="single" borderColor="cyan" padding={1}>
        <Box flexDirection="column">
          <Text color="white">
            Base branch: <Text color="yellow">{base}</Text> <Text color="gray">(press b to change)</Text>
          </Text>
          <Text color="white">
            Head branch: <Text color="cyan">{gitStatus.currentBranch}</Text>
          </Text>
          <Text color="white">
            Draft PR: {draft ? <Text color="green">Yes</Text> : <Text color="red">No</Text>} <Text color="gray">(press d to toggle)</Text>
          </Text>
        </Box>
      </Box>

      <Text color="gray">d: Toggle draft • b: Change base • n: Next</Text>
    </Box>
  );

  const renderConfirm = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>🚀 Create Pull Request</Text>
      <Text color="gray">Review and confirm your pull request</Text>
      
      <Box marginY={1} borderStyle="single" borderColor="green" padding={1}>
        <Box flexDirection="column">
          <Text color="white" bold>Title:</Text>
          <Text color="cyan">{title}</Text>
          
          <Text color="white" bold marginTop={1}>Description:</Text>
          <Text color="white">{body || "(No description)"}</Text>
          
          <Text color="white" bold marginTop={1}>Settings:</Text>
          <Text color="white">{base} ← {gitStatus.currentBranch}</Text>
          {draft && <Text color="yellow">📝 Draft PR</Text>}
        </Box>
      </Box>

      <Text color="green">Press Enter or y to create • e: Edit • ESC: Back</Text>
    </Box>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box justifyContent="center" alignItems="center" height={20}>
          <Text color="yellow">🚀 Creating pull request...</Text>
        </Box>
      );
    }

    switch (step) {
      case 'review': return renderReview();
      case 'title': return renderTitle();
      case 'description': return renderDescription();
      case 'options': return renderOptions();
      case 'confirm': return renderConfirm();
      default: return renderReview();
    }
  };

  const getStepIndicator = () => {
    const steps = ['review', 'title', 'description', 'options', 'confirm'];
    const currentIndex = steps.indexOf(step);
    
    return (
      <Box>
        {steps.map((s, index) => (
          <Text key={s} color={index === currentIndex ? "cyan" : "gray"}>
            {index === currentIndex ? "●" : "○"} {s}
            {index < steps.length - 1 && " → "}
          </Text>
        ))}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="single" borderColor="cyan" padding={1}>
        {getStepIndicator()}
      </Box>

      <Box flex={1}>
        {renderContent()}
      </Box>

      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Text color="gray">
          ESC: {step === 'review' ? 'Cancel' : 'Back'} • 
          {step === 'review' && gitStatus.hasUnpushedCommits && ' c: Continue • '}
          {step !== 'review' && step !== 'confirm' && ' n: Next • '}
          q: Quit
        </Text>
      </Box>
    </Box>
  );
}