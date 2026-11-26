import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  CreditCard,
  Plus,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit2,
  X,
  Check,
  Shield,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../../services/api';
import { VaultCrypto } from '../../utils/vaultCrypto';

export interface DecryptedCardData {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardType: string;
  notes?: string;
}

export interface CardRecord {
  _id: string;
  id?: string;
  title: string;
  encryptedPayload: string;
  encryptionVersion: string;
  createdAt: string;
  updatedAt: string;
  decrypted?: DecryptedCardData;
}

export const CardsListing: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCard, setEditingCard] = React.useState<CardRecord | null>(null);
  const [viewingCard, setViewingCard] = React.useState<CardRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const [revealedNumbers, setRevealedNumbers] = React.useState<Record<string, boolean>>({});
  const [revealedCVVs, setRevealedCVVs] = React.useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState('');

  // Fetch cards from real backend and decrypt client-side
  const { data: cards = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['cards-list'],
    queryFn: async () => {
      const res = await api.get('/cards');
      const rawCards: CardRecord[] = res.data?.data?.cards || [];

      // Decrypt each card payload
      const decryptedCards = await Promise.all(
        rawCards.map(async (card) => {
          try {
            const d = await VaultCrypto.decrypt<any>(card.encryptedPayload);
            return {
              ...card,
              decrypted: d ? {
                cardholderName: d.cardholderName || d.cardHolderName || '',
                cardNumber: d.cardNumber || '',
                expiry: d.expiry || (d.expiryMonth ? `${d.expiryMonth}/${d.expiryYear}` : ''),
                cvv: d.cvv || '',
                cardType: d.cardType || 'General',
                notes: d.notes,
              } : undefined,
            };
          } catch (err) {
            console.error('Failed to decrypt card:', card._id, err);
            return {
              ...card,
              decrypted: {
                cardholderName: 'Encrypted',
                cardNumber: '•••• •••• •••• ••••',
                expiry: '••/••',
                cvv: '•••',
                cardType: 'General',
              },
            };
          }
        })
      );
      return decryptedCards;
    },
  });

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<{
    title: string;
    cardholderName: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
    cardType: string;
    notes: string;
  }>({
    defaultValues: {
      title: '',
      cardholderName: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardType: 'Visa',
      notes: '',
    },
  });

  // Open add modal
  const handleOpenAdd = () => {
    setEditingCard(null);
    setFormError('');
    reset({
      title: '',
      cardholderName: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardType: 'Visa',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (card: CardRecord) => {
    setEditingCard(card);
    setFormError('');
    reset({
      title: card.title,
      cardholderName: card.decrypted?.cardholderName || '',
      cardNumber: card.decrypted?.cardNumber || '',
      expiry: card.decrypted?.expiry || '',
      cvv: card.decrypted?.cvv || '',
      cardType: card.decrypted?.cardType || 'Visa',
      notes: card.decrypted?.notes || '',
    });
    setIsAddModalOpen(true);
  };

  // Save Card (Create or Update)
  const onSubmitCard = async (formData: {
    title: string;
    cardholderName: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
    cardType: string;
    notes: string;
  }) => {
    setFormError('');

    const cleanCardNumber = formData.cardNumber.replace(/\s+/g, '');
    if (!formData.title.trim()) {
      setFormError('Card title is required.');
      return;
    }
    if (!formData.cardholderName.trim()) {
      setFormError('Cardholder name is required.');
      return;
    }
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      setFormError('Card number must be between 13 and 19 digits.');
      return;
    }

    try {
      const cardHolderName = formData.cardholderName.trim();
      const expiry = formData.expiry.trim();
      let expiryMonth = '';
      let expiryYear = '';
      if (expiry && expiry.includes('/')) {
        const parts = expiry.split('/');
        expiryMonth = parts[0]?.trim() || '';
        expiryYear = parts[1]?.trim() || '';
      }

      const payloadToEncrypt = {
        cardholderName: cardHolderName,
        cardHolderName: cardHolderName,
        cardNumber: cleanCardNumber,
        expiry: expiry,
        expiryMonth,
        expiryYear,
        cvv: formData.cvv.trim(),
        cardType: formData.cardType,
        notes: formData.notes.trim(),
      };

      // Client-side AES-256-GCM encryption
      const encryptedPayload = await VaultCrypto.encrypt(payloadToEncrypt);

      if (editingCard) {
        await api.put(`/cards/${editingCard._id}`, {
          title: formData.title.trim(),
          encryptedPayload,
          encryptionVersion: '1',
        });
      } else {
        await api.post('/cards', {
          title: formData.title.trim(),
          encryptedPayload,
          encryptionVersion: '1',
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['cards-list'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-cards'] });
      setIsAddModalOpen(false);
      setEditingCard(null);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save card.'));
    }
  };

  // Delete Card
  const handleDeleteCard = async (id: string) => {
    try {
      await api.delete(`/cards/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['cards-list'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-cards'] });
      setDeleteConfirmId(null);
      if (viewingCard?._id === id) setViewingCard(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete card.'));
    }
  };

  // Copy with timeout
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRevealNumber = (id: string) => {
    setRevealedNumbers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRevealCVV = (id: string) => {
    setRevealedCVVs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Format card number with spaces for display
  const formatCardNumber = (num: string) => {
    return num.replace(/(\d{4})/g, '$1 ').trim();
  };

  // Mask card number for preview
  const maskCardNumber = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.length < 4) return '•••• •••• •••• ••••';
    const last4 = clean.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

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
              <p className="eyebrow leading-none">Vault Wallet</p>
              <h1 className="font-display font-bold text-lg text-vault-text">
                Cards ({cards.length})
              </h1>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-primary text-xs sm:text-sm py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container flex-1">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-vault-muted">
            <RefreshCw className="w-8 h-8 animate-spin text-vault-accentLight mb-3" />
            <p className="text-sm">Decrypting your cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="glass-surface p-8 sm:p-14 text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-vault-accentLight mb-4 shadow-lg shadow-violet-900/20">
              <CreditCard className="w-8 h-8" />
            </div>
            <h2 className="title-section text-vault-text">No Saved Cards Yet</h2>
            <p className="text-xs sm:text-sm text-vault-muted mt-2 max-w-sm leading-relaxed">
              Add your credit, debit, or identification cards to keep them securely encrypted and easily accessible.
            </p>
            <button
              onClick={handleOpenAdd}
              className="btn-primary mt-6 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Your First Card
            </button>
          </div>
        ) : (
          <div className="content-grid">
            {cards.map((card) => {
              const decrypted = card.decrypted;
              const isRevealed = !!revealedNumbers[card._id];
              const isCvvRevealed = !!revealedCVVs[card._id];
              const cleanNumber = decrypted?.cardNumber || '';

              // Visual styling per card type
              const gradient =
                decrypted?.cardType === 'Mastercard'
                  ? 'from-[#B45309]/30 via-[#78350F]/20 to-vault-surface'
                  : decrypted?.cardType === 'Amex'
                  ? 'from-[#0D9488]/30 via-[#115E59]/20 to-vault-surface'
                  : 'from-violet-900/40 via-purple-950/30 to-vault-surface';

              return (
                <div
                  key={card._id}
                  className="glass-card p-5 flex flex-col justify-between border border-vault-borderSubtle hover:border-vault-accentLight/30 transition-all relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none opacity-50`} />

                  <div className="relative">
                    {/* Top Row: Title & Card Type */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-vault-accentLight px-2 py-0.5 rounded bg-vault-accentMuted border border-vault-accentLight/20">
                          {decrypted?.cardType || 'Card'}
                        </span>
                        <h3 className="font-display font-bold text-base text-vault-text mt-1.5 truncate">
                          {card.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(card)}
                          aria-label="Edit card"
                          className="p-1.5 rounded-lg text-vault-muted hover:text-vault-text hover:bg-white/5 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(card._id)}
                          aria-label="Delete card"
                          className="p-1.5 rounded-lg text-vault-muted hover:text-vault-danger hover:bg-vault-danger/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Number Display (Section 13.1 & 13.2) */}
                    <div className="my-3 p-2.5 rounded-xl bg-vault-bg/70 border border-vault-borderSubtle flex items-center justify-between gap-2">
                      <span className="font-mono text-sm tracking-wider text-vault-text truncate select-all">
                        {isRevealed ? formatCardNumber(cleanNumber) : maskCardNumber(cleanNumber)}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleRevealNumber(card._id)}
                          className="p-1 text-vault-muted hover:text-vault-accentLight transition-colors"
                          title={isRevealed ? 'Hide full number' : 'Reveal full number'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(cleanNumber, card._id)}
                          className="p-1 text-vault-muted hover:text-vault-accentLight transition-colors"
                          title="Copy card number"
                        >
                          {copiedId === card._id ? <Check className="w-3.5 h-3.5 text-vault-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Cardholder & Expiry & CVV */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-vault-muted pt-1">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-vault-subtle">Cardholder</p>
                        <p className="font-medium text-vault-text truncate mt-0.5">
                          {decrypted?.cardholderName || (decrypted as any)?.cardHolderName || '—'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-vault-subtle">Expires</p>
                          <p className="font-medium text-vault-text mt-0.5">
                            {decrypted?.expiry || ((decrypted as any)?.expiryMonth ? `${(decrypted as any).expiryMonth}/${(decrypted as any).expiryYear}` : '—')}
                          </p>
                        </div>
                        {decrypted?.cvv && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-vault-subtle">CVV</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono font-medium text-vault-text">
                                {isCvvRevealed ? decrypted.cvv : '•••'}
                              </span>
                              <button
                                onClick={() => toggleRevealCVV(card._id)}
                                className="text-vault-muted hover:text-vault-accentLight"
                                title="Toggle CVV"
                              >
                                {isCvvRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes snippet if present */}
                  {decrypted?.notes && (
                    <p className="mt-3 text-[11px] text-vault-subtle italic truncate relative border-t border-white/5 pt-2">
                      {decrypted.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Card Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-vault-borderSubtle">
              <h3 className="font-display font-bold text-lg text-vault-text">
                {editingCard ? 'Edit Saved Card' : 'Add New Card'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-vault-muted hover:text-vault-text hover:bg-white/5"
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

            <form onSubmit={handleSubmit(onSubmitCard)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Card Title / Label *
                </label>
                <input
                  {...register('title', { required: true })}
                  placeholder="e.g. Personal Visa, Corporate Debit"
                  className="input-vault"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Card Type / Network
                </label>
                <select {...register('cardType')} className="input-vault">
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Amex">American Express</option>
                  <option value="RuPay">RuPay</option>
                  <option value="Discover">Discover</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Cardholder Name *
                </label>
                <input
                  {...register('cardholderName', { required: true })}
                  placeholder="Name as printed on card"
                  className="input-vault"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Card Number * (13-19 digits)
                </label>
                <input
                  {...register('cardNumber', { required: true })}
                  inputMode="numeric"
                  placeholder="4111 2222 3333 4444"
                  className="input-vault font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-vault-muted mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    {...register('expiry')}
                    placeholder="12/28"
                    maxLength={5}
                    className="input-vault text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vault-muted mb-1">
                    CVV / CVC (Optional)
                  </label>
                  <input
                    {...register('cvv')}
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="•••"
                    className="input-vault text-center font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Billing address, bank contact, etc."
                  className="input-vault"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs"
                >
                  {isSubmitting ? 'Encrypting & Saving...' : editingCard ? 'Save Changes' : 'Save Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-vault-danger/20 text-vault-danger flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-lg text-vault-text">
              Delete This Card?
            </h4>
            <p className="text-xs text-vault-muted mt-1.5 leading-relaxed">
              This card will be permanently deleted from your encrypted vault. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCard(deleteConfirmId)}
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
