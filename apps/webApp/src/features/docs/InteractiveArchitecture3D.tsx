import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Smartphone,
  Server,
  Database,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  Key,
  CheckCircle,
} from 'lucide-react';

export const InteractiveArchitecture3D: React.FC = () => {
  const [activeNode, setActiveNode] = useState<'frontend' | 'mobile' | 'backend' | 'database'>('frontend');
  const [trafficActive, setTrafficActive] = useState(true);

  const nodeDetails = {
    frontend: {
      title: 'WebApp (Vercel Edge)',
      tag: 'CLIENT TIER',
      role: 'Client-side SPA with AES-256-GCM local encryption engine.',
      specs: ['React 18 + Vite', 'Tailwind CSS Glassmorphism', 'Zero-Knowledge Crypto', 'Vercel CDN Edge'],
      color: 'from-violet-500/20 to-purple-600/20',
      border: 'border-violet-500/40',
      badge: 'securesave.mraks.dev',
    },
    mobile: {
      title: 'Android APK (Capacitor)',
      tag: 'MOBILE TIER',
      role: 'Native Android build with hardware keystore integration & offline cache.',
      specs: ['Capacitor 6 Bridge', 'Native Biometric Auth', 'Local Key Storage', 'GitHub Actions CI Release'],
      color: 'from-cyan-500/20 to-blue-600/20',
      border: 'border-cyan-500/40',
      badge: 'securesave.apk',
    },
    backend: {
      title: 'API Serverless (Vercel)',
      tag: 'LOGIC & SECURITY',
      role: 'Stateless Node.js execution layer with rate limiting and SMTP mailer.',
      specs: ['Node.js + Express', 'Serverless Functions', 'JWT Auth + OTP Engine', 'CORS Origin Firewall'],
      color: 'from-fuchsia-500/20 to-pink-600/20',
      border: 'border-fuchsia-500/40',
      badge: 'secure-save-blue.vercel.app',
    },
    database: {
      title: 'MongoDB Atlas',
      tag: 'STORAGE CLOUD',
      role: 'High-availability encrypted document store configured with IP whitelist.',
      specs: ['TLS Encrypted Transit', 'TTL Auto-cleaning OTPs', 'Zero Plaintext Secret Storage', 'Global Atlas Cluster'],
      color: 'from-emerald-500/20 to-teal-600/20',
      border: 'border-emerald-500/40',
      badge: 'Cluster0.mongodb.net',
    },
  };

  return (
    <div className="w-full select-none">
      {/* 3D Flow Board */}
      <div className="relative p-6 sm:p-10 rounded-3xl glass-surface border-2 border-violet-500/20 shadow-2xl overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        {/* Nodes Grid Layout */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Frontend Node */}
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            onClick={() => setActiveNode('frontend')}
            className={`cursor-pointer p-5 rounded-2xl border transition-all ${
              activeNode === 'frontend'
                ? 'border-violet-400 bg-violet-950/60 shadow-lg shadow-violet-500/20'
                : 'border-white/10 bg-white/[0.03] hover:border-violet-500/30'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3">
              <Globe className="w-5 h-5" />
            </div>
            <p className="text-[10px] uppercase tracking-wider font-mono text-violet-400">Frontend</p>
            <h4 className="text-sm font-bold text-white mt-0.5">Vercel WebApp</h4>
            <p className="text-xs text-vault-muted mt-1">Client AES-256</p>
            <span className="inline-block mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
              HTTPS / TLS
            </span>
          </motion.div>

          {/* Mobile APK Node */}
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            onClick={() => setActiveNode('mobile')}
            className={`cursor-pointer p-5 rounded-2xl border transition-all ${
              activeNode === 'mobile'
                ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-500/20'
                : 'border-white/10 bg-white/[0.03] hover:border-cyan-500/30'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <p className="text-[10px] uppercase tracking-wider font-mono text-cyan-400">Mobile Client</p>
            <h4 className="text-sm font-bold text-white mt-0.5">Android APK</h4>
            <p className="text-xs text-vault-muted mt-1">Capacitor Native</p>
            <span className="inline-block mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              Biometric / KeyStore
            </span>
          </motion.div>

          {/* Backend API Node */}
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            onClick={() => setActiveNode('backend')}
            className={`cursor-pointer p-5 rounded-2xl border transition-all ${
              activeNode === 'backend'
                ? 'border-fuchsia-400 bg-fuchsia-950/60 shadow-lg shadow-fuchsia-500/20'
                : 'border-white/10 bg-white/[0.03] hover:border-fuchsia-500/30'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-3">
              <Server className="w-5 h-5" />
            </div>
            <p className="text-[10px] uppercase tracking-wider font-mono text-fuchsia-400">Backend API</p>
            <h4 className="text-sm font-bold text-white mt-0.5">Vercel Serverless</h4>
            <p className="text-xs text-vault-muted mt-1">Express & JWT</p>
            <span className="inline-block mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300">
              Rate-Limited
            </span>
          </motion.div>

          {/* Database Node */}
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            onClick={() => setActiveNode('database')}
            className={`cursor-pointer p-5 rounded-2xl border transition-all ${
              activeNode === 'database'
                ? 'border-emerald-400 bg-emerald-950/60 shadow-lg shadow-emerald-500/20'
                : 'border-white/10 bg-white/[0.03] hover:border-emerald-500/30'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Database className="w-5 h-5" />
            </div>
            <p className="text-[10px] uppercase tracking-wider font-mono text-emerald-400">Database</p>
            <h4 className="text-sm font-bold text-white mt-0.5">MongoDB Atlas</h4>
            <p className="text-xs text-vault-muted mt-1">Encrypted Cluster</p>
            <span className="inline-block mt-3 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              0.0.0.0/0 IP Whitelist
            </span>
          </motion.div>
        </div>

        {/* Live Traffic Data Flow Connector Animation */}
        <div className="relative mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-vault-muted font-mono mb-3">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Cryptographic Transit Status
            </span>
            <span>REST API / HTTPS / TLS 1.3</span>
          </div>

          <div className="relative h-2 w-full bg-vault-surface rounded-full overflow-hidden border border-white/5">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_12px_#8B5CF6]"
            />
          </div>
        </div>

        {/* Detailed Inspector Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className={`mt-6 p-5 rounded-2xl border ${nodeDetails[activeNode].border} bg-gradient-to-r ${nodeDetails[activeNode].color}`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-vault-accentLight uppercase tracking-wider">
                  {nodeDetails[activeNode].tag}
                </span>
                <h3 className="text-base font-bold text-white">{nodeDetails[activeNode].title}</h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-black/40 text-vault-muted border border-white/10">
                {nodeDetails[activeNode].badge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-vault-muted leading-relaxed mb-4">
              {nodeDetails[activeNode].role}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {nodeDetails[activeNode].specs.map((spec) => (
                <div key={spec} className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-1.5 text-xs text-vault-text">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{spec}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
