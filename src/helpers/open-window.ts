export function openWindow(url: string, title: string, w: number, h: number): Window | null {
  const userAgent = navigator.userAgent,
    isMobile = (): boolean =>
      /\b(iPhone|iP[ao]d)/.test(userAgent) || /\b(iP[ao]d)/.test(userAgent) || /Android/i.test(userAgent) || /Mobile/i.test(userAgent);

  const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
  const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
  const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth;
  const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.documentElement.clientHeight - 22;
  const targetWidth = isMobile() ? 0 : w;
  const targetHeight = isMobile() ? 0 : h;
  const v = screenX < 0 ? window.screen.width + screenX : screenX;
  const left = v + (outerWidth - targetWidth) / 2;
  const right = screenY + (outerHeight - targetHeight) / 2.5;

  const features = [];

  if (targetWidth !== null) {
    features.push('width=' + targetWidth);
  }

  if (targetHeight !== null) {
    features.push('height=' + targetHeight);
  }

  features.push('left=' + left);
  features.push('top=' + right);
  features.push('scrollbars=1');

  const newWindow = window.open(url, title, features.join(','));

  if (newWindow && newWindow.focus) {
    newWindow.focus();
  }

  return newWindow;
}
