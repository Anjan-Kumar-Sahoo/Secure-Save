import React from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Check, Mail, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export const Register = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>();
  const rememberEmail = useAuthStore((state) => state.rememberEmail);
  const onSubmit = async (data: { email: string }) => {
    try { await api.post('/auth/register', { email: data.email }); rememberEmail(data.email); alert('OTP sent to your email'); navigate('/login'); }
    catch (error) { console.error(error); alert(error instanceof Error ? `Registration failed: ${error.message}` : 'Registration failed. Check that the API is online and try again.'); }
  };

  return <div className="app-shell flex min-h-screen items-center justify-center p-5"><div className="glass w-full max-w-lg p-7 sm:p-12">
    <div className="mb-10 flex items-center gap-3"><img src="/secure-save-logo.png" alt="Secure Save" className="h-14 w-14 rounded-2xl object-cover" /><div><p className="eyebrow">Secure Save</p><p className="text-sm font-bold">Build your private vault</p></div></div>
    <p className="eyebrow">Get started</p><h1 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold">Your safe place<br />starts here.</h1><p className="mt-3 text-sm leading-6 text-[#9293b4]">Create your account and keep everything important protected in one beautifully simple space.</p>
    <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5"><label className="block"><span className="mb-2 block text-xs font-semibold text-[#aaa8c8]">Email address</span><span className="relative block"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777898]" /><input {...register('email', { required: true })} type="email" placeholder="you@example.com" className="input-premium pl-11" /></span></label><button disabled={isSubmitting} className="btn-primary flex w-full items-center justify-center gap-2">{isSubmitting ? 'Creating...' : 'Continue'}<ArrowRight className="h-4 w-4" /></button></form>
    <div className="mt-8 space-y-3 rounded-2xl bg-white/[.03] p-4 text-xs text-[#9293b4]"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2ee6ad]" /> Six-digit email verification</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2ee6ad]" /> Encrypted personal vault</p></div><p className="mt-8 text-center text-sm text-[#9293b4]">Already have a vault? <Link to="/login" className="font-bold text-[#a88bff]">Unlock it</Link></p>
  </div></div>;
};
