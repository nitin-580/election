'use client';

import React, { useState } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useTheme } from '../../components/ThemeProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Award,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Vote,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by AuthProvider
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Voters List', href: '/voters', icon: Users },
    { name: 'Volunteers', href: '/volunteers', icon: Award },
  ];

  if (user?.role === 'Admin') {
    navigation.push({ name: 'Users List', href: '/users', icon: ShieldCheck });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo Area */}
          <div className="flex items-center px-6 space-x-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Vote className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-card-foreground">WAR ROOM</h1>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Election HQ</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                      : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom user card */}
          <div className="flex-shrink-0 flex border-t border-border p-4">
            <div className="flex items-center w-full justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold truncate text-card-foreground">{user.username}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Logout button */}
            <button
              onClick={logout}
              className="inline-flex items-center space-x-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger px-4 py-2 text-xs font-semibold transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-8">
          {children}
        </main>
      </div>

      {/* Mobile Menu Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

          <div className="relative flex w-full max-w-xs flex-col bg-card border-r border-border p-5 pt-10">
            <button
              className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center px-2 space-x-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                <Vote className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-card-foreground">WAR ROOM</h1>
                <p className="text-[10px] text-muted-foreground uppercase">Election HQ</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border pt-4 mt-auto">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{user.username}</p>
                  <p className="text-[10px] text-muted-foreground">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
