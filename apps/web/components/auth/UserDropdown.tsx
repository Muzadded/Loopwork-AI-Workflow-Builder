'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, Shield, Settings, ChevronDown, Check } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';

export const UserDropdown: React.FC = () => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openAuthModal('login')}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl transition-all"
          style={{ color: 'var(--text-primary)', border: '1px solid var(--border-strong)', backgroundColor: 'transparent' }}
        >
          Sign In
        </button>
        <button
          onClick={() => openAuthModal('signup')}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--accent-on-primary)' }}
        >
          Sign Up
        </button>
      </div>
    );
  }

  // Get user initials e.g. Muzadded Ahmed -> MA
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'LW';

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl transition-all hover:bg-[var(--bg-card-inset)]"
        style={{ border: '1px solid var(--border-default)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold tracking-wider"
          style={{ backgroundColor: 'var(--accent-subtle-bg)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}
        >
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-medium line-clamp-1 max-w-[110px]" style={{ color: 'var(--text-primary)' }}>
            {user.name}
          </span>
          <span className="text-[10px] font-mono line-clamp-1 max-w-[110px]" style={{ color: 'var(--text-muted)' }}>
            {user.email}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 p-2 rounded-2xl shadow-2xl z-50 animate-fadeIn"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}
        >
          {/* Header Info */}
          <div className="p-3 mb-1 rounded-xl" style={{ backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-default)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </p>
            <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              {user.email}
            </p>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
              <Shield className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                {user.role || 'Enterprise Admin'}
              </span>
            </div>
          </div>

          {/* Menu Options */}
          <div className="space-y-0.5">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-card-inset)]"
              style={{ color: 'var(--text-primary)' }}
            >
              <UserIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              Account Profile
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-2.5 transition-colors hover:bg-[var(--bg-card-inset)]"
              style={{ color: 'var(--text-primary)' }}
            >
              <Settings className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              Workspace Settings
            </button>
          </div>

          <div className="my-1.5 h-[1px]" style={{ backgroundColor: 'var(--border-default)' }} />

          {/* Sign Out Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-2.5 transition-colors"
            style={{ color: 'var(--status-failed-text)', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--status-failed-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
