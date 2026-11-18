import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Shield, Lock, KeyRound, CreditCard, Landmark, CheckCircle, Sparkles } from 'lucide-react';

export const InteractiveVault3D: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 180 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [18, -18]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-18, 18]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <div
      className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center perspective-1000 select-none py-6"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1200 }}
    >
      {/* Dynamic 3D Floating Glow Rings */}
      <motion.div
        animate={{
          rotate: 360,
          scale: isHovered ? 1.08 : 1,
        }}
        transition={{ rotate: { duration: 25, repeat: Infinity, ease: 'linear' } }}
        className="absolute w-80 h-80 rounded-full border border-violet-500/20 border-dashed pointer-events-none"
      />
      <motion.div
        animate={{
          rotate: -360,
          scale: isHovered ? 1.15 : 1.02,
        }}
        transition={{ rotate: { duration: 35, repeat: Infinity, ease: 'linear' } }}
        className="absolute w-96 h-96 rounded-full border border-purple-500/15 pointer-events-none"
      />

      {/* Main 3D Interactive Card / Safe Shield */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.02 }}
        onClick={() => setUnlocked(!unlocked)}
        className="relative w-72 sm:w-80 h-96 rounded-3xl p-6 glass-surface cursor-pointer flex flex-col justify-between border-2 border-violet-500/35 shadow-2xl shadow-violet-950/60 overflow-hidden group"
      >
        {/* Holographic light reflection */}
        <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

        {/* Card Header in 3D */}
        <div style={{ transform: 'translateZ(40px)' }} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-violet-400">Secure Vault</p>
              <p className="text-xs font-semibold text-white">AES-256-GCM</p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
            {unlocked ? 'DECRYPTED' : 'LOCKED'}
          </span>
        </div>

        {/* 3D Center Emblem */}
        <div
          style={{ transform: 'translateZ(65px)' }}
          className="my-auto flex flex-col items-center justify-center text-center"
        >
          <motion.div
            animate={{
              rotateY: unlocked ? 360 : 0,
              scale: isHovered ? 1.06 : 1,
            }}
            transition={{ duration: 0.8 }}
            className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-violet-900/60 via-purple-900/40 to-slate-900/80 border border-violet-400/40 flex items-center justify-center shadow-inner shadow-violet-500/30"
          >
            <img
              src="/logo.png"
              alt="Secure Save Emblem"
              className="w-20 h-20 object-contain drop-shadow-[0_8px_16px_rgba(139,92,246,0.5)]"
            />
            {unlocked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg"
              >
                <CheckCircle className="w-4 h-4" />
              </motion.div>
            )}
          </motion.div>

          <p className="text-xs text-vault-muted mt-4 font-mono">
            {unlocked ? 'Client Session Authenticated' : 'Click Vault to Simulate Unlock'}
          </p>
        </div>

        {/* 3D Orbiting Badges */}
        <div style={{ transform: 'translateZ(30px)' }} className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
          <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/5">
            <CreditCard className="w-4 h-4 mx-auto text-violet-400 mb-1" />
            <p className="text-[10px] text-vault-muted">Cards</p>
          </div>
          <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/5">
            <KeyRound className="w-4 h-4 mx-auto text-fuchsia-400 mb-1" />
            <p className="text-[10px] text-vault-muted">Keys</p>
          </div>
          <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Landmark className="w-4 h-4 mx-auto text-blue-400 mb-1" />
            <p className="text-[10px] text-vault-muted">Banks</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
