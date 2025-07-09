const os = require('os');

// Check if we're on Windows
const isWindows = os.platform() === 'win32';

// Create a fallback module for non-Windows platforms
const fallback = {
  WDA_NONE: 0,
  WDA_MONITOR: 1,
  WDA_EXCLUDEFROMCAPTURE: 2,
  setWindowDisplayAffinity: () => false,
  resetWindowDisplayAffinity: () => false,
  getWindowDisplayAffinity: () => -1
};

// Try to load the native module
let native;
try {
  if (isWindows) {
    const bindings = require('bindings');
    native = bindings('window-utils');
  } else {
    native = fallback;
  }
} catch (err) {
  console.error('Failed to load window-utils native addon:', err.message);
  console.error('Screen capture protection will not be available.');
  native = fallback;
}

module.exports = {
  // Constants
  WDA_NONE: native.WDA_NONE,
  WDA_MONITOR: native.WDA_MONITOR,
  WDA_EXCLUDEFROMCAPTURE: native.WDA_EXCLUDEFROMCAPTURE,
  
  /**
   * Hide a window from screen capture
   * @param {number} windowHandle - Native window handle
   * @returns {boolean} Success
   */
  hideFromCapture: function(windowHandle) {
    return native.setWindowDisplayAffinity(windowHandle, native.WDA_EXCLUDEFROMCAPTURE);
  },
  
  /**
   * Reset window capture settings to normal
   * @param {number} windowHandle - Native window handle
   * @returns {boolean} Success
   */
  showInCapture: function(windowHandle) {
    return native.resetWindowDisplayAffinity(windowHandle);
  },
  
  /**
   * Get the current window display affinity value
   * @param {number} windowHandle - Native window handle
   * @returns {number} Affinity value or -1 on error
   */
  getDisplayAffinity: function(windowHandle) {
    return native.getWindowDisplayAffinity(windowHandle);
  },
  
  // Direct access to native functions
  setWindowDisplayAffinity: native.setWindowDisplayAffinity,
  resetWindowDisplayAffinity: native.resetWindowDisplayAffinity,
  getWindowDisplayAffinity: native.getWindowDisplayAffinity
};
