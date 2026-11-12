import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { FolderAdd, Trash2, Pencil, Eye, EyeOff, Image, Video, Audio, File, Folder } from 'lucide-react';
import { AddTextNote } from '../add-text-note/AddTextNote';
import { AddImage } from '../add-image/AddImage';
import { AddVideo } from '../add-video/AddVideo';
import { AddAudio } from '../add-audio/AddAudio';
import { AddGeneralFile } from '../add-general-file/AddGeneralFile';
import { deleteCollection } from '../../utils/collection-utils';

interface CollectionItem {
  id: string;
  itemType: 'text' | 'image' | 'video' | 'audio' | 'file';
  title: string;
}

export const CollectionDetail = () => {
  const navigate = useNavigate();
  const { user, deleteAuth } = useAuthStore();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['collection-items', user?.id],
    queryFn: async () => {
      // Mock collection items
      return [];
    },
    enabled: !!user,
  });

  const handleDeleteCollection = async () => {
    if (confirm('Are you sure you want to delete this collection?')) {
      await deleteCollection(user?.id);
      navigate('/collections');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F5F7FA]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#293244] bg-[#141821]">
        <h1 className="text-xl font-bold text-[#F5F7FA]">Collection</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteCollection}
            className="text-red-500 hover:text-[#EF6262] text-sm font-medium"
          >
            Delete Collection
          </button>
          <button
            onClick={() => navigate('/collections')}
            className="text-[#8B7CFF] hover:underline text-sm"
          >
            Back
          </button>
        </div>
      </nav>

      <main className="p-6">
        {isLoading ? (
          <div className="min-h-64 flex items-center justify-center text-[#929BAA]">
            <span>Loading...</span>
          </div>
        ) : (
          <>
            {/* Items Section */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-[#F5F7FA] mb-6">Items</h2>
              {isLoading ? (
                <p className="text-[#929BAA]">Loading items...</p>
              ) : items.length === 0 ? (
                <p className="text-[#929BAA] py-8">No items in this collection.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-2 gap-4 card-premium p-6 rounded-2xl border border-[#293244]"
                    >
                      <div>
                        <h3 className="font-medium text-lg">{item.title}</h3>
                        <p className="text-xs text-[#929BAA]">{item.itemType}</p>
                      </div>
                      <div>
                        <button className="text-[#8B7CFF] hover:underline text-sm">View</button>
                        <button className="text-red-500 hover:text-[#EF6262] text-sm ml-2">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Add Item Types */}
            <section>
              <h2 className="text-xl font-bold text-[#F5F7FA] mb-6 mt-8">Add Item</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/collections/add-text')}
                  className="w-full btn-primary py-3 rounded-xl hover:bg-[#7A6AEF] transition-colors"
                >
                  <FolderAdd className="w-4 h-4 me-2" />
                  Text Note
                </button>
                <button
                  onClick={() => navigate('/collections/add-image')}
                  className="w-full btn-primary py-3 rounded-xl hover:bg-[#7A6AEF] transition-colors"
                >
                  <Image className="w-4 h-4 me-2" />
                  Image
                </button>
                <button
                  onClick={() => navigate('/collections/add-video')}
                  className="w-full btn-primary py-3 rounded-xl hover:bg-[#7A6AEF] transition-colors"
                >
                  <Video className="w-4 h-4 me-2" />
                  Video
                </button>
                <button
                  onClick={() => navigate('/collections/add-audio')}
                  className="w-full btn-primary py-3 rounded-xl hover:bg-[#7A6AEF] transition-colors"
                >
                  <Audio className="w-4 h-4 me-2" />
                  Audio
                </button>
                <button
                  onClick={() => navigate('/collections/add-file')}
                  className="w-full btn-primary py-3 rounded-xl hover:bg-[#7A6AEF] transition-colors"
                >
                  <File className="w-4 h-4 me-2" />
                  General File
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};