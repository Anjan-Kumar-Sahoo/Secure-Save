import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';

export const AddGeneralFile = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File must be under 50MB');
      return;
    }

    // Common file types
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/zip',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|zip)$/)) {
      alert('Please select a valid file type (PDF, DOC, DOCX, TXT, ZIP)');
      return;
    }

    console.log('File selected:', file.name, file.size);
    navigate('/collections');
  };

  return (
    <div className="app-shell min-h-screen flex-1 p-6 text-[#F5F7FA]">
      <div className="max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold">General File</h2>
          <p className="text-[#929BAA]">Upload documents and other files.</p>
        </div>

        <div className="border border-dashed border-[#293244] rounded-2xl p-12 text-center hover:border-[#8B7CFF] transition-colors cursor-pointer">
          <input
            type="file"
            onChange={handleSelectFile}
            className="hidden"
          />
          <div>
            <svg className="w-12 h-12 mx-auto mb-4 text-[#666]" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2V6h2v12a2 2 0 0 0 2 2h2v-8z" />
            </svg>
            <p className="text-[#666] text-sm">Click or drag a file here</p>
            <p className="text-xs text-[#929BAA]">PDF, DOC, DOCX, TXT, ZIP (max 50MB)</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/collections')}
          className="w-full btn-primary py-3 rounded-xl mt-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};