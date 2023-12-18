// Function to open a new browser window with specific settings

export function openWindow(url: string, title: string, w: number, h: number): Window | null {
  // Detect mobile user agent
  const userAgent = navigator.userAgent,
    isMobile = (): boolean =>
      /\b(iPhone|iP[ao]d)/.test(userAgent) || /\b(iP[ao]d)/.test(userAgent) || /Android/i.test(userAgent) || /Mobile/i.test(userAgent)

  // Calculate the position for the new window
  const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
  const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
  const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth;
  const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.documentElement.clientHeight - 22;
  const targetWidth = isMobile() ? 0 : w;
  const targetHeight = isMobile() ? 0 : h;
  const v = screenX < 0 ? window.screen.width + screenX : screenX;
  const left = v + (outerWidth - targetWidth) / 2;
  const right = screenY + (outerHeight - targetHeight) / 2.5;

  // Set up the feature list for the window
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

  // Focus on the new window if possible
  if (newWindow && newWindow.focus) {
    newWindow.focus();
  }

  return newWindow;
}