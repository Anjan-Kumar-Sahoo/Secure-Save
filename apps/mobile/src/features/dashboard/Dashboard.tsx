import React from 'react';
import {
  ArrowUpRight, Bell, ChevronRight, Clock3, CreditCard,
  FolderLock, KeyRound, LayoutGrid, LockKeyhole, Plus, ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { label: 'Cards', hint: '3 saved', icon: CreditCard, path: '/cards', tone: 'violet' },
  { label: 'Passwords', hint: '12 saved', icon: KeyRound, path: '/passwords', tone: 'pink' },
  { label: 'Collections', hint: 'Organize vault', icon: FolderLock, path: '/collections', tone: 'blue' },
];

const activity: Array<{
  title: string;
  detail: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { title: 'Visa •••• 3254', detail: 'Card added', time: '2 min ago', icon: CreditCard, color: 'text-[#a88bff]' },
  { title: 'Netflix account', detail: 'Password updated', time: 'Yesterday', icon: KeyRound, color: 'text-[#f07bfa]' },
  { title: 'Travel documents', detail: 'Collection created', time: 'May 18', icon: FolderLock, color: 'text-[#6eaaff]' },
];

export const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <main className="page-wrap">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/secure-save-logo.png" alt="Secure Save" className="h-11 w-11 rounded-2xl object-cover shadow-lg shadow-violet-500/20" />
            <div>
              <p className="eyebrow">Secure Save</p>
              <p className="text-sm font-semibold text-white">Your private vault</p>
            </div>
          </div>
          <button aria-label="Notifications" className="glass grid h-11 w-11 place-items-center rounded-2xl text-[#b8b7d8]">
            <Bell className="h-5 w-5" />
          </button>
        </header>

        <section className="relative mb-7 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#9d7cff] via-[#8066f4] to-[#d65de9] p-6 shadow-2xl shadow-violet-900/30">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[30px] border-white/10" />
          <div className="absolute -bottom-28 right-16 h-56 w-56 rounded-full border-[30px] border-white/10" />
          <div className="relative">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/75">Good evening, Alex</p>
                <h1 className="mt-1 font-['Space_Grotesk'] text-3xl font-bold tracking-tight">Your vault is<br />locked & ready.</h1>
              </div>
              <div className="rounded-2xl bg-black/15 p-3"><LockKeyhole className="h-6 w-6" /></div>
            </div>
            <div className="flex items-end justify-between">
              <div><p className="text-xs text-white/70">Items protected</p><p className="mt-1 text-2xl font-bold">24 <span className="text-sm font-medium text-white/70">items</span></p></div>
              <button onClick={() => navigate('/collections')} className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#7055dc]">Open vault <ArrowUpRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Quick access</h2><button className="text-xs font-semibold text-[#9a87ff]">Edit</button></div>
          <div className="grid grid-cols-3 gap-3">
            {actions.map(({ label, hint, icon: Icon, path, tone }) => (
              <button key={label} onClick={() => navigate(path)} className="card-premium group p-3 text-left transition hover:-translate-y-1">
                <div className={`mb-7 grid h-10 w-10 place-items-center rounded-2xl ${tone === 'pink' ? 'bg-[#e85cf4]/15 text-[#f07bfa]' : tone === 'blue' ? 'bg-[#5a9cff]/15 text-[#6eaaff]' : 'bg-[#9a7cff]/15 text-[#aa95ff]'}`}><Icon className="h-5 w-5" /></div>
                <p className="text-sm font-bold">{label}</p><p className="mt-1 text-[11px] text-[#9293b4]">{hint}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="glass mb-6 p-5">
          <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Activity</p><h2 className="mt-1 text-lg font-bold">Recently secured</h2></div><button className="grid h-9 w-9 place-items-center rounded-xl bg-white/5"><ChevronRight className="h-4 w-4 text-[#aaa8c8]" /></button></div>
          <div className="space-y-4">
            {activity.map(({ title, detail, time, icon: Icon, color }) => (
              <div key={title} className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5"><Icon className={`h-4 w-4 ${color}`} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{title}</p><p className="text-xs text-[#9293b4]">{detail}</p></div><div className="flex items-center gap-1 text-[10px] text-[#777898]"><Clock3 className="h-3 w-3" />{time}</div></div>
            ))}
          </div>
        </section>

        <button onClick={() => navigate('/collections')} className="flex w-full items-center justify-between rounded-2xl border border-dashed border-[#9a7cff]/40 bg-[#9a7cff]/5 p-4 text-left transition hover:bg-[#9a7cff]/10">
          <span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#9a7cff]/15 text-[#aa95ff]"><Plus className="h-5 w-5" /></span><span><span className="block text-sm font-bold">Add something new</span><span className="block text-xs text-[#9293b4]">Keep your digital life in one safe place</span></span></span><ChevronRight className="h-4 w-4 text-[#9293b4]" />
        </button>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-[#0b0d20]/90 px-8 py-3 backdrop-blur-xl"><div className="mx-auto flex max-w-md items-center justify-between text-[#777898]"><button className="text-[#a88bff]"><LayoutGrid className="mx-auto h-5 w-5" /><span className="mt-1 block text-[10px] font-semibold">Home</span></button><button onClick={() => navigate('/collections')}><FolderLock className="mx-auto h-5 w-5" /><span className="mt-1 block text-[10px] font-semibold">Vault</span></button><button onClick={() => navigate('/cards')}><CreditCard className="mx-auto h-5 w-5" /><span className="mt-1 block text-[10px] font-semibold">Cards</span></button><button><KeyRound className="mx-auto h-5 w-5" /><span className="mt-1 block text-[10px] font-semibold">Settings</span></button></div></nav>
    </div>
  );
};
