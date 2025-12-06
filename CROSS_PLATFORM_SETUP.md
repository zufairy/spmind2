# Cross-Platform Development Setup

This guide helps both macOS and Windows developers work together on this React Native/Expo project.

## Prerequisites

### For Both Platforms:
- Node.js (version 18 or higher recommended)
- npm or yarn package manager
- Git

### For Windows Users:
- Windows 10/11
- PowerShell or Command Prompt
- Optional: Git Bash (recommended for better terminal experience)

### For macOS Users:
- macOS 10.15 or higher
- Terminal or iTerm2

## Installation Steps

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd geniusapp
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```
   
   **Note**: We use `--legacy-peer-deps` flag due to React version conflicts in the project. This is safe and necessary for the current setup.

3. **Verify cross-env installation**:
   ```bash
   npx cross-env NODE_ENV=test echo "Cross-env is working!"
   ```

## Available Scripts

All scripts are now cross-platform compatible thanks to `cross-env`:

- `npm run dev` - Start development server with telemetry disabled (port 8083)
- `npm run start` - Start development server normally (port 8083)
- `npm run build:web` - Build for web platform
- `npm run lint` - Run ESLint

## Environment Variables

The project uses `cross-env` to set environment variables that work on both platforms:

- `EXPO_NO_TELEMETRY=1` - Disables Expo telemetry (set in dev script)

## Troubleshooting

### Common Issues:

1. **Dependency conflicts**: Always use `--legacy-peer-deps` when installing:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Permission issues on Windows**: Run terminal as Administrator if needed

3. **Node version conflicts**: Ensure both developers use the same Node.js version (18+)

4. **Cross-env not found**: Reinstall dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

### Platform-Specific Notes:

**Windows:**
- Use PowerShell or Git Bash for better compatibility
- If using Command Prompt, some commands might behave differently
- Ensure Windows Defender doesn't block Node.js processes

**macOS:**
- No special considerations needed
- Terminal works perfectly with all commands

## Development Workflow

1. Both developers should use the same Node.js version
2. Always run `npm install --legacy-peer-deps` after pulling changes
3. Use `npm run dev` to start the development server
4. The project will work identically on both platforms

## File Paths

- All file paths in the project use forward slashes (`/`) which work on both platforms
- Git handles line ending differences automatically (CRLF for Windows, LF for macOS)

## Need Help?

If you encounter any issues:
1. Check that you're using the same Node.js version
2. Try deleting `node_modules` and running `npm install --legacy-peer-deps` again
3. Ensure you're using the correct terminal/command prompt
4. Check that all environment variables are being set correctly with `npx cross-env`
