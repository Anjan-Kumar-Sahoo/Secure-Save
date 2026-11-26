import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  KeyRound,
  Plus,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit2,
  X,
  Check,
  Search,
  Wand2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../../services/api';
import { VaultCrypto } from '../../utils/vaultCrypto';

export interface DecryptedPasswordData {
  title: string;
  username?: string;
  email?: string;
  password: string;
  websiteUrl?: string;
  notes?: string;
}

export interface PasswordRecord {
  _id: string;
  id?: string;
  userId: string;
  encryptedPayload: string;
  encryptionVersion: string;
  createdAt: string;
  updatedAt: string;
  decrypted?: DecryptedPasswordData;
}

export const PasswordListing: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingPassword, setEditingPassword] = React.useState<PasswordRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const [revealedPasswords, setRevealedPasswords] = React.useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState('');

  // Password Generator State
  const [showGenerator, setShowGenerator] = React.useState(false);
  const [genLength, setGenLength] = React.useState(16);
  const [genUppercase, setGenUppercase] = React.useState(true);
  const [genLowercase, setGenLowercase] = React.useState(true);
  const [genNumbers, setGenNumbers] = React.useState(true);
  const [genSymbols, setGenSymbols] = React.useState(true);
  const [generatedPassword, setGeneratedPassword] = React.useState('');

  // Fetch passwords from real backend and decrypt client-side
  const { data: passwords = [], isLoading, refetch } = useQuery({
    queryKey: ['passwords-list'],
    queryFn: async () => {
      const res = await api.get('/passwords');
      const rawPasswords: PasswordRecord[] = res.data?.data?.passwords || [];

      // Decrypt each password payload
      const decryptedList = await Promise.all(
        rawPasswords.map(async (item) => {
          try {
            const decrypted = await VaultCrypto.decrypt<DecryptedPasswordData>(item.encryptedPayload);
            return { ...item, decrypted };
          } catch (err) {
            console.error('Failed to decrypt password:', item._id, err);
            return {
              ...item,
              decrypted: {
                title: 'Encrypted Entry',
                password: '••••••••••••',
              },
            };
          }
        })
      );
      return decryptedList;
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<DecryptedPasswordData>({
    defaultValues: {
      title: '',
      username: '',
      email: '',
      password: '',
      websiteUrl: '',
      notes: '',
    },
  });

  const currentPasswordValue = watch('password');

  // Real-time password strength evaluator
  const passwordStrength = React.useMemo(() => {
    const pw = currentPasswordValue || '';
    if (!pw) return { score: 0, label: '', color: '', width: '0%' };

    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) {
      return { score: 1, label: 'Weak', color: 'bg-rose-500 text-rose-400', width: '25%' };
    } else if (score <= 4) {
      return { score: 2, label: 'Fair', color: 'bg-amber-500 text-amber-400', width: '55%' };
    } else if (score === 5) {
      return { score: 3, label: 'Strong', color: 'bg-blue-500 text-blue-400', width: '80%' };
    } else {
      return { score: 4, label: 'Unbreakable', color: 'bg-emerald-500 text-emerald-400', width: '100%' };
    }
  }, [currentPasswordValue]);

  // Trigger generator
  const runPasswordGenerator = () => {
    const pw = VaultCrypto.generatePassword({
      length: genLength,
      uppercase: genUppercase,
      lowercase: genLowercase,
      numbers: genNumbers,
      symbols: genSymbols,
    });
    setGeneratedPassword(pw);
  };

  React.useEffect(() => {
    if (showGenerator) {
      runPasswordGenerator();
    }
  }, [genLength, genUppercase, genLowercase, genNumbers, genSymbols, showGenerator]);

  const applyGeneratedPassword = () => {
    setValue('password', generatedPassword, { shouldValidate: true, shouldDirty: true });
    setShowGenerator(false);
  };

  const handleOpenAdd = () => {
    setEditingPassword(null);
    setFormError('');
    setShowGenerator(false);
    reset({
      title: '',
      username: '',
      email: '',
      password: '',
      websiteUrl: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PasswordRecord) => {
    setEditingPassword(item);
    setFormError('');
    setShowGenerator(false);
    reset({
      title: item.decrypted?.title || '',
      username: item.decrypted?.username || '',
      email: item.decrypted?.email || '',
      password: item.decrypted?.password || '',
      websiteUrl: item.decrypted?.websiteUrl || '',
      notes: item.decrypted?.notes || '',
    });
    setIsModalOpen(true);
  };

  // Submit Password (Create or Update)
  const onSubmit = async (formData: DecryptedPasswordData) => {
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Application or website title is required.');
      return;
    }
    if (!formData.password) {
      setFormError('Password cannot be empty.');
      return;
    }

    try {
      const payloadToEncrypt: DecryptedPasswordData = {
        title: formData.title.trim(),
        username: (formData.username || '').trim(),
        email: (formData.email || '').trim(),
        password: formData.password,
        websiteUrl: (formData.websiteUrl || '').trim(),
        notes: (formData.notes || '').trim(),
      };

      const encryptedPayload = await VaultCrypto.encrypt(payloadToEncrypt);

      if (editingPassword) {
        await api.put(`/passwords/${editingPassword._id}`, {
          encryptedPayload,
          encryptionVersion: '1',
        });
      } else {
        await api.post('/passwords', {
          encryptedPayload,
          encryptionVersion: '1',
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['passwords-list'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-passwords'] });
      setIsModalOpen(false);
      setEditingPassword(null);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save password entry.'));
    }
  };

  // Delete Password
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/passwords/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['passwords-list'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-passwords'] });
      setDeleteConfirmId(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete password.'));
    }
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter passwords by search
  const filteredPasswords = passwords.filter((p) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = p.decrypted?.title.toLowerCase().includes(term);
    const userMatch = p.decrypted?.username?.toLowerCase().includes(term);
    const emailMatch = p.decrypted?.email?.toLowerCase().includes(term);
    const urlMatch = p.decrypted?.websiteUrl?.toLowerCase().includes(term);
    return titleMatch || userMatch || emailMatch || urlMatch;
  });

  return (
    <div className="app-shell">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-vault-borderSubtle bg-vault-bg/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-[clamp(1rem,3vw,2rem)] h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl text-vault-muted hover:text-vault-text hover:bg-vault-surface/60 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="eyebrow leading-none">Password Vault</p>
              <h1 className="font-display font-bold text-lg text-vault-text">
                Passwords ({passwords.length})
              </h1>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-primary text-xs sm:text-sm py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Password</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container flex-1">
        {/* Search Bar */}
        {passwords.length > 0 && (
          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-subtle" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, username, or URL..."
              className="input-vault pl-10 text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-vault-muted hover:text-vault-text text-xs"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-vault-muted">
            <RefreshCw className="w-8 h-8 animate-spin text-vault-accentLight mb-3" />
            <p className="text-sm">Decrypting credentials...</p>
          </div>
        ) : passwords.length === 0 ? (
          <div className="glass-surface p-8 sm:p-14 text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-600/15 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-4 shadow-lg shadow-fuchsia-900/20">
              <KeyRound className="w-8 h-8" />
            </div>
            <h2 className="title-section text-vault-text">No Passwords Stored</h2>
            <p className="text-xs sm:text-sm text-vault-muted mt-2 max-w-sm leading-relaxed">
              Generate strong passwords and store your account credentials safely with zero-knowledge encryption.
            </p>
            <button
              onClick={handleOpenAdd}
              className="btn-primary mt-6 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add First Credential
            </button>
          </div>
        ) : filteredPasswords.length === 0 ? (
          <div className="py-16 text-center text-vault-muted text-sm">
            No credentials found matching "{searchTerm}".
          </div>
        ) : (
          <div className="content-grid">
            {filteredPasswords.map((item) => {
              const decrypted = item.decrypted;
              const isRevealed = !!revealedPasswords[item._id];
              const usernameOrEmail = decrypted?.username || decrypted?.email || '';

              return (
                <div
                  key={item._id}
                  className="glass-card p-5 flex flex-col justify-between border border-vault-borderSubtle hover:border-fuchsia-500/30 transition-all"
                >
                  <div>
                    {/* Header: Title & Action icons */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-base text-vault-text truncate">
                          {decrypted?.title || 'Untitled'}
                        </h3>
                        {decrypted?.websiteUrl && (
                          <a
                            href={decrypted.websiteUrl.startsWith('http') ? decrypted.websiteUrl : `https://${decrypted.websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-vault-accentLight hover:underline truncate max-w-full mt-0.5"
                          >
                            <span>{decrypted.websiteUrl.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-vault-muted hover:text-vault-text hover:bg-white/5"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item._id)}
                          className="p-1.5 rounded-lg text-vault-muted hover:text-vault-danger hover:bg-vault-danger/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Username row */}
                    {usernameOrEmail && (
                      <div className="my-2.5 p-2 rounded-xl bg-vault-bg/60 border border-vault-borderSubtle flex items-center justify-between text-xs">
                        <span className="text-vault-text truncate font-mono select-all">
                          {usernameOrEmail}
                        </span>
                        <button
                          onClick={() => handleCopy(usernameOrEmail, `user-${item._id}`)}
                          className="text-vault-muted hover:text-vault-accentLight p-1 ml-2"
                          title="Copy username"
                        >
                          {copiedKey === `user-${item._id}` ? <Check className="w-3.5 h-3.5 text-vault-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {/* Password row with Mask/Reveal and Copy */}
                    <div className="my-2 p-2 rounded-xl bg-vault-bg/80 border border-vault-borderSubtle flex items-center justify-between text-xs">
                      <span className="font-mono text-vault-text tracking-wider truncate select-all">
                        {isRevealed ? decrypted?.password : '••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => toggleReveal(item._id)}
                          className="p-1 text-vault-muted hover:text-vault-accentLight"
                          title={isRevealed ? 'Hide password' : 'Show password'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(decrypted?.password || '', `pw-${item._id}`)}
                          className="p-1 text-vault-muted hover:text-vault-accentLight"
                          title="Copy password"
                        >
                          {copiedKey === `pw-${item._id}` ? <Check className="w-3.5 h-3.5 text-vault-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Notes snippet */}
                    {decrypted?.notes && (
                      <p className="mt-2 text-[11px] text-vault-subtle italic truncate">
                        {decrypted.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-md p-6 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-vault-borderSubtle">
              <h3 className="font-display font-bold text-lg text-vault-text">
                {editingPassword ? 'Edit Password' : 'Add New Password'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-vault-muted hover:text-vault-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl border border-vault-danger/30 bg-vault-danger/10 text-vault-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Title / Service Name *
                </label>
                <input
                  {...register('title', { required: true })}
                  placeholder="e.g. Google, GitHub, Netflix"
                  className="input-vault"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-vault-muted mb-1">
                    Username
                  </label>
                  <input
                    {...register('username')}
                    placeholder="john_doe"
                    className="input-vault"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vault-muted mb-1">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="john@example.com"
                    className="input-vault"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Website URL
                </label>
                <input
                  {...register('websiteUrl')}
                  placeholder="https://github.com"
                  className="input-vault"
                />
              </div>

              {/* Password field with Generator Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-vault-muted">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGenerator(!showGenerator)}
                    className="text-xs font-semibold text-vault-accentLight flex items-center gap-1 hover:underline"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{showGenerator ? 'Close Generator' : 'Generate Strong'}</span>
                  </button>
                </div>
                <input
                  {...register('password', { required: true })}
                  type="text"
                  placeholder="Enter or generate password"
                  className="input-vault font-mono"
                />
                {/* Real-time Password Strength Meter */}
                {currentPasswordValue && (
                  <div className="mt-2 space-y-1 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-vault-muted">Strength:</span>
                      <span className={`font-semibold ${passwordStrength.color.split(' ')[1]}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color.split(' ')[0]}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Integrated Section 15.3 Password Generator Tool */}
              {showGenerator && (
                <div className="p-3.5 rounded-xl bg-vault-surface border border-vault-accentLight/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-vault-text flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-vault-accentLight" />
                      Password Generator
                    </span>
                    <button
                      type="button"
                      onClick={runPasswordGenerator}
                      className="text-xs text-vault-accentLight hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-vault-bg font-mono text-xs text-center text-vault-accentLight font-bold tracking-wider break-all select-all border border-vault-borderSubtle">
                    {generatedPassword}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-vault-muted mb-1">
                      <span>Length</span>
                      <span className="font-bold text-vault-text">{genLength} chars</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      value={genLength}
                      onChange={(e) => setGenLength(parseInt(e.target.value))}
                      className="w-full accent-vault-accent cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-vault-muted">
                      <input
                        type="checkbox"
                        checked={genUppercase}
                        onChange={(e) => setGenUppercase(e.target.checked)}
                        className="rounded border-vault-borderSubtle text-vault-accent"
                      />
                      <span>A-Z Uppercase</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-vault-muted">
                      <input
                        type="checkbox"
                        checked={genLowercase}
                        onChange={(e) => setGenLowercase(e.target.checked)}
                        className="rounded border-vault-borderSubtle text-vault-accent"
                      />
                      <span>a-z Lowercase</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-vault-muted">
                      <input
                        type="checkbox"
                        checked={genNumbers}
                        onChange={(e) => setGenNumbers(e.target.checked)}
                        className="rounded border-vault-borderSubtle text-vault-accent"
                      />
                      <span>0-9 Numbers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-vault-muted">
                      <input
                        type="checkbox"
                        checked={genSymbols}
                        onChange={(e) => setGenSymbols(e.target.checked)}
                        className="rounded border-vault-borderSubtle text-vault-accent"
                      />
                      <span>!@#$ Symbols</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={applyGeneratedPassword}
                    className="w-full py-1.5 rounded-lg bg-vault-accent text-white font-semibold text-xs hover:bg-vault-accentLight transition-colors"
                  >
                    Use This Password
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Security questions, recovery email, etc."
                  className="input-vault"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs"
                >
                  {isSubmitting ? 'Encrypting & Saving...' : editingPassword ? 'Save Changes' : 'Save Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-vault-danger/20 text-vault-danger flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-lg text-vault-text">
              Delete This Password?
            </h4>
            <p className="text-xs text-vault-muted mt-1.5 leading-relaxed">
              This credential will be permanently removed from your vault. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="btn-danger text-xs py-2 px-4"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
