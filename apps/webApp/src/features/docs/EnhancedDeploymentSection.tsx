import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Globe,
  Smartphone,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  GitBranch,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const EnhancedDeploymentSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'backend' | 'webapp' | 'mobile'>('backend');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const platforms = {
    backend: {
      title: 'Backend API Deployment',
      target: 'Vercel Serverless Functions',
      domain: 'https://secure-save-blue.vercel.app',
      badge: 'Node.js Express Edge',
      color: 'from-violet-500/20 to-purple-600/20',
      border: 'border-violet-500/40',
      iconColor: 'text-violet-400',
      settings: [
        { label: 'Root Directory', value: 'apps/api' },
        { label: 'Build Command', value: 'npm run build (or tsc)' },
        { label: 'Output Directory', value: 'Overridden by vercel.json' },
        { label: 'Node Version', value: '20.x' },
      ],
      steps: [
        {
          num: '01',
          name: 'Vercel Rewrites Configuration',
          desc: 'apps/api/vercel.json routes all incoming traffic to the serverless function handler.',
          code: `{\n  "version": 2,\n  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]\n}`,
        },
        {
          num: '02',
          name: 'Environment Secrets',
          desc: 'Add MongoDB connection string, JWT secret, and SMTP mailer credentials in Vercel project settings.',
          code: `MONGODB_URI="mongodb+srv://..."\nJWT_SECRET="your_jwt_secret"\nSMTP_HOST="smtp.gmail.com"`,
        },
        {
          num: '03',
          name: 'Zero-Downtime Deployment',
          desc: 'Deploy using Vercel CLI or via automatic GitHub push triggers.',
          code: `cd apps/api\nvercel --prod`,
        },
      ],
    },
    webapp: {
      title: 'Frontend WebApp Deployment',
      target: 'Vercel Edge Network',
      domain: 'https://securesave.mraks.dev',
      badge: 'React 18 + Vite SPA',
      color: 'from-fuchsia-500/20 to-pink-600/20',
      border: 'border-fuchsia-500/40',
      iconColor: 'text-fuchsia-400',
      settings: [
        { label: 'Root Directory', value: 'apps/webApp' },
        { label: 'Framework Preset', value: 'Vite' },
        { label: 'Build Command', value: 'npm run build' },
        { label: 'Output Directory', value: 'dist' },
      ],
      steps: [
        {
          num: '01',
          name: 'Vite & SPA Catch-All Rewrites',
          desc: 'apps/webApp/vercel.json ensures all client routes (/dashboard, /cards, /docs) load index.html without 404s.',
          code: `{\n  "version": 2,\n  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]\n}`,
        },
        {
          num: '02',
          name: 'API Targeting',
          desc: 'Inject production backend API URL in Environment Variables.',
          code: `VITE_API_URL=https://secure-save-blue.vercel.app/api`,
        },
        {
          num: '03',
          name: 'Custom Domain Linking',
          desc: 'Assign securesave.mraks.dev with automatic HTTPS TLS SSL certificates managed by Vercel Edge.',
          code: `cd apps/webApp\nvercel --prod`,
        },
      ],
    },
    mobile: {
      title: 'Android APK Automated CI/CD',
      target: 'GitHub Actions & GitHub Releases',
      domain: 'github.com/.../releases/tag/latest',
      badge: 'Continuous Delivery',
      color: 'from-cyan-500/20 to-blue-600/20',
      border: 'border-cyan-500/40',
      iconColor: 'text-cyan-400',
      settings: [
        { label: 'Workflow File', value: '.github/workflows/build-apk.yml' },
        { label: 'Runner OS', value: 'ubuntu-latest' },
        { label: 'JDK Version', value: 'Temurin Java 17' },
        { label: 'Release Tag', value: 'latest (Auto-published)' },
      ],
      steps: [
        {
          num: '01',
          name: 'Capacitor Android Sync',
          desc: 'Web bundles compiled and copied to native Android project assets with plugins updated.',
          code: `cd apps/mobile\nnpm run build\nnpx cap sync android`,
        },
        {
          num: '02',
          name: 'Native Gradle Assemble',
          desc: 'GitHub runner compiles the Android APK in headless environment with caching enabled.',
          code: `cd apps/mobile/android\n./gradlew assembleDebug --stacktrace`,
        },
        {
          num: '03',
          name: 'Rolling GitHub Release Publish',
          desc: 'softprops/action-gh-release attaches securesave.apk to the latest GitHub release on every push to main.',
          code: `git push origin main # Triggers build-apk.yml and updates securesave.apk download`,
        },
      ],
    },
  };

  const current = platforms[activeTab];

  return (
    <div className="w-full space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setActiveTab('backend')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
            activeTab === 'backend'
              ? 'bg-violet-600/30 border border-violet-400/60 text-white shadow-lg shadow-violet-950/40'
              : 'bg-white/[0.03] border border-white/5 text-vault-muted hover:text-white'
          }`}
        >
          <Server className="w-4 h-4 text-violet-400" />
          <span>Backend API (Vercel)</span>
        </button>

        <button
          onClick={() => setActiveTab('webapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
            activeTab === 'webapp'
              ? 'bg-fuchsia-600/30 border border-fuchsia-400/60 text-white shadow-lg shadow-fuchsia-950/40'
              : 'bg-white/[0.03] border border-white/5 text-vault-muted hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-fuchsia-400" />
          <span>Frontend WebApp (Vercel)</span>
        </button>

        <button
          onClick={() => setActiveTab('mobile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
            activeTab === 'mobile'
              ? 'bg-cyan-600/30 border border-cyan-400/60 text-white shadow-lg shadow-cyan-950/40'
              : 'bg-white/[0.03] border border-white/5 text-vault-muted hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span>Android APK (GitHub CI/CD)</span>
        </button>
      </div>

      {/* Main Deployment Platform Detail */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`glass-surface p-6 sm:p-8 rounded-3xl border ${current.border} shadow-2xl relative overflow-hidden`}
      >
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-vault-accentLight">
              {current.badge}
            </span>
            <h3 className="text-xl font-bold text-white mt-0.5">{current.title}</h3>
            <p className="text-xs text-vault-muted mt-1">{current.target}</p>
          </div>
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-black/40 text-emerald-300 border border-white/10 flex items-center gap-2 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {current.domain}
          </span>
        </div>

        {/* Essential Build Parameters Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {current.settings.map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-black/40 border border-white/5">
              <p className="text-[10px] font-mono text-vault-muted uppercase">{s.label}</p>
              <p className="text-xs font-bold text-white font-mono mt-0.5 truncate">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Step-by-Step Interactive Pipeline Cards */}
        <div className="space-y-4 mt-6">
          {current.steps.map((st, i) => (
            <div
              key={st.num}
              className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-violet-400">{st.num}.</span>
                  <h4 className="text-sm font-bold text-white">{st.name}</h4>
                </div>
                <p className="text-xs text-vault-muted mt-1 leading-relaxed">{st.desc}</p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <pre className="p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto flex-1 md:flex-initial max-w-sm">
                  {st.code}
                </pre>
                <button
                  onClick={() => copyCode(st.code, `${activeTab}-${i}`)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-vault-muted hover:text-white transition-colors shrink-0"
                  title="Copy command"
                >
                  {copiedIndex === `${activeTab}-${i}` ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
