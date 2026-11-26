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
  FileUp,
  FileCheck,
  Paperclip,
} from 'lucide-react';
import api, { getApiErrorMessage } from '../../../services/api';
import { collectionService } from '../../../services';
import { VaultCrypto } from '../../../utils/vaultCrypto';
import { CollectionItemType, DecryptedCollectionItemData } from '@secure-save/shared-types';

export type ItemType = CollectionItemType;

export interface DecryptedItemData extends DecryptedCollectionItemData {
  notes?: string;
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

  // Universal File Upload State
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<string>('');
  const [isDownloading, setIsDownloading] = React.useState(false);

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
              decrypted: { title: item.title, content: 'Encrypted item content' },
            };
          }
        })
      );
      return decryptedList;
    },
    enabled: !!collectionId,
  });

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<{
    title: string;
    content: string;
    notes: string;
  }>({
    defaultValues: { title: '', content: '', notes: '' },
  });

  const handleOpenAdd = (type: ItemType) => {
    setSelectedItemType(type);
    setSelectedFile(null);
    setUploadProgress('');
    setFormError('');
    reset({ title: '', content: '', notes: '' });
    setIsAddModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setValue('title', file.name);
      setFormError('');
    }
  };

  const onSubmitItem = async (formData: { title: string; content: string; notes: string }) => {
    setFormError('');
    if (!formData.title.trim()) {
      setFormError('Item title is required.');
      return;
    }

    try {
      let fileId: string | undefined;
      let storageKey: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let mimeType: string | undefined;

      // If it is a file upload (Photo, Document, or Files)
      if (selectedFile) {
        setUploadProgress('Encrypting file on client...');
        const arrayBuffer = await selectedFile.arrayBuffer();

        // 1. Client-side AES-256 authenticated encryption of the raw binary
        const encryptedBase64 = await VaultCrypto.encryptBinary(arrayBuffer);

        setUploadProgress('Uploading encrypted payload...');
        const uploadResult = await collectionService.uploadFile(
          selectedFile.name,
          selectedFile.type || 'application/octet-stream',
          encryptedBase64
        );

        fileId = uploadResult.fileId;
        storageKey = uploadResult.storageKey;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        mimeType = selectedFile.type || 'application/octet-stream';
      } else if (selectedItemType === 'text' && !formData.content.trim()) {
        setFormError('Text note content cannot be empty.');
        return;
      }

      setUploadProgress('Saving vault item...');
      const payloadToEncrypt: DecryptedItemData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        notes: (formData.notes || '').trim(),
        fileName,
        fileSize,
        mimeType,
        fileId,
        storageKey,
      };

      const encryptedPayload = await VaultCrypto.encrypt(payloadToEncrypt);

      await api.post(`/collections/${collectionId}/items`, {
        itemType: selectedItemType,
        title: formData.title.trim(),
        encryptedPayload,
        encryptionVersion: '1',
        fileReferences: fileId ? [fileId] : [],
      });

      await queryClient.invalidateQueries({ queryKey: ['collection-items', collectionId] });
      await queryClient.invalidateQueries({ queryKey: ['vault-collections'] });
      setIsAddModalOpen(false);
      setSelectedFile(null);
      setUploadProgress('');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save item.'));
      setUploadProgress('');
    }
  };

  const handleDownloadDecryptedFile = async (item: CollectionItemRecord) => {
    const fileId = item.decrypted?.fileId || (item.fileReferences && item.fileReferences[0]);
    if (!fileId) {
      alert('No attached file in this item.');
      return;
    }

    try {
      setIsDownloading(true);
      const downloadData = await collectionService.downloadFile(fileId);

      // Decrypt raw binary client-side
      const decryptedBuffer = await VaultCrypto.decryptBinary(downloadData.encryptedBase64);

      // Trigger client file save
      const blob = new Blob([decryptedBuffer], { type: downloadData.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadData.fileName || item.decrypted?.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to download and decrypt file.'));
    } finally {
      setIsDownloading(false);
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

  const getItemIcon = (type: ItemType, mimeType?: string) => {
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
        if (mimeType?.includes('pdf') || mimeType?.includes('document')) {
          return <FileText className="w-5 h-5 text-rose-400" />;
        }
        return <File className="w-5 h-5 text-fuchsia-400" />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

            {/* Four Action Options: Text Note, Photo, Document, Files */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenAdd('text')}
                className="btn-primary text-xs py-2 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Text Note</span>
              </button>
              <button
                onClick={() => handleOpenAdd('image')}
                className="btn-secondary text-xs py-2 px-3"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Photo</span>
              </button>
              <button
                onClick={() => handleOpenAdd('file')}
                className="btn-secondary text-xs py-2 px-3"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Document</span>
              </button>
              <button
                onClick={() => handleOpenAdd('file')}
                className="btn-secondary text-xs py-2 px-3 bg-violet-500/10 border-violet-500/30 text-violet-200 hover:bg-violet-500/20"
                title="Universal file upload (arbitrary formats)"
              >
                <FileUp className="w-3.5 h-3.5 text-violet-400" />
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
              Add your confidential notes, photos, documents, or arbitrary files using the options above.
            </p>
          </div>
        ) : (
          <div className="content-grid">
            {items.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              const isFileAttachment = !!(item.decrypted?.fileId || (item.fileReferences && item.fileReferences.length > 0));

              return (
                <div
                  key={item._id}
                  onClick={() => setViewingItem(item)}
                  className="glass-card p-4 cursor-pointer flex flex-col justify-between border border-vault-borderSubtle hover:border-vault-accentLight/40 group transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 rounded-xl bg-vault-surface border border-white/5">
                        {getItemIcon(item.itemType, item.decrypted?.mimeType)}
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

                    {isFileAttachment ? (
                      <div className="mt-2 p-2 rounded-lg bg-vault-surface/40 border border-white/5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-vault-text truncate">
                            {item.decrypted?.fileName || item.title}
                          </p>
                          <span className="text-[10px] text-vault-muted font-mono">
                            {formatFileSize(item.decrypted?.fileSize)}
                          </span>
                        </div>
                        <Download className="w-3.5 h-3.5 text-vault-muted group-hover:text-vault-accentLight shrink-0" />
                      </div>
                    ) : (
                      <p className="text-xs text-vault-muted mt-1 line-clamp-2 leading-relaxed">
                        {item.decrypted?.content || 'Encrypted note'}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-vault-borderSubtle flex items-center justify-between text-[11px] text-vault-subtle">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-vault-muted" />
                      {formattedDate}
                    </span>
                    <span className="capitalize">{item.itemType}</span>
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
          <div className="glass-surface w-full max-w-lg p-6 relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-vault-borderSubtle">
              <div className="flex items-center gap-2">
                {getItemIcon(selectedItemType)}
                <h3 className="font-display font-bold text-lg text-vault-text">
                  {selectedItemType === 'text' ? 'New Text Note' : 'Add Encrypted File / Media'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-vault-muted hover:text-vault-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-vault-danger/10 border border-vault-danger/30 flex items-center gap-2 text-xs text-vault-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitItem)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-vault-muted mb-1">
                  Item Title *
                </label>
                <input
                  {...register('title')}
                  placeholder="e.g. Tax Statement 2026, Passphrase Seed, Master Backup"
                  className="input-vault"
                />
              </div>

              {/* Universal File Selector */}
              {selectedItemType !== 'text' && (
                <div>
                  <label className="block text-xs font-semibold text-vault-muted mb-1.5">
                    Select File (Arbitrary Formats: Images, Videos, Audio, Docs, Archives, Any Type)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-xl border border-dashed border-violet-500/40 bg-vault-surface/40 hover:bg-vault-surface/70 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-colors"
                  >
                    {selectedFile ? (
                      <>
                        <FileCheck className="w-7 h-7 text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold text-vault-text">{selectedFile.name}</p>
                          <p className="text-[10px] text-vault-muted font-mono">{formatFileSize(selectedFile.size)} • {selectedFile.type || 'Custom Type'}</p>
                        </div>
                        <span className="text-[10px] text-violet-300 underline mt-1">Change file</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 text-vault-accentLight" />
                        <div>
                          <p className="text-xs font-semibold text-vault-text">Click to browse device storage</p>
                          <p className="text-[10px] text-vault-muted">Supports any file extension or binary format</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedItemType === 'text' && (
                <div>
                  <label className="block text-xs font-semibold text-vault-muted mb-1">
                    Confidential Content *
                  </label>
                  <textarea
                    {...register('content')}
                    rows={5}
                    placeholder="Enter confidential notes, seed phrases, recovery codes..."
                    className="input-vault resize-none"
                  />
                </div>
              )}

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

              {uploadProgress && (
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{uploadProgress}</span>
                </div>
              )}

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
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Encrypting...</span>
                    </>
                  ) : (
                    <span>Save Item</span>
                  )}
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
                {getItemIcon(viewingItem.itemType, viewingItem.decrypted?.mimeType)}
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
              {/* File Attachment Details */}
              {(viewingItem.decrypted?.fileId || (viewingItem.fileReferences && viewingItem.fileReferences.length > 0)) ? (
                <div className="p-4 rounded-xl bg-vault-surface/60 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Paperclip className="w-5 h-5 text-violet-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-vault-text truncate">
                          {viewingItem.decrypted?.fileName || viewingItem.title}
                        </p>
                        <p className="text-[10px] text-vault-muted font-mono">
                          {formatFileSize(viewingItem.decrypted?.fileSize)} • {viewingItem.decrypted?.mimeType || 'Binary'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadDecryptedFile(viewingItem)}
                      disabled={isDownloading}
                      className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 shrink-0"
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Decrypting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}

              {viewingItem.decrypted?.content && (
                <div className="p-4 rounded-xl bg-vault-bg border border-vault-borderSubtle text-xs sm:text-sm text-vault-text whitespace-pre-wrap leading-relaxed font-sans">
                  {viewingItem.decrypted.content}
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
