import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Folder, Plus, Eye, EyeOff } from 'lucide-react';
import { AddCollection } from '../add-collection/AddCollection';

export interface CollectionItem {
  id: string;
  title: string;
  description?: string;
  itemCount?: number;
}

export const CollectionsListing = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections', user?.id],
    queryFn: async () => {
      // Mock collections list - in real app: await api.getCollections(user.id)
      return [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F5F7FA]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#293244] bg-[#141821]">
        <h1 className="text-xl font-bold text-[#F5F7FA]">My Collections</h1>
        <button
          onClick={() => navigate('/collections/add')}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Add Title
        </button>
      </nav>

      <main className="p-6">
        {isLoading ? (
          <div className="min-h-64 flex items-center justify-center text-[#929BAA]">
            <span>Loading...</span>
          </div>
        ) : (
          <>
            {collections.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 card-premium p-6 rounded-2xl border border-[#293244]"
                  >
                    <div>
                      <h3 className="font-medium text-lg">{collection.title}</h3>
                      {collection.description && (
                        <p className="text-sm text-[#929BAA]">{collection.description}</p>
                      )}
                      {collection.itemCount !== undefined && (
                        <p className="text-xs text-[#929BAA]">Items: {collection.itemCount}</p>
                      )}
                    </div>
                    <button
                      className="mt-2 flex items-center gap-2 text-[#8B7CFF] hover:underline"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[#929BAA]">
                <p>No collections yet.</p>
                <p className="mt-2">Create your first collection to get started.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};