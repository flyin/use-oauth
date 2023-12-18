// This function is responsible for opening a new window with specific dimensions
export function openWindow(url: string, title: string, w: number, h: number): Window | null {
  // Identify the user agent to determine if the environment is mobile
  const userAgent = navigator.userAgent;
  const isMobile = (): boolean =>
    /\b(iPhone|iP[ao]d)/.test(userAgent) || /\b(iP[ao]d)/.test(userAgent) || /Android/i.test(userAgent) || /Mobile/i.test(userAgent);

  // Retrieve the screen's x and y coordinates
  const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
  const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;

  // Get the outer dimensions of the window
  const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth;
  const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.documentElement.clientHeight - 22;

  // Calculate the target dimensions, considering mobile environments
  const targetWidth = isMobile() ? 0 : w;
  const targetHeight = isMobile() ? 0 : h;

  // Calculate the position of the window
  const v = screenX < 0 ? window.screen.width + screenX : screenX;
  const left = v + (outerWidth - targetWidth) / 2;
  const right = screenY + (outerHeight - targetHeight) / 2.5;

  // Initialize an array to hold window features
  const features = [];

  // Add dimensions to features, if applicable
  if (targetWidth) {
    features.push('width=' + targetWidth);
  }

  if (targetHeight) {
    features.push('height=' + targetHeight);
  }

  // Set the position for the new window
  if (targetHeight && targetWidth) {
    features.push('left=' + left);
    features.push('top=' + right);
  }

  // Enable scrollbars for the window
  features.push('scrollbars=1');

  // Open the new window with the specified features and url
  const newWindow = window.open(url, title, features.join(','));

  // Try to focus on the new window if possible
  if (newWindow && newWindow.focus) {
    newWindow.focus();
  }

  return newWindow;
}
