import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(6, 'PIN must be at most 6 digits').regex(/^\d+$/, 'PIN must be numeric'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPin, setShowPin] = React.useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      // Mock login for now
      console.log('Logging in with:', data);
      // In real implementation, this would be an API call
      setAuth({ email: data.email }, 'mock-token');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 items-center justify-center bg-[#0B0D12]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-[#141821] rounded-2xl border border-[#293244] shadow-xl mb-6">
            <Shield className="w-12 h-12 text-[#8B7CFF]" />
          </div>
          <h1 className="text-3xl font-bold text-[#F5F7FA]">Secure Save</h1>
          <p className="text-[#929BAA] mt-2 text-center">Welcome back. Please unlock your vault.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#929BAA] px-1">Email Address</label>
            <input
              {...register('email')}
              type="email"
              placeholder="name@example.com"
              className={`w-full input-premium ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-500 px-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#929BAA] px-1">Login PIN</label>
            <div className="relative">
              <input
                {...register('pin')}
                type={showPin ? 'text' : 'password'}
                placeholder="••••••"
                maxLength={6}
                className={`w-full input-premium pr-12 ${errors.pin ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#929BAA] hover:text-[#F5F7FA]"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.pin && <p className="text-xs text-red-500 px-1">{errors.pin.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            {isSubmitting ? 'Unlocking...' : 'Unlock Vault'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-4 mt-8">
          <Link to="/forgot-pin" className="text-sm font-medium text-[#8B7CFF] hover:underline">
            Forgot Login PIN?
          </Link>
          <p className="text-sm text-[#929BAA]">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-[#8B7CFF] hover:underline">
              Create Vault
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
