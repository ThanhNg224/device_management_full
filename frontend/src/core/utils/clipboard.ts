/**
 * Clipboard utility functions with fallback support
 */

/**
 * Copy text to clipboard with fallback for non-HTTPS or unsupported browsers
 * @param text - The text to copy to clipboard
 * @returns Promise<boolean> - true if successful, false if failed
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // First try the modern Clipboard API (requires HTTPS)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    
    // Fallback for older browsers or non-HTTPS
    return fallbackCopyToClipboard(text)
  } catch (error) {
    console.warn('Clipboard API failed, trying fallback:', error)
    return fallbackCopyToClipboard(text)
  }
}

/**
 * Fallback clipboard copy using document.execCommand (deprecated but widely supported)
 * @param text - The text to copy
 * @returns boolean - true if successful, false if failed
 */
function fallbackCopyToClipboard(text: string): boolean {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Make it invisible but not display: none (which would prevent selection)
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.setAttribute('readonly', '')
    
    // Add to DOM, select, copy, and remove
    document.body.appendChild(textArea)
    textArea.select()
    textArea.setSelectionRange(0, 99999) // For mobile devices
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    return successful
  } catch (error) {
    console.error('Fallback clipboard copy failed:', error)
    return false
  }
}

/**
 * Copy text with toast notification
 * @param text - The text to copy
 * @param onSuccess - Callback for successful copy (for showing success toast)
 * @param onError - Callback for failed copy (for showing error toast)
 */
export async function copyWithToast(
  text: string,
  onSuccess?: (text: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  const success = await copyToClipboard(text)
  
  if (success) {
    onSuccess?.(text)
  } else {
    onError?.('Copy to clipboard is not supported in this browser')
  }
}
