import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { Key, Eye, EyeOff, Plus } from 'lucide-react';

const passwordSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  username: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  websiteUrl: z.string().url('Invalid URL').optional(),
  notes: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type PasswordForm = z.infer<typeof passwordSchema>;

export const AddPassword = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      title: '',
      username: '',
      email: '',
      websiteUrl: '',
      notes: '',
      password: '',
    },
  });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmVisibility = () => setShowConfirm(!showConfirm);

  const onSubmit = async (data: PasswordForm) => {
    try {
      // Mock save - in real app: await api.createPassword(user.id, data)
      console.log('Creating password:', data);

      // Reset form and redirect
      navigate('/passwords');
    } catch (error) {
      console.error('Failed to create password:', error);
    }
  };

  return (
    <div className="app-shell min-h-screen flex-1 p-6 text-[#F5F7FA]">
      <div className="max-w-md space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Add Password</h2>
          <button onClick={() => navigate('/passwords')} className="text-sm text-[#8B7CFF] hover:underline">
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title/Application Name</label>
            <input
              {...register('title')}
              className={`w-full input-premium ${errors.title ? 'border-red-500' : ''}`}
              placeholder="e.g. Gmail, GitHub"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              {...register('username')}
              className={`w-full input-premium ${errors.username ? 'border-red-500' : ''}`}
              placeholder="john.doe@gmail.com"
            />
            {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              {...register('email')}
              type="email"
              className={`w-full input-premium ${errors.email ? 'border-red-500' : ''}`}
              placeholder="john.doe@gmail.com"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Website URL</label>
            <input
              {...register('websiteUrl')}
              type="url"
              className={`w-full input-premium ${errors.websiteUrl ? 'border-red-500' : ''}`}
              placeholder="https://www.google.com"
            />
            {errors.websiteUrl && <p className="text-xs text-red-500">{errors.websiteUrl.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className={`w-full input-premium ${errors.notes ? 'border-red-500' : ''}`}
              placeholder="Add any relevant notes"
            />
            {errors.notes && <p className="text-xs text-red-500">{errors.notes.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••••••"
                className={`w-full input-premium ${errors.password ? 'border-red-500' : ''} pr-12`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7CFF] hover:text-[#F5F7FA]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Plus className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  );
};