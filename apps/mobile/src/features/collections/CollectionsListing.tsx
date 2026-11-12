import React from 'react';
import { ArrowLeft, ChevronRight, FolderLock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface CollectionItem { id: string; title: string; description?: string; itemCount?: number; }

export const CollectionsListing = () => {
  const navigate = useNavigate();
  return <div className="app-shell min-h-screen"><main className="page-wrap">
    <header className="mb-9 flex items-center justify-between"><div className="flex items-center gap-4"><button onClick={() => navigate('/dashboard')} className="glass grid h-10 w-10 place-items-center rounded-xl text-[#aaa8c8]"><ArrowLeft className="h-4 w-4" /></button><div><p className="eyebrow">Your vault</p><h1 className="mt-1 text-2xl font-bold">Collections</h1></div></div><button className="grid h-10 w-10 place-items-center rounded-xl bg-[#9a7cff] text-white shadow-lg shadow-violet-500/20"><Plus className="h-5 w-5" /></button></header>
    <section className="mb-7 rounded-[28px] bg-gradient-to-br from-[#4e3b9a] to-[#1d1b4a] p-6"><p className="eyebrow text-white/60">Organize your life</p><h2 className="mt-2 max-w-xs text-2xl font-bold leading-tight">A place for every important thing.</h2><p className="mt-3 text-sm text-white/60">Group your documents, memories and notes.</p></section>
    <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Your spaces</h2><span className="text-xs text-[#9293b4]">0 collections</span></div>
    <div className="glass flex flex-col items-center px-6 py-14 text-center"><div className="mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-[#9a7cff]/10 text-[#a88bff]"><FolderLock className="h-8 w-8" /></div><h2 className="text-xl font-bold">Start a collection</h2><p className="mt-2 max-w-xs text-sm leading-6 text-[#9293b4]">Create your first space for travel documents, family memories or anything you want to keep close.</p><button onClick={() => navigate('/collections/add')} className="btn-primary mt-7 flex items-center gap-2">Create collection <ChevronRight className="h-4 w-4" /></button></div>
  </main></div>;
};
