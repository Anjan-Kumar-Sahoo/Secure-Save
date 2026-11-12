import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';

export const AddVideo = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSelectVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid video file (MP4, MOV, WebM)');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Video must be under 50MB');
      return;
    }

    console.log('Video selected:', file.name, file.size);
    navigate('/collections');
  };

  return (
    <div className="app-shell min-h-screen flex-1 p-6 text-[#F5F7FA]">
      <div className="max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Video</h2>
          <p className="text-[#929BAA]">Upload videos securely.</p>
        </div>

        <div className="border border-dashed border-[#293244] rounded-2xl p-12 text-center hover:border-[#8B7CFF] transition-colors cursor-pointer">
          <input
            type="file"
            accept="video/*"
            onChange={handleSelectVideo}
            className="hidden"
          />
          <div>
            <svg className="w-12 h-12 mx-auto mb-4 text-[#666]" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7L8 5zM8 5l11 7-11 7v-2.5l-5.5-6.5L8 5v2.5z" />
            </svg>
            <p className="text-[#666] text-sm">Click or drag a video here</p>
            <p className="text-xs text-[#929BAA]">MP4, MOV, WebM (max 50MB)</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/collections')}
          className="w-full btn-primary py-3 rounded-xl mt-6"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};