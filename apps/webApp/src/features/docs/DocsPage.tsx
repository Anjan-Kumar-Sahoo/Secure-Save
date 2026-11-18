import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Cpu,
  Layers,
  Database,
  Server,
  ShieldCheck,
  ArrowRight,
  GitBranch,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { InteractiveArchitecture3D } from './InteractiveArchitecture3D';
import { InteractiveSchemaViewer } from './InteractiveSchemaViewer';
import { InteractiveAppFlow } from './InteractiveAppFlow';
import { EnhancedDeploymentSection } from './EnhancedDeploymentSection';
import { Hero3DCanvas } from '../landing/Hero3DCanvas';
import { InstallAppButton } from '../../components/InstallAppButton';

export const DocsPage: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text relative overflow-x-hidden selection:bg-purple-600/30 selection:text-white">
      {/* Dynamic 3D Particle Canvas */}
      <Hero3DCanvas mousePos={{ x: 0, y: 0 }} />

      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-vault-borderSubtle bg-vault-bg/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-violet-600/40 to-purple-800/40 border border-violet-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-violet-950/40 group-hover:scale-105 transition-transform">
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

        {/* Section 3: Technology Ecosystem Visual Grid */}
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

        {/* Section 4: Interactive Application Lifecycle Flow */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Execution Pipeline</p>
              <h3 className="title-hero text-white text-2xl sm:text-3xl">Application Lifecycle Flow</h3>
            </div>
            <span className="text-xs font-mono text-vault-accentLight bg-violet-950/40 px-3 py-1 rounded-full border border-violet-500/30">
              5-Step Zero-Knowledge Chain
            </span>
          </div>

          <InteractiveAppFlow />
        </section>

        {/* Section 5: Database Schema Visualizer */}
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

        {/* Section 6: Enhanced Deployment Center */}
        <section className="space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Release Engineering</p>
              <h3 className="title-hero text-white text-2xl sm:text-3xl">Production Deployment Hub</h3>
            </div>
            <p className="text-xs text-vault-muted font-mono">
              Switch platforms to review presets & live pipelines
            </p>
          </div>

          <EnhancedDeploymentSection />
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
