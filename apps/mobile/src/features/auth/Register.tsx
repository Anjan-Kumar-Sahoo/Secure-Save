import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import api from '../../services/api';

export const Register = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await api.post('/auth/register', { email: data.email });
      alert('OTP sent to your email');
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert('Registration failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 items-center justify-center bg-[#0B0D12]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-[#F5F7FA] mb-8">Register</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register('email')} type="email" placeholder="Email" className="w-full input-premium" />
          <button type="submit" className="w-full btn-primary">Continue</button>
        </form>
      </div>
    </div>
  );
};