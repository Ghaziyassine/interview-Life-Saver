# Window Utils Native Addon

This native addon provides functionality to hide the application from screen capture using Windows APIs.

## Features

- Hides the application window from screen sharing and recording tools
- Makes the application invisible during screen recording/sharing but still visible to the user
- Compatible with all screen recording tools, meeting software, and system-level screen capture

## Technical Details

This addon uses the Windows API function `SetWindowDisplayAffinity` with the `WDA_EXCLUDEFROMCAPTURE` flag to make the window invisible during screen captures.

## Building the Addon

1. Make sure you have the following prerequisites installed:
   - Node.js and npm
   - Visual Studio with C++ desktop development workload
   - CMake

2. Install the dependencies:
   ```
   cd native-addon/window-utils
   npm install
   ```

3. Build the native addon:
   ```
   npm run rebuild
   ```

## Usage in Electron

```typescript
// Import the module (only on Windows)
const windowUtils = process.platform === 'win32' ? require('window-utils') : null;

// Hide window from screen capture
function hideWindowFromCapture(window) {
  if (process.platform !== 'win32' || !windowUtils) return false;
  
  try {
    const handle = window.getNativeWindowHandle().readUInt32LE(0);
    return windowUtils.hideFromCapture(handle);
  } catch (err) {
    console.error('Failed to hide window from screen capture:', err);
    return false;
  }
}

// Show window in screen capture again
function showWindowInCapture(window) {
  if (process.platform !== 'win32' || !windowUtils) return false;
  
  try {
    const handle = window.getNativeWindowHandle().readUInt32LE(0);
    return windowUtils.showInCapture(handle);
  } catch (err) {
    console.error('Failed to show window in screen capture:', err);
    return false;
  }
}
```

## API Reference

- `windowUtils.hideFromCapture(windowHandle)`: Hides a window from screen capture
- `windowUtils.showInCapture(windowHandle)`: Shows a window in screen capture (normal behavior)
- `windowUtils.getDisplayAffinity(windowHandle)`: Gets the current display affinity value
