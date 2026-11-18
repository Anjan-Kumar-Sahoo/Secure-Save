import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  KeyRound,
  CreditCard,
  Landmark,
  FolderLock,
  ArrowRight,
  Download,
  CheckCircle,
  Eye,
  Smartphone,
  Zap,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Hero3DCanvas } from './Hero3DCanvas';
import { InteractiveVault3D } from './InteractiveVault3D';
import { InstallAppButton } from '../../components/InstallAppButton';
import { useAuthStore } from '../../store/authStore';

export const LandingPage: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const token = useAuthStore((state) => state.token);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

  const features = [
    {
      icon: Shield,
      title: 'Zero-Knowledge Security',
      description: 'Your secrets are encrypted client-side using AES-256-GCM before ever leaving your device. Even we cannot read your data.',
      color: 'from-violet-500/20 to-purple-800/20',
      iconColor: 'text-violet-400',
    },
    {
      icon: CreditCard,
      title: 'Payment Cards Vault',
      description: 'Store debit, credit, and identity cards with full CVV protection, quick clipboard copy, and visual card layouts.',
      color: 'from-blue-500/20 to-indigo-800/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: KeyRound,
      title: 'Password Management',
      description: 'Protect all your sensitive logins, OTP backup codes, credentials, and custom private notes in one guarded location.',
      color: 'from-fuchsia-500/20 to-pink-800/20',
      iconColor: 'text-fuchsia-400',
    },
    {
      icon: Landmark,
      title: 'Bank Accounts & IFSC',
      description: 'Keep branch details, account numbers, routing codes, and swift identifiers readily available yet fully secured.',
      color: 'from-cyan-500/20 to-teal-800/20',
      iconColor: 'text-cyan-400',
    },
    {
      icon: FolderLock,
      title: 'Custom Collections',
      description: 'Create encrypted folders for confidential files, private notes, and sensitive records with custom categorization.',
      color: 'from-emerald-500/20 to-green-800/20',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Smartphone,
      title: 'Sync with Native Android App',
      description: 'Access your vault anywhere seamlessly on web or through the high-performance native Android application.',
      color: 'from-amber-500/20 to-orange-800/20',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div
      className="min-h-screen bg-vault-bg text-vault-text relative overflow-x-hidden selection:bg-purple-600/30 selection:text-white"
      onMouseMove={handleMouseMove}
    >
      {/* Background 3D Particle and Cosmic Light System */}
      <Hero3DCanvas mousePos={mousePos} />

      {/* Floating Ambient Background Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-fuchsia-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      {/* Top Floating Glass Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-vault-borderSubtle bg-vault-bg/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-violet-600/40 to-purple-800/40 border border-violet-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-violet-950/40 transition-transform group-hover:scale-105">
              <img
                src="/logo.png"
                alt="Secure Save Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
              />
            </div>
            <div>
              <p className="eyebrow leading-none">Personal Vault</p>
              <h1 className="font-display font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-vault-accentLight transition-colors">
                Secure Save
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/docs"
              className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-violet-500/30 bg-white/[0.03] hover:bg-white/[0.08] text-vault-text text-xs sm:text-sm font-semibold transition-colors"
            >
              Docs
            </Link>
            <InstallAppButton variant="nav" />
            <div className="h-4 w-[1px] bg-vault-borderSubtle mx-1 hidden sm:block" />
            {token ? (
              <Link
                to="/dashboard"
                className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-lg shadow-violet-900/30"
              >
                <span>Open Vault</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl border border-vault-borderSubtle bg-vault-surface/40 hover:bg-vault-surface text-vault-text text-xs sm:text-sm font-semibold transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3.5 sm:px-4"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Interactive 3D Card Safe */}
      <section className="relative pt-10 sm:pt-16 pb-16 sm:pb-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-vault-accentLight text-xs font-semibold mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Next-Gen Client-Side Encrypted Vault</span>
              </div>

              <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.12]">
                Your secrets belong to{' '}
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-300 bg-clip-text text-transparent">
                  you alone.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-vault-muted max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Secure Save locks cards, passwords, bank accounts, and private notes with zero-knowledge AES-256-GCM encryption. Never compromised, always accessible.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/register"
                  className="btn-primary w-full sm:w-auto text-sm sm:text-base py-3 px-6 shadow-xl shadow-violet-600/30 group"
                >
                  <span>Create Your Vault Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <InstallAppButton variant="hero" className="w-full sm:w-auto" />
              </div>

              {/* Trust Badges */}
              <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-vault-muted font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Zero-Knowledge Architecture</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>AES-256-GCM Cryptography</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Cross-Platform Sync</span>
                </div>
              </div>
            </motion.div>

            {/* Right Interactive 3D Model */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 flex items-center justify-center"
            >
              <InteractiveVault3D />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative py-20 border-t border-white/5 bg-vault-secondary/30 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="eyebrow">Enterprise-Grade Protection</p>
            <h2 className="title-hero text-white text-2xl sm:text-4xl mt-2">
              Engineered for Complete Privacy
            </h2>
            <p className="text-vault-muted text-sm sm:text-base mt-3 leading-relaxed">
              Every piece of your sensitive data is sealed with unique cryptographic vectors that only your PIN can unlock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="glass-card p-6 sm:p-7 flex flex-col justify-between group"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 border border-white/10 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-vault-accentLight transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-vault-muted mt-2 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile App Promotion CTA Banner */}
      <section className="relative py-20 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="glass-surface p-8 sm:p-12 relative overflow-hidden border-2 border-violet-500/25">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 mb-3 border border-violet-500/30">
                  <Smartphone className="w-3.5 h-3.5" /> Android App Available
                </span>
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
                  Take Your Vault Everywhere
                </h3>
                <p className="text-xs sm:text-sm text-vault-muted mt-2 leading-relaxed">
                  Install the native Android application built with biometric authentication, instant offline caching, and native notifications.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <InstallAppButton variant="banner" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4 text-center text-xs text-vault-muted z-10 relative bg-vault-bg/90">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-vault-success" />
            <span>Zero-Knowledge AES-256-GCM Cryptographic Architecture</span>
          </div>
          <p>© 2026 Secure Save. All rights reserved. Made with ♥ by AK</p>
        </div>
      </footer>
    </div>
  );
};
