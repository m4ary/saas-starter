'use client';

// Utility function to sign out by manually clearing the cookie
export async function signOutClient() {
  // First try the sign-out API endpoint
  try {
    const response = await fetch('/api/auth/signout', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      // If the API call worked, redirect
      window.location.href = '/sign-in';
      return;
    }
  } catch (error) {
    console.error('Error calling sign-out API:', error);
  }
  
  // Fallback: manually expire the cookie by setting it to a past date
  document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  window.location.href = '/sign-in';
}

// Function to check if the user is authenticated by checking for the session cookie
export function isAuthenticated() {
  return document.cookie.split(';').some(cookie => cookie.trim().startsWith('session='));
}

// Try to force a new session by refreshing the page
export function refreshSession() {
  window.location.reload();
} 