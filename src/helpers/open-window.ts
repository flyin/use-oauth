// Define a function to open a new browser window with specific dimensions and URL
export function openWindow(url: string, title: string, w: number, h: number): Window | null {
  // Detect user agent to determine if the device is mobile
  const userAgent = navigator.userAgent,
    isMobile = (): boolean =>
      /\b(iPhone|iP[ao]d)/.test(userAgent) || /Android/i.test(userAgent) || /Mobile/i.test(userAgent)

  // Get positions and sizes to center the new window on the screen
  const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft
  const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop
  const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth
  const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : document.documentElement.clientHeight - 22

  // On mobile devices, open the window with default dimensions
  const targetWidth = isMobile() ? 0 : w
  const targetHeight = isMobile() ? 0 : h
  const v = screenX < 0 ? window.screen.width + screenX : screenX
  const left = v + (outerWidth - targetWidth) / 2
  const right = screenY + (outerHeight - targetHeight) / 2.5

  // Set features for the window based on calculations above
  const features = []

  if (targetWidth) {
    features.push('width=' + targetWidth)
  }

  if (targetHeight) {
    features.push('height=' + targetHeight)
  }
  
  // Position window in the center
  if (targetHeight && targetWidth) {
    features.push('left=' + left)
    features.push('top=' + right)
  }

  // Allow window to have scrollbars
  features.push('scrollbars=1')

  // Open the new window with the specified features
  const newWindow = window.open(url, title, features.join(','))

  // If the new window is successfully created, focus on it
  if (newWindow && newWindow.focus) {
    newWindow.focus()
  }

  // Return the reference to the newly opened window or null if it failed
  return newWindow
}
