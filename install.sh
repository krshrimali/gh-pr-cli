#!/bin/bash

# GitHub PR Review CLI Installer
set -e

echo "🚀 Installing GitHub PR Review CLI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install globally
echo "📦 Installing from npm..."
npm install -g gh-pr-review

echo "✅ Installation complete!"
echo ""
echo "🎯 Usage:"
echo "  gh-pr-review --help"
echo "  gh-pr-review --repo owner/repo"
echo ""
echo "📝 Set up GitHub token:"
echo "  export GITHUB_TOKEN=your_token_here"
echo "  # or use --token flag"