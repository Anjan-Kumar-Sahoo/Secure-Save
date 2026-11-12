import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const AddImage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image must be under 10MB');
      return;
    }

    // In real implementation, would upload encrypted file
    console.log('Image selected:', file.name, file.size);
    navigate('/collections');
  };

  return (
    <div className="flex-1 p-6 bg-[#0B0D12] text-[#F5F7FA]">
      <div className="max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Image</h2>
          <p className="text-[#929BAA]">Upload photos securely.</p>
        </div>

        <div className="border border-dashed border-[#293244] rounded-2xl p-12 text-center hover:border-[#8B7CFF] transition-colors cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleSelectImage}
            className="hidden"
          />
          <div>
            <svg className="w-12 h-12 mx-auto mb-4 text-[#666]" viewBox="0 0 24 24">
              <path d="M18.59 6.59L1.41 18.6c-.44.44-.44 1.18 0 1.62.44.44 1.18.44 1.62 0L18.59 11.41a.996.996 0 0 1 1.41.89zM12 4L3 10h5.86l1.43-5.43L12 4zm7.08 7.08a1 1 0 0 1-1.42 0L12 15.86l-4.15-4.15a1 1 0 0 1 0-1.42L15.86 9l4.15 4.15z" />
            </svg>
            <p className="text-[#666] text-sm">Click or drag an image here</p>
            <p className="text-xs text-[#929BAA]">JPEG, PNG, WebP, GIF (max 10MB)</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/collections')}
          className="w-full btn-primary py-3 rounded-xl mt-6"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLineCap="round" />
          </svg>
          Cancel
        </button>
      </div>
    </div>
  );
};