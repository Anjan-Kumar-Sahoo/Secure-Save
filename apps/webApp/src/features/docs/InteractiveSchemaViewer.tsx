import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Users,
  ShieldAlert,
  Key,
  CreditCard,
  Building,
  Lock,
  Folder,
  FileText,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const InteractiveSchemaViewer: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState<'users' | 'otp_challenges' | 'cards' | 'passwords' | 'banks' | 'collections'>('users');

  const collections = [
    {
      id: 'users',
      name: 'users',
      icon: Users,
      color: 'text-violet-400',
      badge: 'Auth & Recovery',
      count: '9 Fields',
      summary: 'Stores user accounts, verification flags, and bcrypt-hashed recovery pin vectors.',
      fields: [
        { name: '_id', type: 'ObjectId', desc: 'Unique MongoDB identifier', key: 'PK' },
        { name: 'email', type: 'String', desc: 'Case-normalized user email', key: 'INDEX' },
        { name: 'emailVerified', type: 'Boolean', desc: 'True once verified via OTP', key: '' },
        { name: 'status', type: 'String', desc: "'active' | 'pending' | 'locked'", key: '' },
        { name: 'encryptionKeyVersion', type: 'Number', desc: 'Key iteration counter (default: 1)', key: '' },
        { name: 'recoveryConfiguration', type: 'Object', desc: 'Encrypted recovery metadata & hash', key: 'HASH' },
        { name: 'createdAt', type: 'Date', desc: 'Timestamp of registration', key: '' },
      ],
    },
    {
      id: 'otp_challenges',
      name: 'otp_challenges',
      icon: ShieldAlert,
      color: 'text-amber-400',
      badge: 'Auto-TTL Cleanup',
      count: '8 Fields',
      summary: '6-digit time-based verification tokens auto-deleted by MongoDB TTL after expiry.',
      fields: [
        { name: '_id', type: 'ObjectId', desc: 'Unique token ID', key: 'PK' },
        { name: 'email', type: 'String', desc: 'Target user email address', key: 'INDEX' },
        { name: 'purpose', type: 'String', desc: "'registration' | 'pin-reset'", key: '' },
        { name: 'otpHash', type: 'String', desc: 'bcrypt hash of the 6-digit OTP', key: 'SECURE' },
        { name: 'expiresAt', type: 'Date', desc: 'Expires in 5 mins (TTL auto index)', key: 'TTL' },
        { name: 'attempts', type: 'Number', desc: 'Failed count (max 5 attempts)', key: '' },
      ],
    },
    {
      id: 'cards',
      name: 'cards',
      icon: CreditCard,
      color: 'text-blue-400',
      badge: 'AES-256-GCM',
      count: '7 Fields',
      summary: 'Encrypted payment card details (CVV, PAN, cardholder, expiry) client-side sealed.',
      fields: [
        { name: '_id', type: 'ObjectId', desc: 'Record ID', key: 'PK' },
        { name: 'userId', type: 'ObjectId', desc: 'Reference to owning user', key: 'FK' },
        { name: 'title', type: 'String', desc: 'Unencrypted visual label (e.g. Visa Sapphire)', key: '' },
        { name: 'encryptedPayload', type: 'String', desc: 'Ciphertext + IV + Auth Tag (AES-GCM)', key: 'ENCRYPTED' },
        { name: 'encryptionVersion', type: 'String', desc: 'Schema iteration identifier', key: '' },
        { name: 'createdAt', type: 'Date', desc: 'Record timestamp', key: '' },
      ],
    },
    {
      id: 'passwords',
      name: 'passwords',
      icon: Lock,
      color: 'text-fuchsia-400',
      badge: 'AES-256-GCM',
      count: '7 Fields',
      summary: 'Confidential website logins, usernames, passwords, and private notes.',
      fields: [
        { name: '_id', type: 'ObjectId', desc: 'Record ID', key: 'PK' },
        { name: 'userId', type: 'ObjectId', desc: 'Reference to owning user', key: 'FK' },
        { name: 'title', type: 'String', desc: 'Service title (e.g. GitHub Account)', key: '' },
        { name: 'encryptedPayload', type: 'String', desc: 'Ciphertext containing username & pass', key: 'ENCRYPTED' },
        { name: 'updatedAt', type: 'Date', desc: 'Last modification date', key: '' },
      ],
    },
    {
      id: 'banks',
      name: 'bank_details',
      icon: Building,
      color: 'text-emerald-400',
      badge: 'AES-256-GCM',
      count: '7 Fields',
      summary: 'Account numbers, IFSC codes, routing numbers, and linked branch details.',
      fields: [
        { name: '_id', type: 'ObjectId', desc: 'Record ID', key: 'PK' },
        { name: 'userId', type: 'ObjectId', desc: 'Owner reference', key: 'FK' },
        { name: 'title', type: 'String', desc: 'Bank account label (e.g. HDFC Salary)', key: '' },
        { name: 'encryptedPayload', type: 'String', desc: 'Zero-knowledge encrypted bank payload', key: 'ENCRYPTED' },
        { name: 'createdAt', type: 'Date', desc: 'Timestamp', key: '' },
      ],
    },
    {
      id: 'collections',
      name: 'collections',
      icon: Folder,
      color: 'text-teal-400',
      badge: 'Encrypted Spaces',
      count: '8 Fields',
      summary: 'Custom categorized vaults for personal files, voice notes, and media items.',
      fields: [
        { name: '_id', type: 'ObjectId', desc: 'Collection ID', key: 'PK' },
        { name: 'userId', type: 'ObjectId', desc: 'Owner ID reference', key: 'FK' },
        { name: 'name', type: 'String', desc: 'Folder name', key: '' },
        { name: 'description', type: 'String', desc: 'Optional folder description', key: '' },
        { name: 'itemsCount', type: 'Number', desc: 'Aggregated items counter', key: '' },
      ],
    },
  ];

  const current = collections.find((c) => c.id === selectedCollection) || collections[0];

  return (
    <div className="w-full">
      {/* Selector Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {collections.map((col) => {
          const Icon = col.icon;
          const isSelected = selectedCollection === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setSelectedCollection(col.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-violet-600/30 border border-violet-400/50 text-white shadow-md shadow-violet-900/30'
                  : 'bg-white/[0.03] border border-white/5 text-vault-muted hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Icon className={`w-4 h-4 ${col.color}`} />
              <span>{col.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Schema Card */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="glass-surface p-6 sm:p-8 rounded-3xl border border-white/10"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-bold font-mono text-white">{current.name}</h3>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {current.badge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-vault-muted mt-1 max-w-xl leading-relaxed">
              {current.summary}
            </p>
          </div>
          <span className="text-xs font-mono text-vault-accentLight bg-black/40 px-3 py-1 rounded-xl border border-white/5">
            {current.count}
          </span>
        </div>

        {/* Visual Fields Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-vault-muted font-mono uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Field Name</th>
                <th className="pb-3 font-semibold">BSON Type</th>
                <th className="pb-3 font-semibold">Key / Constraint</th>
                <th className="pb-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {current.fields.map((f) => (
                <tr key={f.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-bold text-violet-300">{f.name}</td>
                  <td className="py-3 text-vault-muted">{f.type}</td>
                  <td className="py-3">
                    {f.key && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          f.key === 'PK'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : f.key === 'ENCRYPTED'
                            ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                            : f.key === 'TTL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {f.key}
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-sans text-vault-muted">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
