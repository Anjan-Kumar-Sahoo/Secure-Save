import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Plus,
  FileText,
  Image as ImageIcon,
  Video,
  Mic,
  File,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Eye,
  Check,
  Upload,
  Download,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../../../services/api';
import { VaultCrypto } from '../../../utils/vaultCrypto';

export type ItemType = 'text' | 'image' | 'video' | 'audio' | 'file';

export interface DecryptedItemData {
  content?: string;
  notes?: string;
  fileName?: string;
  fileSize?: string;
  mediaBase64?: string;
}

export interface CollectionItemRecord {
  _id: string;
  id?: string;
  collectionId: string;
  userId: string;
  itemType: ItemType;
  title: string;
  encryptedPayload: string;
  fileReferences?: string[];
  encryptionVersion: string;
  createdAt: string;
  updatedAt: string;
  decrypted?: DecryptedItemData;
}

export const CollectionDetail: React.FC = () => {
  const { id: collectionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedItemType, setSelectedItemType] = React.useState<ItemType>('text');
  const [viewingItem, setViewingItem] = React.useState<CollectionItemRecord | null>(null);
  const [deleteConfirmItemId, setDeleteConfirmItemId] = React.useState<string | null>(null);
  const [deleteConfirmCollection, setDeleteConfirmCollection] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<{
    name: string;
    size: string;
    dataUrl: string;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Fetch parent collection details
  const { data: collection, isLoading: isLoadingCollection } = useQuery({
    queryKey: ['collection-detail', collectionId],
    queryFn: async () => {
      if (!collectionId) return null;
      const res = await api.get(`/collections/${collectionId}`);
      return res.data?.data?.collection;
    },
    enabled: !!collectionId,
  });

  // Fetch and decrypt items in this collection
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['collection-items', collectionId],
    queryFn: async () => {
      if (!collectionId) return [];
      const res = await api.get(`/collections/${collectionId}/items`);
      const rawItems: CollectionItemRecord[] = res.data?.data?.items || [];

      const decryptedList = await Promise.all(
        rawItems.map(async (item) => {
          try {
            const decrypted = await VaultCrypto.decrypt<DecryptedItemData>(item.encryptedPayload);
            return { ...item, decrypted };
          } catch (err) {
            console.error('Failed to decrypt collection item:', item._id, err);
            return {
              ...item,
              decrypted: { content: 'Encrypted item content' },
            };
          }
        })
      );
      return decryptedList;
    },
    enabled: !!collectionId,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{
    title: string;
    content: string;
    notes: string;
  }>({
    defaultValues: { title: '', content: '', notes: '' },
  });

  const handleOpenAdd = (type: ItemType) => {
    setSelectedItemType(type);
    setFormError('');
    setSelectedFile(null);
    reset({ title: '', content: '', notes: '' });
    setIsAddModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        dataUrl: reader.result as string,
      });
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  const onSubmitItem = async (formData: { title: string; content: string; notes: string }) => {
    setFormError('');
    const finalTitle = formData.title.trim() || selectedFile?.name || '';
    if (!finalTitle) {
      setFormError('Item title or file is required.');
      return;
    }

    if (selectedItemType === 'file' && !selectedFile && !formData.content.trim()) {
      setFormError('Please select a file to upload or enter file contents.');
      return;
    }

    if (selectedItemType === 'text' && !formData.content.trim()) {
      setFormError('Content or notes cannot be empty.');
      return;
    }

    try {
      const payloadToEncrypt: DecryptedItemData = {
        content: formData.content.trim() || (selectedFile ? `Attached file: ${selectedFile.name}` : ''),
        notes: (formData.notes || '').trim(),
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        mediaBase64: selectedFile?.dataUrl,
      };

      const encryptedPayload = await VaultCrypto.encrypt(payloadToEncrypt);

      await api.post(`/collections/${collectionId}/items`, {
        itemType: selectedItemType,
        title: finalTitle,
        encryptedPayload,
        encryptionVersion: '1',
      });

      await queryClient.invalidateQueries({ queryKey: ['collection-items', collectionId] });
      await queryClient.invalidateQueries({ queryKey: ['vault-collections'] });
      setIsAddModalOpen(false);
      setSelectedFile(null);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save item.'));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await api.delete(`/collections/items/${itemId}`);
      await queryClient.invalidateQueries({ queryKey: ['collection-items', collectionId] });
      await queryClient.invalidateQueries({ queryKey: ['vault-collections'] });
      setDeleteConfirmItemId(null);
      if (viewingItem?._id === itemId) setViewingItem(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete item.'));
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionId) return;
    try {
      await api.delete(`/collections/${collectionId}`);
      await queryClient.invalidateQueries({ queryKey: ['collections-list'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-collections'] });
      navigate('/collections');
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete collection.'));
    }
  };

  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'text':
        return <FileText className="w-5 h-5 text-violet-400" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-blue-400" />;
      case 'audio':
        return <Mic className="w-5 h-5 text-amber-400" />;
      case 'file':
      default:
        return <File className="w-5 h-5 text-fuchsia-400" />;
    }
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-vault-borderSubtle bg-vault-bg/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-[clamp(1rem,3vw,2rem)] h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/collections')}
              className="p-2 rounded-xl text-vault-muted hover:text-vault-text hover:bg-vault-surface/60 transition-colors shrink-0"
              aria-label="Back to collections"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="eyebrow leading-none">Space</p>
              <h1 className="font-display font-bold text-lg text-vault-text truncate">
                {collection?.title || 'Collection'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteConfirmCollection(true)}
              className="p-2 rounded-xl text-vault-muted hover:text-vault-danger hover:bg-vault-danger/10 transition-colors"
              title="Delete this entire collection"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container flex-1">
        {/* Collection Info Banner */}
        <div className="glass-surface p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/20">
                  Collection Space
                </span>
                <span className="text-xs text-vault-muted">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <h2 className="title-section text-vault-text">
                {collection?.title}
              </h2>
              {collection?.description && (
                <p className="text-xs sm:text-sm text-vault-muted mt-1 leading-relaxed">
                  {collection.description}
                </p>
              )}
            </div>

            {/* Quick Add Action Buttons (Section 16.2) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenAdd('text')}
                className="btn-primary text-xs py-2 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Text Note</span>
              </button>
              <button
                onClick={() => handleOpenAdd('file')}
                className="btn-secondary text-xs py-2 px-3"
              >
                <File className="w-3.5 h-3.5" />
                <span>Files</span>
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        {isLoadingItems ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-vault-muted">
            <RefreshCw className="w-8 h-8 animate-spin text-vault-accentLight mb-3" />
            <p className="text-sm">Decrypting collection contents...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="glass-card p-10 text-center max-w-md mx-auto">
            <FolderOpen className="w-12 h-12 text-vault-muted mx-auto mb-3 opacity-60" />
            <h3 className="font-display font-bold text-base text-vault-text">No Items in this Space</h3>
            <p className="text-xs text-vault-muted mt-1 leading-relaxed">
              Add your confidential notes, documents, or memory items using the buttons above.
            </p>
          </div>
        ) : (
          <div className="content-grid">
            {items.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={item._id}
                  onClick={() => setViewingItem(item)}
                  className="glass-card p-4 cursor-pointer flex flex-col justify-between border border-vault-borderSubtle hover:border-vault-accentLight/40 group transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 rounded-xl bg-vault-surface border border-white/5">
                        {getItemIcon(item.itemType)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmItemId(item._id);
                        }}
                        className="p-1.5 rounded-lg text-vault-muted hover:text-vault-danger hover:bg-vault-danger/10"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-display font-bold text-sm text-vault-text group-hover:text-vault-accentLight transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-vault-muted mt-1 line-clamp-2 leading-relaxed">
                      {item.decrypted?.content || 'Encrypted content'}
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-vault-borderSubtle flex items-center justify-between text-[11px] text-vault-subtle">
                    <span className="capitalize">{item.itemType}</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-vault-borderSubtle">
              <h3 className="font-display font-bold text-lg text-vault-text capitalize">
                Add {selectedItemType} to Collection
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleSubmit(onSubmitItem)} className="space-y-4">
              {selectedItemType === 'file' && (
                <div>
                  <label className="block text-xs font-semibold text-vault-muted mb-1">
                    Select File from Device *
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="block w-full text-xs text-vault-muted file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-vault-surface/80 file:text-vault-text hover:file:bg-vault-surface cursor-pointer border border-vault-borderSubtle rounded-xl p-2 bg-vault-bg"
                  />
                  {selectedFile && (
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{selectedFile.name} ({selectedFile.size}) ready for encrypted upload</span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Item Title {selectedItemType === 'file' ? '(Defaults to file name)' : '*'}
                </label>
                <input
                  {...register('title')}
                  placeholder={selectedItemType === 'file' ? 'Optional custom title' : 'e.g. WiFi Passwords, Tax Document, Meeting Memo'}
                  className="input-vault"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  {selectedItemType === 'text' ? 'Encrypted Note Content *' : 'Description / Content (Optional)'}
                </label>
                <textarea
                  {...register('content')}
                  rows={selectedItemType === 'file' ? 3 : 5}
                  placeholder={selectedItemType === 'file' ? 'Optional description or notes about this file...' : 'Enter sensitive contents to be encrypted with AES-256-GCM...'}
                  className="input-vault"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  {...register('notes')}
                  placeholder="Tags, keywords, or references"
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
                  {isSubmitting ? 'Encrypting & Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-vault-borderSubtle">
              <div className="flex items-center gap-2">
                {getItemIcon(viewingItem.itemType)}
                <h3 className="font-display font-bold text-lg text-vault-text">
                  {viewingItem.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1 rounded-lg text-vault-muted hover:text-vault-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-vault-bg border border-vault-borderSubtle text-xs sm:text-sm text-vault-text whitespace-pre-wrap leading-relaxed font-sans">
                {viewingItem.decrypted?.content || 'No content.'}
              </div>

              {viewingItem.decrypted?.fileName && viewingItem.decrypted?.mediaBase64 && (
                <div className="p-3 rounded-xl bg-vault-surface/40 border border-vault-borderSubtle flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <File className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-vault-text truncate">{viewingItem.decrypted.fileName}</p>
                      {viewingItem.decrypted.fileSize && (
                        <p className="text-[10px] text-vault-muted">{viewingItem.decrypted.fileSize}</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={viewingItem.decrypted.mediaBase64}
                    download={viewingItem.decrypted.fileName}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              )}

              {viewingItem.decrypted?.notes && (
                <div className="text-xs text-vault-muted">
                  <span className="font-semibold text-vault-subtle block mb-0.5">Notes:</span>
                  <span>{viewingItem.decrypted.notes}</span>
                </div>
              )}

              <div className="pt-3 border-t border-vault-borderSubtle flex items-center justify-between text-xs text-vault-subtle">
                <span>Encrypted AES-256-GCM (v{viewingItem.encryptionVersion})</span>
                <button
                  onClick={() => {
                    setDeleteConfirmItemId(viewingItem._id);
                  }}
                  className="text-vault-danger hover:underline font-semibold"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deleteConfirmItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-vault-danger/20 text-vault-danger flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-lg text-vault-text">
              Delete This Item?
            </h4>
            <p className="text-xs text-vault-muted mt-1.5 leading-relaxed">
              This item will be permanently deleted from this collection.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmItemId(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirmItemId)}
                className="btn-danger text-xs py-2 px-4"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Collection Confirmation Modal */}
      {deleteConfirmCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-surface w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-vault-danger/20 text-vault-danger flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-lg text-vault-text">
              Delete Entire Collection?
            </h4>
            <p className="text-xs text-vault-muted mt-1.5 leading-relaxed">
              This will permanently delete this space and all {items.length} encrypted items within it.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmCollection(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCollection}
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
