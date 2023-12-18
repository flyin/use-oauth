// This function attempts to open a new window with the specified URL, title, and size.
export function openWindow(url: string, title: string, w: number, h: number): Window | null {
  // Detect the user's device type
  const userAgent = navigator.userAgent,
    isMobile = (): boolean =>
      /\b(iPhone|iP[ao]d)/.test(userAgent) || /\b(iP[ao]d)/.test(userAgent) || /Android/i.test(userAgent) || /Mobile/i.test(userAgent)

  // Calculate window position
  const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft
  const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop
  const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth
  const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.documentElement.clientHeight - 22
  const targetWidth = isMobile() ? 0 : w
  const targetHeight = isMobile() ? 0 : h
  const v = screenX < 0 ? window.screen.width + screenX : screenX
  const left = v + (outerWidth - targetWidth) / 2  // Center horizontally
  const right = screenY + (outerHeight - targetHeight) / 2.5  // Center vertically

  // Set features for the new window
  const features = []

  if (targetWidth) {
    features.push('width=' + targetWidth)
  }

  if (targetHeight) {
    features.push('height=' + targetHeight)
  }

  if (targetHeight && targetWidth) {
    features.push('left=' + left)
    features.push('top=' + right)
  }

  features.push('scrollbars=1')

  // Attempt to create the new window
  const newWindow = window.open(url, title, features.join(','))

  // Focus on the new window if it's been opened successfully
  if (newWindow && newWindow.focus) {
    newWindow.focus()
  }

  // Return the new window object (or null if the window couldn't be opened)
  return newWindow
}