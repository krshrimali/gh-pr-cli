import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { PullRequest } from '../types/github.js';

interface MergeFormProps {
  pr: PullRequest;
  onMerge: (options: {
    commit_title: string;
    commit_message: string;
    merge_method: 'merge' | 'squash' | 'rebase';
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  mergeable?: boolean | null;
  mergeableState?: string;
}

type MergeStep = 'method' | 'title' | 'message' | 'confirm';
type MergeMethod = 'merge' | 'squash' | 'rebase';

const mergeMethodInfo = {
  merge: {
    name: 'Merge Commit',
    description: 'Create a merge commit that combines both branches',
    icon: '🔀'
  },
  squash: {
    name: 'Squash and Merge',
    description: 'Combine all commits into a single commit',
    icon: '📦'
  },
  rebase: {
    name: 'Rebase and Merge',
    description: 'Rebase commits onto base branch without merge commit',
    icon: '🔄'
  }
};

export function MergeForm({ 
  pr, 
  onMerge, 
  onCancel, 
  loading, 
  mergeable, 
  mergeableState 
}: MergeFormProps) {
  const [step, setStep] = useState<MergeStep>('method');
  const [method, setMethod] = useState<MergeMethod>('merge');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [inputMode, setInputMode] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [selectedMethodIndex, setSelectedMethodIndex] = useState(0);

  const methods: MergeMethod[] = ['merge', 'squash', 'rebase'];

  // Auto-generate merge title and message
  useEffect(() => {
    if (method === 'squash') {
      setTitle(`${pr.title} (#${pr.number})`);
      setMessage('');
    } else if (method === 'merge') {
      setTitle(`Merge pull request #${pr.number} from ${pr.head.label}`);
      setMessage(pr.title);
    } else {
      setTitle(pr.title);
      setMessage('');
    }
  }, [method, pr]);

  const canMerge = mergeable !== false && mergeableState !== 'blocked';

  useInput((input, key) => {
    if (loading) return;

    if (inputMode) {
      if (key.return) {
        // Finish input
        if (step === 'title') {
          setTitle(currentInput);
          setStep('message');
        } else if (step === 'message') {
          setMessage(currentInput);
          setStep('confirm');
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
      if (step === 'method') {
        onCancel();
      } else {
        // Go back to previous step
        const steps: MergeStep[] = ['method', 'title', 'message', 'confirm'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
          setStep(steps[currentIndex - 1]);
        }
      }
      return;
    }

    if (step === 'method') {
      if (key.upArrow || input === 'k') {
        setSelectedMethodIndex(Math.max(0, selectedMethodIndex - 1));
      } else if (key.downArrow || input === 'j') {
        setSelectedMethodIndex(Math.min(methods.length - 1, selectedMethodIndex + 1));
      } else if (key.return) {
        setMethod(methods[selectedMethodIndex]);
        setStep('title');
      } else if (input === 'q') {
        onCancel();
      }
    } else if (step === 'title') {
      if (key.return) {
        setInputMode(true);
        setCurrentInput(title);
      } else if (input === 'n') {
        setStep('message');
      }
    } else if (step === 'message') {
      if (key.return) {
        setInputMode(true);
        setCurrentInput(message);
      } else if (input === 'n') {
        setStep('confirm');
      } else if (input === 's') {
        // Skip message
        setMessage('');
        setStep('confirm');
      }
    } else if (step === 'confirm') {
      if (key.return || input === 'y') {
        onMerge({
          commit_title: title,
          commit_message: message,
          merge_method: method,
        });
      } else if (input === 'e') {
        setStep('title');
      }
    }
  });

  const renderMergeabilityStatus = () => {
    if (mergeable === null) {
      return <Text color="yellow">⏳ Checking mergeability...</Text>;
    }
    
    if (!canMerge) {
      return (
        <Box flexDirection="column">
          <Text color="red">❌ Cannot merge this pull request</Text>
          <Text color="gray">Status: {mergeableState}</Text>
        </Box>
      );
    }

    return <Text color="green">✅ Ready to merge</Text>;
  };

  const renderMethod = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>🔀 Select Merge Method</Text>
      <Text color="gray">Choose how to merge this pull request</Text>
      
      {renderMergeabilityStatus()}

      <Box marginY={1} borderStyle="single" borderColor="cyan" padding={1}>
        <Box flexDirection="column">
          {methods.map((methodOption, index) => {
            const info = mergeMethodInfo[methodOption];
            const isSelected = index === selectedMethodIndex;
            
            return (
              <Box 
                key={methodOption}
                borderStyle={isSelected ? 'round' : 'single'}
                borderColor={isSelected ? 'cyan' : 'gray'}
                padding={1}
                marginBottom={1}
                backgroundColor={isSelected ? 'blue' : undefined}
              >
                <Box flexDirection="column" width="100%">
                  <Text color={isSelected ? 'black' : 'white'} bold>
                    {info.icon} {info.name}
                  </Text>
                  <Text color={isSelected ? 'black' : 'gray'}>
                    {info.description}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {!canMerge ? (
        <Text color="red">Cannot proceed - PR is not mergeable</Text>
      ) : (
        <Text color="gray">↑↓/j/k: Navigate • Enter: Select • q: Cancel</Text>
      )}
    </Box>
  );

  const renderTitle = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>📝 Merge Commit Title</Text>
      <Text color="gray">Edit the commit title for the merge</Text>
      
      <Box marginY={1} borderStyle="single" borderColor="cyan" padding={1}>
        <Box flexDirection="column">
          <Text color="white" bold>Commit title:</Text>
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

  const renderMessage = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>💬 Commit Message (Optional)</Text>
      <Text color="gray">Add additional details to the commit message</Text>
      
      <Box marginY={1} borderStyle="single" borderColor="cyan" padding={1} height={6}>
        <Box flexDirection="column">
          <Text color="white" bold>Commit message:</Text>
          <Text color={inputMode ? "black" : "white"} backgroundColor={inputMode ? "cyan" : undefined}>
            {inputMode ? currentInput : message || "(No message)"}
            {inputMode && <Text color="black">│</Text>}
          </Text>
        </Box>
      </Box>

      <Text color="gray">
        {inputMode ? "Type your message and press Enter to continue" : "Enter: Edit • s: Skip • n: Next"}
      </Text>
    </Box>
  );

  const renderConfirm = () => (
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>🚀 Confirm Merge</Text>
      <Text color="gray">Review your merge settings before proceeding</Text>
      
      <Box marginY={1} borderStyle="single" borderColor="green" padding={1}>
        <Box flexDirection="column">
          <Text color="white" bold>Method:</Text>
          <Text color="yellow">
            {mergeMethodInfo[method].icon} {mergeMethodInfo[method].name}
          </Text>
          
          <Text color="white" bold marginTop={1}>Title:</Text>
          <Text color="cyan">{title}</Text>
          
          <Text color="white" bold marginTop={1}>Message:</Text>
          <Text color="white">{message || "(No message)"}</Text>
          
          <Text color="white" bold marginTop={1}>PR:</Text>
          <Text color="white">#{pr.number} - {pr.title}</Text>
        </Box>
      </Box>

      <Text color="green">Press Enter or y to merge • e: Edit • ESC: Back</Text>
    </Box>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box justifyContent="center" alignItems="center" height={20}>
          <Text color="yellow">🔄 Merging pull request...</Text>
        </Box>
      );
    }

    switch (step) {
      case 'method': return renderMethod();
      case 'title': return renderTitle();
      case 'message': return renderMessage();
      case 'confirm': return renderConfirm();
      default: return renderMethod();
    }
  };

  const getStepIndicator = () => {
    const steps = ['method', 'title', 'message', 'confirm'];
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
          ESC: {step === 'method' ? 'Cancel' : 'Back'} • 
          {step === 'method' && ' ↑↓/j/k: Navigate • '}
          {step !== 'method' && step !== 'confirm' && ' n: Next • '}
          q: Quit
        </Text>
      </Box>
    </Box>
  );
}