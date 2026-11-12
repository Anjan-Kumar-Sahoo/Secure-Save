import React from 'react';
import { ArrowLeft, Landmark, Plus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BankListing = () => {
  const navigate = useNavigate();
  return <div className="app-shell min-h-screen"><main className="page-wrap">
    <header className="mb-9 flex items-center gap-4"><button onClick={() => navigate('/dashboard')} className="glass grid h-10 w-10 place-items-center rounded-xl text-[#aaa8c8]"><ArrowLeft className="h-4 w-4" /></button><div><p className="eyebrow">Vault / finances</p><h1 className="mt-1 text-2xl font-bold">Bank details</h1></div></header>
    <section className="glass relative mb-5 overflow-hidden p-6"><div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#6eaaff]/10 blur-2xl" /><div className="relative flex items-start justify-between"><div><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#6eaaff]/15 text-[#6eaaff]"><Landmark className="h-6 w-6" /></div><p className="text-sm text-[#9293b4]">Connected accounts</p><p className="mt-1 text-3xl font-bold">0</p></div><ShieldCheck className="h-5 w-5 text-[#2ee6ad]" /></div></section>
    <div className="glass flex flex-col items-center px-6 py-14 text-center"><div className="mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-[#6eaaff]/10 text-[#6eaaff]"><Landmark className="h-8 w-8" /></div><h2 className="text-xl font-bold">No bank details yet</h2><p className="mt-2 max-w-xs text-sm leading-6 text-[#9293b4]">Keep account numbers and bank details encrypted and ready when you need them.</p><button className="btn-primary mt-7 flex items-center gap-2"><Plus className="h-4 w-4" /> Add bank detail</button></div>
  </main></div>;
};
