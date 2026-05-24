import React, { useState, useEffect } from 'react';
import { Home, Scan, Apple, User as UserIcon, Bell, Menu, UtensilsCrossed, Dumbbell, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { SignOutButton } from './Auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark'; // Default
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'planner', label: 'Meals', icon: UtensilsCrossed },
    { id: 'scanner', label: 'Scan', icon: Scan },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-base)] text-[var(--color-text-main)] transition-colors duration-500 font-sans">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg-base)]/80 backdrop-blur-xl border-b border-[var(--color-border)] h-16">
        <div className="max-w-md mx-auto h-full px-4 flex items-center justify-between">
          <button className="p-2 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary fill-current">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                <circle cx="50" cy="50" r="15" />
                <path d="M50 5 L50 25 M50 75 L50 95 M5 50 L25 50 M75 50 L95 50" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xl font-display font-black tracking-tight">FuelFit</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <div className="relative p-2">
              <Bell className="w-6 h-6 text-[var(--color-text-muted)]" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-[var(--color-bg-base)]" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-16 pb-24">
        <div className="max-w-md mx-auto w-full px-4 pt-4">
          {children}
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50 px-0 pb-0 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
          <div className="max-w-md mx-auto h-20 bg-[var(--color-nav-bg)] border-t border-[var(--color-border)] flex items-center justify-around px-2 relative">
            
            {tabs.map((tab) => {
              if (tab.id === 'scanner') {
                return (
                  <div key={tab.id} className="relative -top-6">
                    <button
                      onClick={() => setActiveTab('scanner')}
                      className={cn(
                        "w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl border-4 border-[var(--color-bg-base)]",
                        activeTab === 'scanner' 
                          ? "bg-black text-white scale-110" 
                          : "bg-primary text-black hover:scale-105 active:scale-95"
                      )}
                    >
                      <Scan className="w-7 h-7" />
                    </button>
                    <span className={cn(
                      "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold",
                      activeTab === 'scanner' ? "text-primary" : "text-[var(--color-text-muted)]"
                    )}>
                      Scan
                    </span>
                  </div>
                );
              }

              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all flex-1 py-2",
                    activeTab === tab.id ? "text-primary" : "text-[var(--color-text-muted)]"
                  )}
                >
                  <Icon className={cn("w-6 h-6", activeTab === tab.id ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
                  <span className="text-[10px] font-bold">{tab.label}</span>
                </button>
              );
            })}
            
          </div>
        </div>
      </main>
    </div>
  );
}
