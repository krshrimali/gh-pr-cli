#!/bin/bash

# Build binaries using Bun
echo "🚀 Building cross-platform binaries..."

# Create dist directory
mkdir -p dist/binaries

# Build for different platforms
echo "📦 Building Linux binary..."
bun build src/cli.ts --compile --target=bun-linux-x64 --outfile dist/binaries/gh-pr-review-linux

echo "📦 Building macOS binary..."  
bun build src/cli.ts --compile --target=bun-darwin-x64 --outfile dist/binaries/gh-pr-review-macos

echo "📦 Building Windows binary..."
bun build src/cli.ts --compile --target=bun-windows-x64 --outfile dist/binaries/gh-pr-review.exe

echo "✅ Binaries built successfully!"
echo "📁 Check dist/binaries/ folder"

# Make binaries executable
chmod +x dist/binaries/gh-pr-review-*

echo "🎯 Ready for distribution!"