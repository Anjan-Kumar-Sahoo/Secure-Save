import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AddPassword } from './add-password/AddPassword';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Key, Eye, EyeOff, Copy, Clipboard } from 'lucide-react';

export interface PasswordEntry {
  id: string;
  title: string;
  username?: string;
  email?: string;
  maskedPassword?: string;
  websiteUrl?: string;
}

export const PasswordListing = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: passwords = [], isLoading } = useQuery({
    queryKey: ['passwords', user?.id],
    queryFn: async () => {
      // Mock passwords list
      return [] as PasswordEntry[];
    },
    enabled: !!user,
  });

  const togglePasswordVisibility = React.useState(false);
  const [showPassword, setShowPassword] = togglePasswordVisibility;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Clipboard cleared automatically after a moment
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F5F7FA]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#293244] bg-[#141821]">
        <h1 className="text-xl font-bold text-[#F5F7FA]">Passwords</h1>
        <button
          onClick={() => navigate('/passwords/add')}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl"
        >
          <Key className="w-4 h-4" />
          Add Password
        </button>
      </nav>

      <main className="p-6">
        {isLoading ? (
          <div className="min-h-64 flex items-center justify-center text-[#929BAA]">
            <span>Loading...</span>
          </div>
        ) : (
          <>
            {passwords.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {passwords.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-2 gap-4 card-premium p-6 rounded-2xl border border-[#293244]"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{entry.title}</h3>
                      {entry.username && (
                        <p className="text-sm text-[#929BAA]">{entry.username}</p>
                      )}
                      {entry.email && (
                        <p className="text-sm text-[#929BAA]">{entry.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.maskedPassword && (
                        <p
                          className={`font-mono text-sm ${showPassword ? '' : 'text-[#929BAA]'}`}
                        >
                          {entry.maskedPassword}
                        </p>
                      )}
                      {showPassword && (
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-[#8B7CFF] hover:underline underline-offset-2"
                        >
                          Hide
                        </button>
                      )}
                      {!showPassword && (
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-[#8B7CFF] hover:underline underline-offset-2"
                        >
                          Show
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(entry.username || '')}
                        className="text-xs text-[#8B7CFF] hover:underline underline-offset-2"
                        title="Copy username"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(entry.maskedPassword || '')}
                        className="text-xs text-[#8B7CFF] hover:underline underline-offset-2"
                        title="Copy password"
                      >
                        <Clipboard className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[#929BAA]">
                <p>No passwords saved yet.</p>
                <p className="mt-2">Add your first credential to get started.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};