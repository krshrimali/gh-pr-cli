import { execSync } from 'child_process';

export function openInBrowser(url: string): void {
  try {
    const platform = process.platform;
    
    let command: string;
    switch (platform) {
      case 'darwin': // macOS
        command = `open "${url}"`;
        break;
      case 'win32': // Windows
        command = `start "${url}"`;
        break;
      default: // Linux and others
        command = `xdg-open "${url}"`;
        break;
    }
    
    execSync(command, { stdio: 'ignore' });
    console.log(`🌐 Opened in browser: ${url}`);
  } catch (error) {
    console.error('Failed to open in browser:', error);
  }
}