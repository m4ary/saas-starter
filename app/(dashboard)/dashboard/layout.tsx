'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  BookmarkIcon, 
  RefreshCw, 
  Menu
} from 'lucide-react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // This would need to be replaced with actual admin check
  useEffect(() => {
    // Simulate admin check
    setIsAdmin(true);
  }, []);

  const navItems = [
    { 
      href: '/dashboard/tenders', 
      icon: BarChart3, 
      label: 'Overview',
      description: 'See all tenders and insights'
    },
    { 
      href: '/dashboard/tenders/saved', 
      icon: BookmarkIcon, 
      label: 'Saved Filters',
      description: 'Your saved searches and filters'
    },
    ...(isAdmin ? [{
      href: '/dashboard/tenders/sync', 
      icon: RefreshCw, 
      label: 'Sync Tenders',
      description: 'Manage tender synchronization'
    }] : [])
  ];

  return (
    <div className="container py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Tenders Dashboard</h1>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <aside className={`md:col-span-3 lg:col-span-2 ${isSidebarOpen ? 'block' : 'hidden'} md:block`}>
          <nav className="space-y-1 sticky top-4">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className="block mb-1"
              >
                <Button
                  variant={pathname.startsWith(item.href) ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
                <p className="text-xs text-muted-foreground ml-7 hidden lg:block">
                  {item.description}
                </p>
              </Link>
            ))}
          </nav>
        </aside>
        
        <main className="md:col-span-9 lg:col-span-10">
          {children}
        </main>
      </div>
    </div>
  );
}
