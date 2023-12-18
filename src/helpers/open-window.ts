// This file seems correct in terms of functionality. 
// It opens a new window with the provided parameters or mobile-friendly defaults.
// There doesn't appear to have any bugs, and optimization seems fine.
export function openWindow(url: string, title: string, w: number, h: number): Window | null {
  const userAgent = navigator.userAgent;
  const isMobile = (): boolean =>
    /\b(iPhone|iP[ao]d)/.test(userAgent) || /\b(iP[ao]d)/.test(userAgent) || /Android/i.test(userAgent) || /Mobile/i.test(userAgent);

  const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
  const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
  const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth;
  const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.documentElement.clientHeight - 22;
  const targetWidth = isMobile() ? null : w;
  const targetHeight = isMobile() ? null : h;
  const v = screenX < 0 ? window.screen.width + screenX : screenX;
  const left = v + (outerWidth - (targetWidth || outerWidth)) / 2;
  const right = screenY + (outerHeight - (targetHeight || outerHeight)) / 2.5;

  const features = [];

  if (targetWidth !== null) {
    features.push('width=' + targetWidth);
  }

  if (targetHeight !== null) {
    features.push('height=' + targetHeight);
  }

  if (targetWidth !== null && targetHeight !== null) {
    features.push('left=' + left);
    features.push('top=' + right);
  }

  features.push('scrollbars=1');

  const newWindow = window.open(url, title, features.join(','));

  if (newWindow) {
    newWindow.focus();
  }

  return newWindow;
}
