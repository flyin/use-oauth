// Function to open a new browser window with specific dimensions and features.
export function openWindow(url: string, title: string, w: number, h: number): Window | null {
  // User-agent detection for mobile devices
  const userAgent = navigator.userAgent;
  const isMobile = (): boolean =>
    /\b(iPhone|iP[ao]d)/.test(userAgent) || /\b(iP[ao]d)/.test(userAgent) || /Android/i.test(userAgent) || /Mobile/i.test(userAgent);

  // Obtain browser screen position and size
  const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
  const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
  const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth;
  const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.documentElement.clientHeight - 22;
  
  // Calculate window dimensions and position for a centered popup
  const targetWidth = isMobile() ? 0 : w;
  const targetHeight = isMobile() ? 0 : h;
  const v = screenX < 0 ? window.screen.width + screenX : screenX;
  const left = v + (outerWidth - targetWidth) / 2;
  const right = screenY + (outerHeight - targetHeight) / 2.5;

  // Compose features string for the window.open() function
  const features = [];
  if (targetWidth) {
    features.push('width=' + targetWidth);
  }
  if (targetHeight) {
    features.push('height=' + targetHeight);
  }
  if (targetHeight && targetWidth) {
    features.push('left=' + left);
    features.push('top=' + right);
  }
  features.push('scrollbars=1');

  // Open the new window
  const newWindow = window.open(url, title, features.join(','));

  // Focus the new window if available
  if (newWindow && newWindow.focus) {
    newWindow.focus();
  }

  return newWindow;
}