import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Landmark,
  Plus,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Edit2,
  X,
  Check,
  CreditCard,
  Unlink,
  Link2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../../services/api';
import { VaultCrypto } from '../../utils/vaultCrypto';

export interface CustomField {
  id?: string;
  key: string;
  value: string;
}

export interface DecryptedBankData {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  accountType: string;
  customFields?: CustomField[];
  notes?: string;
}

export interface BankRecord {
  _id: string;
  id?: string;
  userId: string;
  encryptedPayload: string;
  linkedCardIds: string[];
  encryptionVersion: string;
  createdAt: string;
  updatedAt: string;
  decrypted?: DecryptedBankData;
}

export const BankListing: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBank, setEditingBank] = React.useState<BankRecord | null>(null);
  const [linkingBankId, setLinkingBankId] = React.useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const [revealedAccounts, setRevealedAccounts] = React.useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState('');

  // Fetch all banks and decrypt client-side
  const { data: banks = [], isLoading } = useQuery({
    queryKey: ['banks-list'],
    queryFn: async () => {
      const res = await api.get('/banks');
      const rawBanks: BankRecord[] = res.data?.data?.banks || [];

      const decryptedList = await Promise.all(
        rawBanks.map(async (item) => {
          try {
            const decrypted = await VaultCrypto.decrypt<DecryptedBankData>(item.encryptedPayload);
            return { ...item, decrypted };
          } catch (err) {
            console.error('Failed to decrypt bank:', item._id, err);
            return {
              ...item,
              decrypted: {
                bankName: 'Encrypted Bank',
                accountHolder: 'Account Holder',
                accountNumber: '••••••••••••',
                accountType: 'Savings',
                customFields: [],
              },
            };
          }
        })
      );
      return decryptedList;
    },
  });

  // Fetch cards to allow card linking (Section 14.4)
  const { data: userCards = [] } = useQuery({
    queryKey: ['cards-for-linking'],
    queryFn: async () => {
      const res = await api.get('/cards');
      return res.data?.data?.cards || [];
    },
  });

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<{
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    accountType: string;
    customFields: CustomField[];
    notes: string;
  }>({
    defaultValues: {
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      accountType: 'Savings',
      customFields: [{ key: 'IFSC / Routing', value: '' }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customFields',
  });

  const handleOpenAdd = () => {
    setEditingBank(null);
    setFormError('');
    reset({
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      accountType: 'Savings',
      customFields: [{ key: 'IFSC / Routing', value: '' }, { key: 'Branch', value: '' }],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BankRecord) => {
    setEditingBank(item);
    setFormError('');
    reset({
      bankName: item.decrypted?.bankName || '',
      accountHolder: item.decrypted?.accountHolder || '',
      accountNumber: item.decrypted?.accountNumber || '',
      accountType: item.decrypted?.accountType || 'Savings',
      customFields: item.decrypted?.customFields?.length
        ? item.decrypted.customFields
        : [{ key: 'Branch', value: '' }],
      notes: item.decrypted?.notes || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    accountType: string;
    customFields: CustomField[];
    notes: string;
  }) => {
    setFormError('');

    if (!formData.bankName.trim()) {
      setFormError('Bank name is required.');
      return;
    }
    if (!formData.accountHolder.trim()) {
      setFormError('Account holder name is required.');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setFormError('Account number is required.');
      return;
    }

    try {
      // Clean custom fields (filter out empty pairs)
      const validCustomFields = (formData.customFields || []).filter(
        (f) => f.key.trim() && f.value.trim()
      );

      const payloadToEncrypt: DecryptedBankData = {
        bankName: formData.bankName.trim(),
        accountHolder: formData.accountHolder.trim(),
        accountNumber: formData.accountNumber.trim(),
        accountType: formData.accountType,
        customFields: validCustomFields,
        notes: (formData.notes || '').trim(),
      };

      const encryptedPayload = await VaultCrypto.encrypt(payloadToEncrypt);

      if (editingBank) {
        await api.put(`/banks/${editingBank._id}`, {
          encryptedPayload,
          encryptionVersion: '1',
        });
      } else {
        await api.post('/banks', {
          encryptedPayload,
          encryptionVersion: '1',
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['banks-list'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-banks'] });
      setIsModalOpen(false);
      setEditingBank(null);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save bank details.'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/banks/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['banks-list'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-banks'] });
      setDeleteConfirmId(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete bank detail.'));
    }
  };

  // Link card to bank (Section 14.4)
  const handleLinkCard = async (bankId: string, cardId: string) => {
    try {
      await api.post(`/banks/${bankId}/link-card`, { cardId });
      await queryClient.invalidateQueries({ queryKey: ['banks-list'] });
      setLinkingBankId(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to link card.'));
    }
  };

  // Unlink card from bank (Section 14.4)
  const handleUnlinkCard = async (bankId: string, cardId: string) => {
    try {
      await api.delete(`/banks/${bankId}/link-card/${cardId}`);
      await queryClient.invalidateQueries({ queryKey: ['banks-list'] });
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to unlink card.'));
    }
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskAccount = (acc: string) => {
    if (acc.length < 4) return '•••• •••• ••••';
    return `•••• •••• ${acc.slice(-4)}`;
  };

  return (
    <div className="app-shell">
      {/* Header */}
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
              <p className="eyebrow leading-none">Vault Financials</p>
              <h1 className="font-display font-bold text-lg text-vault-text">
                Bank Details ({banks.length})
              </h1>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-primary text-xs sm:text-sm py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container flex-1">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-vault-muted">
            <RefreshCw className="w-8 h-8 animate-spin text-vault-accentLight mb-3" />
            <p className="text-sm">Decrypting bank records...</p>
          </div>
        ) : banks.length === 0 ? (
          <div className="glass-surface p-8 sm:p-14 text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-900/20">
              <Landmark className="w-8 h-8" />
            </div>
            <h2 className="title-section text-vault-text">No Bank Details Saved</h2>
            <p className="text-xs sm:text-sm text-vault-muted mt-2 max-w-sm leading-relaxed">
              Store your bank account numbers, IFSC, branch codes, and link your debit cards securely in one encrypted location.
            </p>
            <button
              onClick={handleOpenAdd}
              className="btn-primary mt-6 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add First Bank Account
            </button>
          </div>
        ) : (
          <div className="content-grid">
            {banks.map((item) => {
              const decrypted = item.decrypted;
              const isRevealed = !!revealedAccounts[item._id];
              const rawAccount = decrypted?.accountNumber || '';
              const linkedCards = userCards.filter((c: any) => item.linkedCardIds?.includes(c._id));

              return (
                <div
                  key={item._id}
                  className="glass-card p-5 flex flex-col justify-between border border-vault-borderSubtle hover:border-blue-500/30 transition-all"
                >
                  <div>
                    {/* Top Row: Bank Name, Account Type & Actions */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/20">
                          {decrypted?.accountType || 'Account'}
                        </span>
                        <h3 className="font-display font-bold text-base text-vault-text mt-1.5 truncate">
                          {decrypted?.bankName}
                        </h3>
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

                    {/* Account Holder */}
                    <p className="text-xs text-vault-muted mb-2">
                      Holder: <span className="text-vault-text font-medium">{decrypted?.accountHolder}</span>
                    </p>

                    {/* Account Number Box (Section 14.1 & 14.2) */}
                    <div className="my-2.5 p-2.5 rounded-xl bg-vault-bg/75 border border-vault-borderSubtle flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-vault-subtle uppercase font-bold">Account Number</p>
                        <p className="font-mono text-sm text-vault-text tracking-wider select-all mt-0.5">
                          {isRevealed ? rawAccount : maskAccount(rawAccount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleReveal(item._id)}
                          className="p-1 text-vault-muted hover:text-vault-accentLight"
                          title={isRevealed ? 'Mask number' : 'Reveal number'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(rawAccount, `acc-${item._id}`)}
                          className="p-1 text-vault-muted hover:text-vault-accentLight"
                          title="Copy account number"
                        >
                          {copiedKey === `acc-${item._id}` ? <Check className="w-3.5 h-3.5 text-vault-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Custom Fields (Section 14.3) */}
                    {decrypted?.customFields && decrypted.customFields.length > 0 && (
                      <div className="my-3 space-y-1.5 border-t border-vault-borderSubtle pt-2.5">
                        <p className="text-[10px] uppercase font-bold text-vault-subtle tracking-wider">Custom Fields</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {decrypted.customFields.map((cf, idx) => (
                            <div key={idx} className="p-1.5 rounded-lg bg-vault-surface/40 border border-white/5">
                              <span className="text-[10px] text-vault-subtle block truncate">{cf.key}</span>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-vault-text truncate">{cf.value}</span>
                                <button
                                  onClick={() => handleCopy(cf.value, `cf-${item._id}-${idx}`)}
                                  className="text-vault-muted hover:text-vault-accentLight p-0.5"
                                  title={`Copy ${cf.key}`}
                                >
                                  {copiedKey === `cf-${item._id}-${idx}` ? <Check className="w-3 h-3 text-vault-success" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Cards Section (Section 14.4) */}
                    <div className="mt-3 pt-2.5 border-t border-vault-borderSubtle">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] uppercase font-bold text-vault-subtle tracking-wider flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-vault-accentLight" />
                          Linked Cards ({linkedCards.length})
                        </p>
                        <button
                          onClick={() => setLinkingBankId(item._id)}
                          className="text-[11px] font-semibold text-vault-accentLight hover:underline flex items-center gap-0.5"
                        >
                          <Link2 className="w-3 h-3" />
                          Link
                        </button>
                      </div>

                      {linkedCards.length === 0 ? (
                        <p className="text-[11px] text-vault-subtle italic">No cards linked to this account.</p>
                      ) : (
                        <div className="space-y-1">
                          {linkedCards.map((card: any) => (
                            <div key={card._id} className="flex items-center justify-between p-1.5 rounded-lg bg-vault-surface/50 border border-white/5 text-xs">
                              <span className="text-vault-text truncate font-medium">{card.title}</span>
                              <button
                                onClick={() => handleUnlinkCard(item._id, card._id)}
                                className="text-vault-danger hover:underline text-[11px] flex items-center gap-1"
                                title="Unlink card"
                              >
                                <Unlink className="w-3 h-3" />
                                Unlink
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Bank Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-lg p-6 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-vault-borderSubtle">
              <h3 className="font-display font-bold text-lg text-vault-text">
                {editingBank ? 'Edit Bank Details' : 'Add Bank Account'}
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
                  Bank Name *
                </label>
                <input
                  {...register('bankName', { required: true })}
                  placeholder="e.g. JPMorgan Chase, HDFC Bank, Barclays"
                  className="input-vault"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-vault-muted mb-1">
                    Account Type
                  </label>
                  <select {...register('accountType')} className="input-vault">
                    <option value="Savings">Savings</option>
                    <option value="Checking">Checking / Current</option>
                    <option value="Salary">Salary</option>
                    <option value="Business">Business</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vault-muted mb-1">
                    Account Holder *
                  </label>
                  <input
                    {...register('accountHolder', { required: true })}
                    placeholder="Full Name"
                    className="input-vault"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Account Number *
                </label>
                <input
                  {...register('accountNumber', { required: true })}
                  placeholder="Enter account number"
                  className="input-vault font-mono"
                />
              </div>

              {/* Dynamic Section 14.3 Custom Fields */}
              <div className="pt-2 border-t border-vault-borderSubtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-vault-text">
                    Custom Fields (IFSC, Branch, SWIFT, etc.)
                  </span>
                  <button
                    type="button"
                    onClick={() => append({ key: '', value: '' })}
                    className="text-xs font-semibold text-vault-accentLight flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add Field
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <input
                        {...register(`customFields.${index}.key` as const)}
                        placeholder="Label (e.g. IFSC)"
                        className="input-vault text-xs py-2 w-1/3"
                      />
                      <input
                        {...register(`customFields.${index}.value` as const)}
                        placeholder="Value (e.g. HDFC0001234)"
                        className="input-vault text-xs py-2 flex-1 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1.5 text-vault-danger hover:bg-vault-danger/10 rounded-lg"
                        title="Remove field"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Relationship manager, customer ID, etc."
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
                  {isSubmitting ? 'Encrypting & Saving...' : editingBank ? 'Save Changes' : 'Save Bank Detail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Card Modal (Section 14.4) */}
      {linkingBankId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-vault-borderSubtle">
              <h3 className="font-display font-bold text-base text-vault-text">
                Link Saved Card
              </h3>
              <button
                onClick={() => setLinkingBankId(null)}
                className="p-1 rounded-lg text-vault-muted hover:text-vault-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {userCards.length === 0 ? (
              <p className="text-xs text-vault-muted py-4 text-center">
                No cards saved in your vault. Add a card in the Cards module first.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userCards.map((card: any) => (
                  <button
                    key={card._id}
                    onClick={() => handleLinkCard(linkingBankId, card._id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-vault-borderSubtle bg-vault-surface hover:border-vault-accentLight/40 text-left transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-vault-text">{card.title}</p>
                      <p className="text-[10px] text-vault-muted">Card ID: {card._id.slice(-6)}</p>
                    </div>
                    <Link2 className="w-4 h-4 text-vault-accentLight" />
                  </button>
                ))}
              </div>
            )}
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
              Delete Bank Account?
            </h4>
            <p className="text-xs text-vault-muted mt-1.5 leading-relaxed">
              This bank record will be deleted. Any linked cards will remain intact in your cards wallet.
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
