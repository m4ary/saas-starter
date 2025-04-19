'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOutClient, isAuthenticated, refreshSession } from '@/lib/auth/client';

export default function AnalyticsPage() {
  const [authStatus, setAuthStatus] = useState<string>('Checking authentication...');
  const [cookies, setCookies] = useState<string>('Loading cookies...');

  useEffect(() => {
    // Check if we can access the browser's cookies (just the names for security)
    const cookieNames = document.cookie.split(';').map(c => c.trim().split('=')[0]);
    setCookies(`Found cookies: ${cookieNames.join(', ') || 'None'}`);
    
    // Check authentication
    const authenticated = isAuthenticated();
    setAuthStatus(authenticated ? 'Session cookie found' : 'No session cookie found');
    
    // Test API call
    fetch('/api')
      .then(response => {
        if (response.ok) {
          setAuthStatus(prev => `${prev} ✓ API access successful`);
        } else {
          setAuthStatus(prev => `${prev} ✗ API access failed: ${response.status}`);
        }
      })
      .catch(error => {
        setAuthStatus(prev => `${prev} ✗ API error: ${error.message}`);
      });
  }, []);

  const handleRefresh = () => {
    refreshSession();
  };

  const handleSignOut = async () => {
    await signOutClient();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Authentication Test</h2>
        <div className="space-x-2">
          <Button onClick={handleRefresh}>Refresh Session</Button>
          <Button variant="destructive" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This page helps diagnose authentication issues.</p>
          <div className="p-4 bg-gray-100 rounded-md">
            <p><strong>Auth Status:</strong> {authStatus}</p>
            <p><strong>Cookies:</strong> {cookies}</p>
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Session Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>If you're experiencing authentication issues, try the following:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Clear your browser cookies and cache</li>
            <li>Try signing out and signing back in</li>
            <li>Make sure your browser accepts cookies</li>
            <li>If using incognito/private mode, try regular browsing</li>
          </ol>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Button onClick={() => window.location.href = '/sign-in'}>Go to Sign In</Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 