import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { z } from 'zod';
import { Check } from 'lucide-react';

const textNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  content: z.string().min(1, 'Content is required'),
});

type TextNoteForm = z.infer<typeof textNoteSchema>;

export const AddTextNote = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TextNoteForm>({
    resolver: undefined,
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = async (data: TextNoteForm) => {
    try {
      // Mock text note creation - in real app: await api.createCollectionItem(user.id, 'text', data)
      console.log('Creating text note:', data);
      navigate('/collections');
    } catch (error) {
      console.error('Failed to create text note:', error);
    }
  };

  return (
    <div className="flex-1 p-6 bg-[#0B0D12] text-[#F5F7FA]">
      <div className="max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Text Note</h2>
          <p className="text-[#929BAA]">Write and save your notes securely.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              {...register('title')}
              className={`w-full input-premium ${errors.title ? 'border-red-500' : ''}`}
              placeholder="e.g. Meeting Notes, Idea"
              maxLength={100}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              {...register('content')}
              rows={8}
              className={`w-full input-premium ${errors.content ? 'border-red-500' : ''}`}
              placeholder="Start typing your note..."
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Note'}
          </button>
        </form>
      </div>
    </div>
  );
};