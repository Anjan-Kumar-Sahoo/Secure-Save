import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  KeyRound,
  Landmark,
  FolderLock,
  LogOut,
  Shield,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  Check,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { InstallAppButton } from '../../components/InstallAppButton';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Real backend queries for actual vault counts
  const { data: cards = [], isLoading: isLoadingCards, refetch: refetchCards } = useQuery({
    queryKey: ['vault-cards'],
    queryFn: async () => {
      const res = await api.get('/cards');
      return res.data?.data?.cards || [];
    },
  });

  const { data: passwords = [], isLoading: isLoadingPasswords, refetch: refetchPasswords } = useQuery({
    queryKey: ['vault-passwords'],
    queryFn: async () => {
      const res = await api.get('/passwords');
      return res.data?.data?.passwords || [];
    },
  });

  const { data: banks = [], isLoading: isLoadingBanks, refetch: refetchBanks } = useQuery({
    queryKey: ['vault-banks'],
    queryFn: async () => {
      const res = await api.get('/banks');
      return res.data?.data?.banks || [];
    },
  });

  const { data: collections = [], isLoading: isLoadingCollections, refetch: refetchCollections } = useQuery({
    queryKey: ['vault-collections'],
    queryFn: async () => {
      const res = await api.get('/collections');
      return res.data?.data?.collections || [];
    },
  });

  const isRefreshing = manualRefreshing || isLoadingCards || isLoadingPasswords || isLoadingBanks || isLoadingCollections;

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setManualRefreshing(true);
    setJustRefreshed(false);
    const startTime = Date.now();
    try {
      await Promise.all([
        refetchCards(),
        refetchPasswords(),
        refetchBanks(),
        refetchCollections(),
      ]);
    } finally {
      // Ensure the rotation animation is visible for at least 650ms
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 650 - elapsed);
      setTimeout(() => {
        setManualRefreshing(false);
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 2000);
      }, remaining);
    }
  };

  const totalVaultItems = cards.length + passwords.length + banks.length + collections.length;

  const modules = [
    {
      id: 'cards',
      title: 'Cards',
      description: 'Credit, debit, and identity cards',
      count: cards.length,
      isLoading: isLoadingCards,
      unit: cards.length === 1 ? 'card' : 'cards',
      icon: CreditCard,
      path: '/cards',
      color: 'from-violet-600/20 to-purple-800/20',
      iconColor: 'text-violet-400',
      borderColor: 'border-violet-500/20',
      actionLabel: 'Manage Cards',
    },
    {
      id: 'passwords',
      title: 'Passwords',
      description: 'Logins, credentials & secure notes',
      count: passwords.length,
      isLoading: isLoadingPasswords,
      unit: passwords.length === 1 ? 'credential' : 'credentials',
      icon: KeyRound,
      path: '/passwords',
      color: 'from-fuchsia-600/20 to-pink-800/20',
      iconColor: 'text-fuchsia-400',
      borderColor: 'border-fuchsia-500/20',
      actionLabel: 'Manage Passwords',
    },
    {
      id: 'banks',
      title: 'Bank Details',
      description: 'Account numbers, IFSC & linked cards',
      count: banks.length,
      isLoading: isLoadingBanks,
      unit: banks.length === 1 ? 'account' : 'accounts',
      icon: Landmark,
      path: '/banks',
      color: 'from-blue-600/20 to-indigo-800/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
      actionLabel: 'Manage Banks',
    },
    {
      id: 'collections',
      title: 'My Collections',
      description: 'Encrypted notes, media & personal files',
      count: collections.length,
      isLoading: isLoadingCollections,
      unit: collections.length === 1 ? 'collection' : 'collections',
      icon: FolderLock,
      path: '/collections',
      color: 'from-emerald-600/20 to-teal-800/20',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      actionLabel: 'Explore Spaces',
    },
  ];

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-30 w-full border-b border-vault-borderSubtle bg-vault-bg/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-[clamp(1rem,3vw,2rem)] h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-purple-800/30 border border-violet-500/25 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/logo.png"
                alt="Secure Save"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <p className="eyebrow leading-none truncate max-w-[140px] sm:max-w-[240px]">
                {user?.email || 'Vault Active'}
              </p>
              <h1 className="font-display font-bold text-base tracking-tight text-vault-text">
                Secure Save
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <InstallAppButton variant="nav" />

            <div className="h-4 w-[1px] bg-vault-borderSubtle mx-0.5" />

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh vault data"
              className={`flex items-center gap-1.5 p-2 px-2.5 rounded-xl transition-all ${
                justRefreshed
                  ? 'text-vault-success bg-vault-success/15 border border-vault-success/30'
                  : 'text-vault-muted hover:text-vault-text hover:bg-vault-surface/60'
              }`}
              title="Refresh vault"
            >
              {justRefreshed ? (
                <>
                  <Check className="w-4 h-4 text-vault-success animate-in zoom-in-50 duration-200" />
                  <span className="text-[11px] font-semibold text-vault-success hidden sm:inline">Updated</span>
                </>
              ) : (
                <RefreshCw
                  className={`w-4 h-4 transition-transform ${
                    isRefreshing ? 'animate-spin text-vault-accentLight' : ''
                  }`}
                />
              )}
            </button>

            <div className="h-4 w-[1px] bg-vault-borderSubtle mx-1" />

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-vault-borderSubtle bg-vault-surface/40 hover:bg-vault-surface text-vault-muted hover:text-vault-text text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Vault</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Page Container */}
      <main className="page-container flex-1">
        {/* Section Heading */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <div>
            <p className="eyebrow">Vault Modules</p>
            <h3 className="title-section text-vault-text">Core Categories</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-vault-surface/60 text-vault-muted border border-vault-borderSubtle">
              {totalVaultItems} {totalVaultItems === 1 ? 'total item' : 'total items'}
            </span>
          </div>
        </div>

        {/* 4-Module Fluid Grid (Section 12.2) */}
        <div className="content-grid">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => navigate(m.path)}
                className={`glass-card p-[clamp(1.25rem,2.5vw,1.75rem)] cursor-pointer group flex flex-col justify-between border ${m.borderColor} hover:border-vault-accentLight/40 transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center border border-white/5`}>
                      <Icon className={`w-6 h-6 ${m.iconColor}`} />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-vault-muted border border-vault-borderSubtle">
                      {m.isLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin inline" />
                      ) : (
                        `${m.count} ${m.unit}`
                      )}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-lg text-vault-text group-hover:text-vault-accentLight transition-colors">
                    {m.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-vault-muted mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-vault-borderSubtle flex items-center justify-between text-xs font-semibold text-vault-accentLight">
                  <span>{m.actionLabel}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Add & Privacy Note */}
        <section className="mt-8 p-5 rounded-2xl border border-vault-borderSubtle bg-vault-surface/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vault-accentMuted flex items-center justify-center text-vault-accentLight shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-vault-text">Add New Vault Item</p>
              <p className="text-xs text-vault-muted">Store credit cards, bank accounts, passwords or custom collections.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate('/cards')}
              className="btn-secondary text-xs flex-1 sm:flex-initial py-2"
            >
              + Card
            </button>
            <button
              onClick={() => navigate('/passwords')}
              className="btn-secondary text-xs flex-1 sm:flex-initial py-2"
            >
              + Password
            </button>
            <button
              onClick={() => navigate('/collections')}
              className="btn-primary text-xs flex-1 sm:flex-initial py-2"
            >
              + Collection
            </button>
          </div>
        </section>

        {/* Mobile App Promotion Banner */}
        <section className="mt-6">
          <InstallAppButton variant="banner" />
        </section>
      </main>

      {/* Footer matching Section 12.4 with End-to-End Encryption note */}
      <footer className="w-full border-t border-vault-borderSubtle py-6 px-4 mb-16 text-center text-xs text-vault-muted space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-vault-muted/90">
          <Shield className="w-3.5 h-3.5 text-vault-success" />
          <span>Zero-Knowledge AES-256-GCM client-side encryption. Only your PIN decrypts your data.</span>
        </div>
        <p>© 2026 Secure Save. All rights reserved. Made with ♥ by AK</p>
      </footer>
    </div>
  );
};
