// Background service worker
// Intercepts API requests to capture the authentication token

// Listen to all requests to the Advocu API
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // Look for the Authorization header
    const authHeader = details.requestHeaders?.find(
      header => header.name.toLowerCase() === 'authorization'
    );

    if (authHeader && authHeader.value) {
      // Extract the token (format: "Bearer <token>")
      const token = authHeader.value.replace('Bearer ', '').trim();

      if (token) {
        // Store the token in chrome.storage
        chrome.storage.local.set({
          advocuAuthToken: token,
          tokenCapturedAt: new Date().toISOString()
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error storing auth token:', chrome.runtime.lastError);
          }
        });
      }
    }
  },
  { urls: ['https://api-wtm.advocu.com/*'] },
  ['requestHeaders']
);
