import React from 'react';
import { CreditCard, Key, Landmark, Plus, Menu, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();

  const tiles = [
    { id: 'cards', label: 'Cards', icon: CreditCard, color: 'from-blue-500 to-blue-700', path: '/cards' },
    { id: 'passwords', label: 'Passwords', icon: Key, color: 'from-purple-500 to-purple-700', path: '/passwords' },
    { id: 'banks', label: 'Bank Details', icon: Landmark, color: 'from-green-500 to-green-700', path: '/banks' },
    { id: 'add', label: 'Add', icon: Plus, color: 'from-accent to-[#7A6AEF]', path: '/collections' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#293244] bg-[#141821]">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-[#1B2230] rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-[#F5F7FA]" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-[#F5F7FA]">Secure Save</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#1B2230] rounded-lg transition-colors">
            <Settings className="w-6 h-6 text-[#929BAA]" />
          </button>
          <button className="p-2 hover:bg-[#1B2230] rounded-lg transition-colors">
            <User className="w-6 h-6 text-[#929BAA]" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-[#0B0D12]">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#F5F7FA]">Welcome Back</h2>
          <p className="text-[#929BAA]">Your digital vault is secured.</p>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => navigate(tile.path)}
              className="relative aspect-square card-premium p-6 flex flex-col items-center justify-center gap-4 overflow-hidden group hover:border-[#8B7CFF] transition-all active:scale-95"
            >
              <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${tile.color} group-hover:opacity-20 transition-opacity`} />
              <div className={`p-4 rounded-full bg-[#1B2230] group-hover:bg-[#293244] transition-colors`}>
                <tile.icon className="w-8 h-8 text-[#8B7CFF]" />
              </div>
              <span className="font-semibold text-lg text-[#F5F7FA]">{tile.label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 text-center border-t border-[#293244] bg-[#141821]">
        <p className="text-sm text-[#929BAA]">© 2026 Secure Save. All rights reserved.</p>
        <p className="text-xs text-[#929BAA] mt-1 italic">Made with ♥ by AK</p>
      </footer>
    </div>
  );
};
