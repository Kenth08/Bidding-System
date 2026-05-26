// Debug token storage and API requests
console.log('=== TOKEN DEBUG START ===');

// Check sessionStorage
const sessionToken = sessionStorage.getItem('access_token');
console.log('sessionStorage access_token:', sessionToken ? `${sessionToken.substring(0, 20)}...` : 'NOT FOUND');

// Check cookies
console.log('Cookies:', document.cookie);
const cookies = document.cookie.split(';');
const accessCookie = cookies.find(c => c.trim().startsWith('access_token='));
if (accessCookie) {
  const token = accessCookie.split('=')[1];
  console.log('Cookie access_token:', `${token.substring(0, 20)}...`);
}

// Monitor API requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch called:', args[0]);
  if (args[1]?.headers) {
    console.log('Fetch headers:', args[1].headers);
  }
  return originalFetch.apply(this, args);
};

// Monitor XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(...args) {
  console.log('XHR open:', args[1]);
  this.addEventListener('loadstart', () => {
    console.log('XHR headers:', this.getAllResponseHeaders());
  });
  return originalXHROpen.apply(this, args);
};

console.log('=== TOKEN DEBUG READY ===');