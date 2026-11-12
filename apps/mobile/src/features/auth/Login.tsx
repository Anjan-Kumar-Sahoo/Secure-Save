import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Fingerprint, LockKeyhole, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api, { getApiErrorMessage } from '../../services/api';

const loginSchema = z.object({
  pin: z.string().length(6, 'PIN must be exactly 6 digits').regex(/^\d+$/, 'PIN must be numeric'),
});
type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const { setAuth, rememberedEmail, user } = useAuthStore();
  const email = rememberedEmail || user?.email || null;
  const [showPin, setShowPin] = React.useState(false);
  const [error, setError] = React.useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    if (!email) {
      return;
    }
    setError('');
    try {
      const response = await api.post('/auth/session/login', { email, pin: data.pin });
      setAuth({ email }, response.data.data.token);
      navigate('/dashboard');
    } catch (requestError) {
      console.error(requestError);
      setError(getApiErrorMessage(requestError, 'Unable to unlock your vault.'));
    }
  };

  return (
    <div className="auth-shell app-shell flex w-full items-center justify-center">
      <div className="auth-card w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0f112a]/80 shadow-2xl lg:max-w-5xl lg:grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden min-h-[650px] overflow-hidden bg-gradient-to-br from-[#8069f3] via-[#39286e] to-[#10122b] p-10 lg:block">
          <div className="absolute -right-32 -top-20 h-96 w-96 rounded-full border-[55px] border-white/10" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border-[45px] border-[#db75f5]/20" />
          <div className="relative flex h-full flex-col justify-between"><div><div className="mb-16 flex items-center gap-3"><img src="/secure-save-logo.png" alt="Secure Save" className="h-14 w-14 rounded-2xl object-cover" /><span className="font-['Space_Grotesk'] text-xl font-bold">Secure Save</span></div><p className="eyebrow text-white/60">Personal digital vault</p><h1 className="mt-4 max-w-md font-['Space_Grotesk'] text-5xl font-bold leading-tight">Everything valuable.<br /><span className="text-[#e7b6ff]">One safe place.</span></h1><p className="mt-6 max-w-sm text-sm leading-6 text-white/65">Cards, passwords, documents and memories protected with a vault designed around you.</p></div><div className="flex items-center gap-3 text-sm text-white/65"><Sparkles className="h-4 w-4 text-[#e7b6ff]" /> Private by design, secure by default</div></div>
        </div>
        <div className="w-full p-5 sm:p-12 lg:p-14">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><img src="/secure-save-logo.png" alt="Secure Save" className="h-12 w-12 max-h-12 max-w-12 rounded-2xl object-cover" /><div><p className="eyebrow">Secure Save</p><p className="text-sm font-semibold">Personal digital vault</p></div></div>
          <p className="eyebrow">Welcome back</p><h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-bold">Unlock your vault</h2><p className="mt-2 text-sm text-[#9293b4]">Your private space is waiting for you.</p>
          {error && <p role="alert" className="mt-5 rounded-2xl border border-[#ff829a]/25 bg-[#ff829a]/10 p-3 text-sm text-[#ffb2c0]">{error}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9a7cff]/15 text-[#b39cff]"><LockKeyhole className="h-5 w-5" /></div><div className="min-w-0"><p className="text-[11px] text-[#777898]">Unlocking vault for</p><p className="truncate text-sm font-semibold text-white">{email || 'No email saved yet'}</p></div></div>
            <label className="block"><span className="mb-2 block text-xs font-semibold text-[#aaa8c8]">Vault PIN</span><span className="relative block"><input {...register('pin')} type={showPin ? 'text' : 'password'} inputMode="numeric" placeholder="••••••" maxLength={6} className="input-premium pr-12 tracking-[.4em]" /><button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9293b4]">{showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span>{errors.pin && <span className="mt-1 block text-xs text-[#ff829a]">{errors.pin.message}</span>}</label>
            <button disabled={isSubmitting || !email} className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Unlocking...' : 'Unlock vault'}<ArrowRight className="h-4 w-4" /></button>
          </form>
          <div className="mt-7 flex items-center justify-between text-xs"><Link to="/forgot-pin" className="font-semibold text-[#a88bff]">Forgot PIN?</Link><span className="flex items-center gap-1 text-[#777898]"><Fingerprint className="h-4 w-4" /> Biometric unlock soon</span></div>
          {!email && <p className="mt-5 rounded-2xl border border-[#ffbf69]/20 bg-[#ffbf69]/5 p-3 text-xs leading-5 text-[#e2bd91]">No email is saved on this device. Create your vault first to set up PIN unlock.</p>}
          <p className="mt-14 text-center text-sm text-[#9293b4]">New to Secure Save? <Link to="/register" className="font-bold text-[#a88bff]">Create your vault</Link></p>
        </div>
      </div>
    </div>
  );
};
