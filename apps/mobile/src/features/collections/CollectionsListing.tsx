import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  FolderLock,
  Plus,
  ArrowLeft,
  Trash2,
  Edit2,
  X,
  ChevronRight,
  Folder,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../../services/api';

export interface CollectionRecord {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const CollectionsListing: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCollection, setEditingCollection] = React.useState<CollectionRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState('');

  // Fetch collections from real backend
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections-list'],
    queryFn: async () => {
      const res = await api.get('/collections');
      return (res.data?.data?.collections || []) as CollectionRecord[];
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{
    title: string;
    description: string;
  }>({
    defaultValues: { title: '', description: '' },
  });

  const handleOpenAdd = () => {
    setEditingCollection(null);
    setFormError('');
    reset({ title: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: CollectionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCollection(col);
    setFormError('');
    reset({ title: col.title, description: col.description || '' });
    setIsModalOpen(true);
  };

  const onSubmit = async (formData: { title: string; description: string }) => {
    setFormError('');
    if (!formData.title.trim()) {
      setFormError('Collection title is required.');
      return;
    }

    try {
      if (editingCollection) {
        await api.put(`/collections/${editingCollection._id}`, {
          title: formData.title.trim(),
          description: formData.description.trim(),
        });
      } else {
        await api.post('/collections', {
          title: formData.title.trim(),
          description: formData.description.trim(),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['collections-list'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-collections'] });
      setIsModalOpen(false);
      setEditingCollection(null);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save collection.'));
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/collections/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['collections-list'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-collections'] });
      setDeleteConfirmId(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete collection.'));
    }
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
              <p className="eyebrow leading-none">Vault Storage</p>
              <h1 className="font-display font-bold text-lg text-vault-text">
                Collections ({collections.length})
              </h1>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn-primary text-xs sm:text-sm py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Space</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container flex-1">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-vault-muted">
            <RefreshCw className="w-8 h-8 animate-spin text-vault-accentLight mb-3" />
            <p className="text-sm">Loading your personal collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="glass-surface p-8 sm:p-14 text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-900/20">
              <FolderLock className="w-8 h-8" />
            </div>
            <h2 className="title-section text-vault-text">Start a Collection</h2>
            <p className="text-xs sm:text-sm text-vault-muted mt-2 max-w-sm leading-relaxed">
              Create encrypted folders for confidential notes, private photos, legal records, and family documents.
            </p>
            <button
              onClick={handleOpenAdd}
              className="btn-primary mt-6 text-sm"
            >
              <Plus className="w-4 h-4" />
              Create First Collection
            </button>
          </div>
        ) : (
          <div className="content-grid">
            {collections.map((col) => {
              const formattedDate = new Date(col.updatedAt || col.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={col._id}
                  onClick={() => navigate(`/collections/${col._id}`)}
                  className="glass-card p-5 cursor-pointer flex flex-col justify-between border border-vault-borderSubtle hover:border-emerald-500/30 group transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Folder className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEdit(col, e)}
                          className="p-1.5 rounded-lg text-vault-muted hover:text-vault-text hover:bg-white/5"
                          title="Rename / Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(col._id);
                          }}
                          className="p-1.5 rounded-lg text-vault-muted hover:text-vault-danger hover:bg-vault-danger/10"
                          title="Delete collection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-base text-vault-text group-hover:text-emerald-400 transition-colors truncate">
                      {col.title}
                    </h3>
                    {col.description && (
                      <p className="text-xs text-vault-muted mt-1 line-clamp-2 leading-relaxed">
                        {col.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-vault-borderSubtle flex items-center justify-between text-xs text-vault-subtle">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Updated {formattedDate}
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create / Edit Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-vault-borderSubtle">
              <h3 className="font-display font-bold text-lg text-vault-text">
                {editingCollection ? 'Rename Collection' : 'Create New Collection'}
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Collection Title *
                </label>
                <input
                  {...register('title', { required: true })}
                  placeholder="e.g. Travel Documents, Tax 2026, Passports"
                  className="input-vault"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="What is stored in this collection?"
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
                  {isSubmitting ? 'Saving...' : editingCollection ? 'Save Changes' : 'Create Collection'}
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
              Delete This Collection?
            </h4>
            <p className="text-xs text-vault-muted mt-1.5 leading-relaxed">
              All items within this collection will be permanently deleted from your encrypted vault.
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
