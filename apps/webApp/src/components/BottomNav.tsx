import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, CreditCard, KeyRound, Landmark, FolderLock } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: LayoutGrid },
    { label: 'Cards', path: '/cards', icon: CreditCard },
    { label: 'Passwords', path: '/passwords', icon: KeyRound },
    { label: 'Banks', path: '/banks', icon: Landmark },
    { label: 'Vault', path: '/collections', icon: FolderLock },
  ];

  return (
    <nav
      aria-label="Vault navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-vault-borderSubtle bg-vault-bg/95 backdrop-blur-xl transition-all"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pt-2 pb-1">
        {navItems.map(({ label, path, icon: Icon }) => {
          const isActive =
            path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(path);

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-vault-accentLight font-semibold'
                  : 'text-vault-muted hover:text-vault-text hover:bg-white/[0.03]'
              }`}
            >
              <div
                className={`relative p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-vault-accentMuted' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-vault-accentLight stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-vault-accentLight" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
