import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/authStore';
import { z } from 'zod';
import { useRouter } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';

const collectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title must be under 50 characters'),
  description: z.string().optional(),
});

type CollectionForm = z.infer<typeof collectionSchema>;

export const AddCollection = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CollectionForm>({
    resolver: undefined, // simple validation for now
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: CollectionForm) => {
    try {
      // Mock collection creation - in real app: await api.createCollection(user.id, data)
      console.log('Creating collection:', data);

      // Reset form and redirect to collections
      navigate('/collections');
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  return (
    <div className="flex-1 p-6 bg-[#0B0D12] text-[#F5F7FA]">
      <div className="max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Create Collection</h2>
          <p className="text-[#929BAA]">Organize your personal items.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-2">Collection Title</label>
            <input
              {...register('title')}
              className={`w-full input-premium ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Personal Documents, Projects, etc."
              maxLength={50}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Plus className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create Collection'}
          </button>
        </form>
      </div>
    </div>
  );
};