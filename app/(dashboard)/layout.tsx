'use client';

import Link from 'next/link';
import { use, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { CircleIcon, Home, LogOut, Settings, User, Shield, Key, Menu, X, 
  BarChart3, BookmarkIcon, RefreshCw, Search, Bell, FileText, 
  PieChart, Users, Clock, Building } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/lib/auth';
import { signOut } from '@/app/(login)/actions';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userPromise } = useUser();
  const user = use(userPromise);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.refresh();
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Pricing
        </Link>
        <Button size="sm" asChild>
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col px-2 py-1.5">
          <span className="text-sm font-medium">{user.name || 'User'}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex cursor-pointer items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex cursor-pointer items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile/password" className="flex cursor-pointer items-center">
            <Key className="mr-2 h-4 w-4" />
            <span>Change Password</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile/team" className="flex cursor-pointer items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Team Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={handleSignOut}>
          <button type="submit" className="w-full">
            <DropdownMenuItem className="cursor-pointer" onSelect={(e) => e.preventDefault()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar() {
  const pathname = usePathname();
  
  const mainNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/tenders', icon: FileText, label: 'Tenders' },
    { href: '/dashboard/activity', icon: Clock, label: 'Activity' },
  ];
  
  const tenderNavItems = [
    { href: '/dashboard/tenders', icon: BarChart3, label: 'Overview' },
    { href: '/dashboard/tenders/browse', icon: Search, label: 'Browse' },
    { href: '/dashboard/tenders/saved', icon: BookmarkIcon, label: 'Saved' },
    { href: '/dashboard/tenders/sync', icon: RefreshCw, label: 'Sync' },
    { href: '/dashboard/tenders/analytics', icon: PieChart, label: 'Analytics' },
  ];
  
  const teamNavItems = [
    { href: '/dashboard/profile/team', icon: Users, label: 'Team' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' },
  ];

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    
    return (
      <Link 
        href={href}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Link>
    );
  };

  const NavSection = ({ title, items }: { title: string; items: any[] }) => (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>
    </div>
  );

  return (
    <aside className="w-64 border-r bg-card px-3 py-4 h-full fixed left-0 top-14 overflow-y-auto">
      <div className="space-y-6">
        <NavSection title="Main" items={mainNavItems} />
        <NavSection title="Tenders" items={tenderNavItems} />
        <NavSection title="Account" items={teamNavItems} />
      </div>
    </aside>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <section className="flex min-h-screen flex-col">
      <header className="border-b bg-background py-3 sticky top-0 z-10">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <CircleIcon className="h-5 w-5 text-orange-500" />
              <span className="font-medium">ACME</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Suspense fallback={<div className="h-8 w-8" />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <div className={`md:block ${sidebarOpen ? 'block' : 'hidden'}`}>
          <Sidebar />
        </div>
        <main className="flex-1 p-6 md:ml-64">
          {children}
        </main>
      </div>
    </section>
  );
}
