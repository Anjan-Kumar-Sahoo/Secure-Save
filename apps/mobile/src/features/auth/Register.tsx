import React from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Check, KeyRound, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<'email' | 'otp' | 'pin'>('email');
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [isResending, setIsResending] = React.useState(false);
  const rememberEmail = useAuthStore((state) => state.rememberEmail);
  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<{ email: string; otp: string; pin: string; confirmPin: string }>();

  const onSubmit = async (data: { email: string; otp: string; pin: string; confirmPin: string }) => {
    setError('');
    try {
      if (step === 'email') {
        const normalizedEmail = data.email.trim().toLowerCase();
        await api.post('/auth/register', { email: normalizedEmail });
        setEmail(normalizedEmail);
        rememberEmail(normalizedEmail);
        reset({ email: normalizedEmail, otp: '', pin: '', confirmPin: '' });
        setStep('otp');
        return;
      }

      if (step === 'otp') {
        await api.post('/auth/otp/verify', { email, otp: data.otp });
        setStep('pin');
        return;
      }

      await api.post('/auth/pin/complete-registration', {
        email,
        pin: data.pin,
        confirmPin: data.confirmPin,
      });
      navigate('/login');
    } catch (requestError) {
      console.error(requestError);
      setError(getApiErrorMessage(requestError, 'Registration failed.'));
    }
  };

  const resendOtp = async () => {
    setError('');
    setIsResending(true);
    try {
      await api.post('/auth/otp/send', { email });
    } catch (requestError) {
      console.error(requestError);
      setError(getApiErrorMessage(requestError, 'Unable to resend the verification code.'));
    } finally {
      setIsResending(false);
    }
  };

  const stepCopy = {
    email: ['Get started', 'Your safe place', 'starts here.'],
    otp: ['Verify your email', 'One last check', 'before your vault.'],
    pin: ['Set your PIN', 'Make it yours', 'keep it private.'],
  }[step];

  return <div className="app-shell flex min-h-screen items-center justify-center p-5"><div className="glass w-full max-w-lg p-7 sm:p-12">
    <div className="mb-10 flex items-center gap-3"><img src="/secure-save-logo.png" alt="Secure Save" className="h-14 w-14 rounded-2xl object-cover" /><div><p className="eyebrow">Secure Save</p><p className="text-sm font-bold">Build your private vault</p></div></div>
    <p className="eyebrow">{stepCopy[0]}</p><h1 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold">{stepCopy[1]}<br />{stepCopy[2]}</h1><p className="mt-3 text-sm leading-6 text-[#9293b4]">{step === 'email' ? 'Create your account and keep everything important protected in one beautifully simple space.' : step === 'otp' ? `We sent a six-digit code to ${email}.` : 'Choose a PIN you can remember. It will be the only way into your vault.'}</p>
    {error && <p role="alert" className="mt-5 rounded-2xl border border-[#ff829a]/25 bg-[#ff829a]/10 p-3 text-sm text-[#ffb2c0]">{error}</p>}
    <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5">
      {step === 'email' && <label className="block"><span className="mb-2 block text-xs font-semibold text-[#aaa8c8]">Email address</span><span className="relative block"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777898]" /><input {...register('email', { required: 'Email is required' })} type="email" placeholder="you@example.com" className="input-premium pl-11" /></span></label>}
      {step === 'otp' && <><label className="block"><span className="mb-2 block text-xs font-semibold text-[#aaa8c8]">Verification code</span><input {...register('otp', { required: true, pattern: /^\d{6}$/ })} inputMode="numeric" maxLength={6} placeholder="000000" className="input-premium text-center text-xl tracking-[.5em]" /></label><button type="button" onClick={resendOtp} disabled={isResending} className="text-left text-xs font-semibold text-[#a88bff] disabled:opacity-50">{isResending ? 'Resending...' : 'Resend code'}</button></>}
      {step === 'pin' && <><label className="block"><span className="mb-2 block text-xs font-semibold text-[#aaa8c8]">Six-digit vault PIN</span><span className="relative block"><KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777898]" /><input {...register('pin', { required: true, pattern: /^\d{6}$/ })} inputMode="numeric" maxLength={6} type="password" placeholder="••••••" className="input-premium pl-11 tracking-[.4em]" /></span></label><label className="block"><span className="mb-2 block text-xs font-semibold text-[#aaa8c8]">Confirm PIN</span><input {...register('confirmPin', { required: true, pattern: /^\d{6}$/ })} inputMode="numeric" maxLength={6} type="password" placeholder="••••••" className="input-premium tracking-[.4em]" /></label></>}
      <button disabled={isSubmitting} className="btn-primary flex w-full items-center justify-center gap-2">{isSubmitting ? 'Please wait...' : step === 'email' ? 'Send verification code' : step === 'otp' ? 'Verify email' : 'Create my vault'}<ArrowRight className="h-4 w-4" /></button>
    </form>
    <div className="mt-8 space-y-3 rounded-2xl bg-white/[.03] p-4 text-xs text-[#9293b4]"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2ee6ad]" /> Six-digit email verification</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#2ee6ad]" /> Encrypted personal vault</p></div><p className="mt-8 text-center text-sm text-[#9293b4]">Already have a vault? <Link to="/login" className="font-bold text-[#a88bff]">Unlock it</Link></p>
  </div></div>;
};
