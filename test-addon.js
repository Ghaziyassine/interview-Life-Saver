// Test the native addon functionality
const windowUtils = require('./native-addon/window-utils');

console.log('Loaded window-utils native addon');
console.log('Constants:');
console.log('WDA_NONE =', windowUtils.WDA_NONE);
console.log('WDA_MONITOR =', windowUtils.WDA_MONITOR);
console.log('WDA_EXCLUDEFROMCAPTURE =', windowUtils.WDA_EXCLUDEFROMCAPTURE);
console.log('API methods available:');
console.log('setWindowDisplayAffinity:', typeof windowUtils.setWindowDisplayAffinity);
console.log('resetWindowDisplayAffinity:', typeof windowUtils.resetWindowDisplayAffinity);
console.log('getWindowDisplayAffinity:', typeof windowUtils.getWindowDisplayAffinity);
console.log('hideFromCapture:', typeof windowUtils.hideFromCapture);
console.log('showInCapture:', typeof windowUtils.showInCapture);
console.log('getDisplayAffinity:', typeof windowUtils.getDisplayAffinity);
