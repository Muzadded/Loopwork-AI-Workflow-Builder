'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { LoopWorkLogo } from '../icons/LoopWorkLogo';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authMode, closeAuthModal, setAuthMode, login, signup, isLoading, error } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      login(email, password);
    } else {
      signup(name, email, password);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-strong)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
  };

  const insetInputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card-inset)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={closeAuthModal} />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-md p-7 rounded-2xl z-10 transition-all font-sans"
        style={cardStyle}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-inset)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Logo */}
        <div className="flex flex-col items-center mb-6 text-center">
          <LoopWorkLogo size={36} />
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">
            {authMode === 'login'
              ? 'Welcome back! Log in to your workflow workspace.'
              : 'Create an account to start building AI workflows.'}
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex p-1 rounded-xl mb-6" style={{ backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-default)' }}>
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: authMode === 'login' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: authMode === 'login' ? '1px solid var(--border-default)' : '1px solid transparent',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: authMode === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: authMode === 'signup' ? '1px solid var(--border-default)' : '1px solid transparent',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="p-3 mb-4 rounded-xl text-xs font-medium flex items-center gap-2"
            style={{ backgroundColor: 'var(--status-failed-bg)', color: 'var(--status-failed-text)', border: '1px solid var(--status-failed-text)' }}
          >
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.05em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 absolute left-3.5" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muzadded Ahmed"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                  style={insetInputStyle}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.05em] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Work Email
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                style={insetInputStyle}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              {authMode === 'login' && (
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to your email.'); }} className="text-[11px] text-[var(--accent-primary)] hover:underline">
                  Forgot?
                </a>
              )}
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl outline-none focus:border-[var(--accent-primary)] transition-colors"
                style={insetInputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--accent-on-primary)' }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {authMode === 'login' ? 'Sign In to Workspace' : 'Create Enterprise Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 h-[1px]" style={{ backgroundColor: 'var(--border-default)' }} />
          <span className="px-3 text-[10px] uppercase tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>
            OR CONTINUE WITH
          </span>
          <div className="flex-1 h-[1px]" style={{ backgroundColor: 'var(--border-default)' }} />
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => login('google.user@loopwork.ai', 'social123')}
            className="py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all hover:bg-[var(--bg-card-inset)]"
            style={{ border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={() => login('github.user@loopwork.ai', 'social123')}
            className="py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all hover:bg-[var(--bg-card-inset)]"
            style={{ border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </button>
        </div>
      </div>
    </div>
  );
};
