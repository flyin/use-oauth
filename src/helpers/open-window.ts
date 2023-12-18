// This function opens a new browser window with a given URL and window dimensions.
export function openWindow(url: string, title: string, w: number, h: number): Window | null {
  // Detect user agent and mobile devices
  const userAgent = navigator.userAgent,
    isMobile = (): boolean =>
      /\b(iPhone|iP[ao]d)/.test(userAgent) || /\b(iP[ao]d)/.test(userAgent) || /Android/i.test(userAgent) || /Mobile/i.test(userAgent)

  // Calculate window position based on current screen size and desired window size
  const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft
  const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop
  const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth
  const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.documentElement.clientHeight - 22
  const targetWidth = isMobile() ? 0 : w
  const targetHeight = isMobile() ? 0 : h
  const v = screenX < 0 ? window.screen.width + screenX : screenX
  const left = v + (outerWidth - targetWidth) / 2
  const right = screenY + (outerHeight - targetHeight) / 2.5

  // Build the string for window features
  const features = []

  // Add width and height to features if not on a mobile device
  if (targetWidth) {
    features.push('width=' + targetWidth)
  }

  if (targetHeight) {
    features.push('height=' + targetHeight)
  }

  // Set the position for the new window
  if (targetHeight && targetWidth) {
    features.push('left=' + left)
    features.push('top=' + right)
  }

  // Enable scrollbars for the new window
  features.push('scrollbars=1')

  // Open the new window with the specified features
  const newWindow = window.open(url, title, features.join(','))

  // If the new window was successfully opened, bring it into focus
  if (newWindow && newWindow.focus) {
    newWindow.focus()
  }

  // Return the new window object or null if it failed to open
  return newWindow
}
