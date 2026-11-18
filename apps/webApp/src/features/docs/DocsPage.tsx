import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Cpu,
  Layers,
  Database,
  Server,
  Terminal,
  ShieldCheck,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Smartphone,
  ArrowRight,
  Flame,
  Zap,
} from 'lucide-react';
import { InteractiveArchitecture3D } from './InteractiveArchitecture3D';
import { InteractiveSchemaViewer } from './InteractiveSchemaViewer';
import { Hero3DCanvas } from '../landing/Hero3DCanvas';
import { InstallAppButton } from '../../components/InstallAppButton';

export const DocsPage: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const techStack = [
    {
      category: 'Frontend & Web Client',
      badge: 'Client Engine',
      items: [
        { name: 'React 18', role: 'Component hierarchy & dynamic state' },
        { name: 'TypeScript', role: 'End-to-end type safety' },
        { name: 'Tailwind CSS', role: 'Fluid styling & glassmorphism' },
        { name: 'Framer Motion', role: 'Hardware-accelerated 3D springs' },
        { name: 'Vite', role: 'High-speed build & tree shaking' },
      ],
      border: 'border-violet-500/30',
      iconColor: 'text-violet-400',
    },
    {
      category: 'Mobile APK & Bridge',
      badge: 'Native Android',
      items: [
        { name: 'Capacitor 6', role: 'Web-to-native Android runtime bridge' },
        { name: 'Android Keystore', role: 'Hardware-backed secret isolation' },
        { name: 'Gradle 8', role: 'Native release build pipelines' },
        { name: 'GitHub Releases', role: 'Continuous auto-updating APK distribution' },
      ],
      border: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
    },
    {
      category: 'Backend & Serverless API',
      badge: 'Edge Cloud',
      items: [
        { name: 'Node.js & Express', role: 'Stateless REST endpoints' },
        { name: 'Vercel Serverless', role: 'On-demand edge scaling' },
        { name: 'Nodemailer SMTP', role: 'Brand-styled OTP email delivery' },
        { name: 'JWT & Rate Limit', role: 'Session tokens & brute-force defense' },
      ],
      border: 'border-fuchsia-500/30',
      iconColor: 'text-fuchsia-400',
    },
    {
      category: 'Database & Cryptography',
      badge: 'Storage & Zero-Knowledge',
      items: [
        { name: 'MongoDB Atlas', role: 'Encrypted document storage' },
        { name: 'AES-256-GCM', role: 'Authenticated cipher payloads' },
        { name: 'PBKDF2 / SHA-256', role: 'Cryptographic key derivation' },
        { name: 'bcrypt', role: 'Salted credential hashing' },
      ],
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
  ];

  const envConfigs = [
    { key: 'VITE_API_URL', val: 'https://secure-save-blue.vercel.app/api', desc: 'Backend REST API endpoint for WebApp & Mobile' },
    { key: 'MONGODB_URI', val: 'mongodb+srv://<user>:<pwd>@cluster0.mongodb.net/securesave', desc: 'Atlas connection string with 0.0.0.0/0 whitelist' },
    { key: 'JWT_SECRET', val: 'your_super_secret_jwt_random_key_64_chars', desc: 'HMAC signature secret for session tokens' },
    { key: 'SMTP_HOST / USER / PASSWORD', val: 'smtp.gmail.com / user / app_pass', desc: 'Nodemailer SMTP configuration for 6-digit OTP emails' },
    { key: 'CORS_ORIGIN', val: 'https://securesave.mraks.dev,http://localhost:5173', desc: 'Allowed origin whitelist for API cross-origin requests' },
  ];

  const deploymentSteps = [
    {
      title: '1. Backend Deployment (Vercel)',
      badge: 'API Engine',
      code: `cd apps/api\nvercel --prod`,
      notes: 'Root Directory: apps/api. Set vercel.json rewrite to route /* to /api serverless function.',
    },
    {
      title: '2. Frontend WebApp (Vercel)',
      badge: 'WebApp SPA',
      code: `cd apps/webApp\nvercel --prod`,
      notes: 'Root Directory: apps/webApp. Framework: Vite. Set VITE_API_URL in Environment Variables.',
    },
    {
      title: '3. Android APK CI/CD (GitHub Actions)',
      badge: 'Automated Releases',
      code: `git push origin main`,
      notes: 'build-apk.yml builds release APK and attaches securesave.apk to github.com/.../releases/tag/latest.',
    },
  ];

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text relative overflow-x-hidden selection:bg-purple-600/30 selection:text-white">
      {/* Dynamic 3D Particle Canvas */}
      <Hero3DCanvas mousePos={{ x: 0, y: 0 }} />

      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-vault-borderSubtle bg-vault-bg/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/40 to-purple-800/40 border border-violet-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-violet-950/40 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Secure Save Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="eyebrow leading-none">Architecture & Manual</p>
              <h1 className="font-display font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-vault-accentLight transition-colors">
                Secure Save Docs
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <InstallAppButton variant="nav" />
            <Link
              to="/login"
              className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4"
            >
              <span>Access Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10 space-y-20">
        {/* Section 1: System Summary */}
        <section className="text-center max-w-3xl mx-auto pt-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-vault-accentLight text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Technical Documentation</span>
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Zero-Knowledge Architecture & Specifications
          </h2>
          <p className="mt-4 text-sm sm:text-base text-vault-muted leading-relaxed">
            Secure Save separates cryptographic trust from data storage. All user secrets are encrypted client-side with AES-256-GCM before transport. The server only ever persists blind ciphertext.
          </p>
        </section>

        {/* Section 2: Interactive 3D Architecture Diagram */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Visual Data Flow</p>
              <h3 className="title-hero text-white text-2xl sm:text-3xl">Interactive System Architecture</h3>
            </div>
            <p className="text-xs text-vault-muted font-mono">
              Click any tier below to inspect its specifications
            </p>
          </div>
          <InteractiveArchitecture3D />
        </section>

        {/* Section 3: Tech Stack Visual Grid */}
        <section className="space-y-6">
          <div>
            <p className="eyebrow">Foundation</p>
            <h3 className="title-hero text-white text-2xl sm:text-3xl">Technology Ecosystem</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tier) => (
              <div
                key={tier.category}
                className={`glass-surface p-6 rounded-3xl border ${tier.border} flex flex-col justify-between`}
              >
                <div>
                  <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${tier.iconColor}`}>
                    {tier.badge}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1 mb-4">{tier.category}</h4>

                  <div className="space-y-2.5">
                    {tier.items.map((item) => (
                      <div key={item.name} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs font-bold text-vault-accentLight font-mono">{item.name}</p>
                        <p className="text-[11px] text-vault-muted mt-0.5 leading-snug">{item.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Database Schema Visualizer */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Data Models</p>
              <h3 className="title-hero text-white text-2xl sm:text-3xl">MongoDB Schema Visualizer</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
              Atlas Encrypted Cluster
            </span>
          </div>

          <InteractiveSchemaViewer />
        </section>

        {/* Section 5: Configuration Guide */}
        <section className="space-y-6">
          <div>
            <p className="eyebrow">Environment Setup</p>
            <h3 className="title-hero text-white text-2xl sm:text-3xl">Configuration Guide</h3>
          </div>

          <div className="glass-surface p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
            <p className="text-xs sm:text-sm text-vault-muted">
              Production environment variables configured across Vercel API and WebApp:
            </p>

            <div className="space-y-3 font-mono text-xs">
              {envConfigs.map((cfg) => (
                <div
                  key={cfg.key}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-vault-accentLight font-bold">{cfg.key}</span>
                    <p className="text-[11px] font-sans text-vault-muted mt-0.5">{cfg.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <code className="text-[11px] bg-white/5 px-2.5 py-1 rounded-lg text-emerald-300 truncate max-w-xs">
                      {cfg.val}
                    </code>
                    <button
                      onClick={() => copyToClipboard(cfg.val, cfg.key)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-vault-muted hover:text-white transition-colors"
                      title="Copy value"
                    >
                      {copiedKey === cfg.key ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Deployment Pipelines */}
        <section className="space-y-6 pb-12">
          <div>
            <p className="eyebrow">Release Engineering</p>
            <h3 className="title-hero text-white text-2xl sm:text-3xl">Continuous Deployment Pipeline</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deploymentSteps.map((step) => (
              <div key={step.title} className="glass-surface p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {step.badge}
                  </span>
                  <h4 className="text-base font-bold text-white mt-2 mb-2">{step.title}</h4>
                  <pre className="p-3 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-vault-accentLight overflow-x-auto">
                    {step.code}
                  </pre>
                  <p className="text-xs text-vault-muted mt-3 leading-relaxed">
                    {step.notes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4 text-center text-xs text-vault-muted relative z-10 bg-vault-bg/95">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-vault-success" />
            <span>Secure Save System Specification & Developer Guide</span>
          </div>
          <p>© 2026 Secure Save. All rights reserved. Made with ♥ by AK</p>
        </div>
      </footer>
    </div>
  );
};
