'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOutClient } from '@/lib/auth/client';

export default function TendersHeader() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard/tenders', label: 'Dashboard' },
    { href: '/dashboard/tenders/browse', label: 'Browse' },
    { href: '/dashboard/tenders/sync', label: 'Sync Logs' },
    { href: '/dashboard/tenders/analytics', label: 'Authentication Test' },
  ];
  
  const handleSignOut = async () => {
    await signOutClient();
  };
  
  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="container mx-auto py-3">
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? 'default' : 'ghost'}
                asChild
                className="text-sm"
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
          <div>
            <Button variant="outline" onClick={handleSignOut} className="text-sm">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 