import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  MailCheck,
  KeyRound,
  ShieldCheck,
  Lock,
  Unlock,
  CreditCard,
  CloudUpload,
  ArrowRight,
  Database,
  Smartphone,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export const InteractiveAppFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const flows = [
    {
      step: '01',
      title: 'Email & OTP Verification',
      badge: 'Zero-Password Auth',
      icon: MailCheck,
      color: 'from-blue-500/20 to-indigo-600/20',
      border: 'border-blue-500/40',
      iconColor: 'text-blue-400',
      summary: 'Users enter their email. The serverless API triggers an instant 6-digit OTP via Nodemailer.',
      visualDetails: [
        'User enters email on login/register',
        'Backend generates 6-digit cryptographic challenge',
        'Nodemailer sends branded HTML email template',
        'MongoDB saves OTP with 5-min TTL auto-expire index',
      ],
      stateText: 'State: Unverified -> OTP Verified',
    },
    {
      step: '02',
      title: 'Local Vault PIN & Key Derivation',
      badge: 'Client-Side PBKDF2',
      icon: KeyRound,
      color: 'from-violet-500/20 to-purple-600/20',
      border: 'border-violet-500/40',
      iconColor: 'text-violet-400',
      summary: 'User creates a 6-digit PIN. The browser/device derives a 256-bit vault master key locally using PBKDF2.',
      visualDetails: [
        '6-digit PIN never stored in plain text anywhere',
        'PBKDF2 derives local AES-256 vault encryption key',
        'PIN hash sent to server solely for session authorization',
        'Client stores active key in ephemeral memory only',
      ],
      stateText: 'State: Vault Key Derived in RAM',
    },
    {
      step: '03',
      title: 'Client-Side Encryption (AES-256-GCM)',
      badge: 'Zero-Knowledge',
      icon: Lock,
      color: 'from-fuchsia-500/20 to-pink-600/20',
      border: 'border-fuchsia-500/40',
      iconColor: 'text-fuchsia-400',
      summary: 'Before any card, password, or bank note leaves your phone or browser, it is encrypted with unique 96-bit IVs.',
      visualDetails: [
        'Payload converted to JSON string',
        'Random 12-byte initialization vector (IV) generated',
        'AES-256-GCM produces ciphertext + 128-bit authentication tag',
        'Zero plaintext leaves the client application',
      ],
      stateText: 'State: Plaintext -> Ciphertext + IV + Tag',
    },
    {
      step: '04',
      title: 'Transport & Blind Storage',
      badge: 'Vercel API & Atlas',
      icon: CloudUpload,
      color: 'from-emerald-500/20 to-teal-600/20',
      border: 'border-emerald-500/40',
      iconColor: 'text-emerald-400',
      summary: 'The REST API validates the JWT session and writes the blind ciphertext to MongoDB Atlas.',
      visualDetails: [
        'Payload transmitted over TLS 1.3 / HTTPS',
        'Vercel API verifies bearer token and rate-limit tokens',
        'Mongoose saves ciphertext block in Atlas Cluster',
        'Database admins & servers cannot inspect the data',
      ],
      stateText: 'State: Persisted in MongoDB Atlas',
    },
    {
      step: '05',
      title: 'Session Unlock & Instant Decryption',
      badge: 'On-Demand Read',
      icon: Unlock,
      color: 'from-cyan-500/20 to-teal-600/20',
      border: 'border-cyan-500/40',
      iconColor: 'text-cyan-400',
      summary: 'Upon logging in with your PIN, ciphertext is fetched, authenticated with the GCM tag, and rendered in the UI.',
      visualDetails: [
        'User unlocks session with 6-digit PIN',
        'TanStack Query fetches encrypted collection documents',
        'Client-side GCM verifies tag integrity',
        'Cards, bank details, and passwords render instantly',
      ],
      stateText: 'State: Vault Unlocked & Synchronized',
    },
  ];

  const current = flows[activeStep];
  const CurrentIcon = current.icon;

  return (
    <div className="w-full space-y-6">
      {/* Step Indicators Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {flows.map((f, idx) => {
          const Icon = f.icon;
          const isActive = activeStep === idx;
          return (
            <button
              key={f.step}
              onClick={() => setActiveStep(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-violet-950/70 border-violet-400/80 shadow-lg shadow-violet-900/30'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/20 text-vault-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-violet-300' : 'text-vault-muted'}`}>
                  STEP {f.step}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? f.iconColor : 'text-vault-muted'}`} />
              </div>
              <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-vault-muted'}`}>
                {f.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Interactive Step Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className={`glass-surface p-6 sm:p-8 rounded-3xl border ${current.border} bg-gradient-to-r ${current.color} shadow-2xl relative overflow-hidden`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                <CurrentIcon className={`w-6 h-6 ${current.iconColor}`} />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-vault-accentLight">
                  {current.badge} • Step {current.step} of 05
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{current.title}</h3>
              </div>
            </div>

            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-black/50 text-emerald-300 border border-emerald-500/20 self-start md:self-auto">
              {current.stateText}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-vault-muted mt-4 leading-relaxed max-w-2xl">
            {current.summary}
          </p>

          {/* Visual Execution Pipeline Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {current.visualDetails.map((detail, i) => (
              <div key={detail} className="p-3.5 rounded-xl bg-black/35 border border-white/5 flex items-start gap-2.5 text-xs text-vault-text">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{detail}</span>
              </div>
            ))}
          </div>

          {/* Step Progression Buttons */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : flows.length - 1))}
              className="text-xs font-semibold text-vault-muted hover:text-white transition-colors"
            >
              ← Previous Step
            </button>
            <button
              onClick={() => setActiveStep((prev) => (prev < flows.length - 1 ? prev + 1 : 0))}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <span>Next Phase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
