import React from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getApiErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

type RecoveryStep = 'email' | 'otp' | 'pin';
type RecoveryForm = { email: string; otp: string; newPin: string; confirmPin: string };

export const ForgotPin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = (searchParams.get('email') || '').trim().toLowerCase();

  const [step, setStep] = React.useState<RecoveryStep>('email');
  const [email, setEmail] = React.useState(initialEmail);
  const [error, setError] = React.useState('');
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [showPin, setShowPin] = React.useState(false);
  const rememberEmail = useAuthStore((state) => state.rememberEmail);

  const { register, handleSubmit, formState: { isSubmitting }, watch } = useForm<RecoveryForm>({
    defaultValues: { email: initialEmail, otp: '', newPin: '', confirmPin: '' },
  });

  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const submit = async (data: RecoveryForm) => {
    setError('');

    try {
      if (step === 'email') {
        const normalizedEmail = data.email.trim().toLowerCase();
        await api.post('/auth/pin/forgot', { email: normalizedEmail });
        setEmail(normalizedEmail);
        rememberEmail(normalizedEmail);
        setStep('otp');
        setResendCooldown(60);
        return;
      }

      if (step === 'otp') {
        if (!/^\d{6}$/.test(data.otp.trim())) {
          setError('Enter the 6-digit verification code.');
          return;
        }
        setStep('pin');
        return;
      }

      if (!/^\d{6}$/.test(data.newPin)) {
        setError('New PIN must be exactly 6 numeric digits.');
        return;
      }

      if (data.newPin !== data.confirmPin) {
        setError('PINs do not match.');
        return;
      }

      await api.post('/auth/pin/reset', {
        email,
        otp: data.otp.trim(),
        newPin: data.newPin,
        confirmPin: data.confirmPin,
      });

      rememberEmail(email);
      navigate('/login');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to complete PIN reset.'));
    }
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await api.post('/auth/pin/forgot', { email });
      setResendCooldown(60);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to resend recovery code.'));
    }
  };

  const otpValue = watch('otp') || '';
  const newPinValue = watch('newPin') || '';
  const confirmPinValue = watch('confirmPin') || '';

  return (
    <div className="auth-shell app-shell">
      <main className="w-full max-w-[min(100%,30rem)] mx-auto">
        <div className="glass-surface p-[clamp(1.25rem,4vw,2.5rem)] w-full">
          {/* Header Branding */}
          <header className="flex items-center gap-3 mb-[clamp(1.5rem,3.5vw,2rem)]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-800/30 border border-violet-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/20 overflow-hidden">
              <img
                src="/logo.png"
                alt="Secure Save Shield"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="eyebrow">Vault Recovery</p>
              <h1 className="font-display font-bold text-lg tracking-tight text-vault-text truncate">
                Secure Save
              </h1>
            </div>
          </header>

          <div>
            <h2 className="title-section text-vault-text">
              {step === 'email' && 'Reset Login PIN'}
              {step === 'otp' && 'Check Your Email'}
              {step === 'pin' && 'Create New PIN'}
            </h2>
            <p className="text-xs sm:text-sm text-vault-muted mt-1.5 leading-relaxed">
              {step === 'email' && 'We will send a verification code to your registered email.'}
              {step === 'otp' && `Enter the 6-digit code sent to ${email}.`}
              {step === 'pin' && 'Choose a new 6-digit Login PIN for your vault.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 p-3.5 rounded-xl border border-vault-danger/30 bg-vault-danger/10 text-vault-danger flex items-start gap-2.5 text-xs sm:text-sm animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="flex-1 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
            {step === 'email' && (
              <div>
                <label htmlFor="rec-email" className="block text-xs font-semibold text-vault-muted mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-subtle pointer-events-none" />
                  <input
                    id="rec-email"
                    {...register('email', { required: true })}
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    disabled={isSubmitting}
                    className="input-vault pl-10"
                  />
                </div>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="rec-otp" className="block text-xs font-semibold text-vault-muted mb-1.5">
                    6-Digit Recovery Code
                  </label>
                  <input
                    id="rec-otp"
                    {...register('otp', { required: true })}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    disabled={isSubmitting}
                    className="input-vault text-center font-mono text-xl tracking-[0.5em] py-3.5"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-vault-muted">Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resendCooldown > 0}
                    className="font-semibold text-vault-accentLight hover:underline disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {step === 'pin' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="rec-pin" className="text-xs font-semibold text-vault-muted">
                      New 6-Digit PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-xs text-vault-accentLight flex items-center gap-1 hover:underline"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-subtle pointer-events-none" />
                    <input
                      id="rec-pin"
                      {...register('newPin', { required: true })}
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="••••••"
                      disabled={isSubmitting}
                      className="input-vault pl-10 font-mono tracking-[0.4em] text-center"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rec-confirm-pin" className="block text-xs font-semibold text-vault-muted mb-1.5">
                    Confirm New PIN
                  </label>
                  <input
                    id="rec-confirm-pin"
                    {...register('confirmPin', { required: true })}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    disabled={isSubmitting}
                    className="input-vault font-mono tracking-[0.4em] text-center"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                (step === 'otp' && otpValue.length !== 6) ||
                (step === 'pin' && (newPinValue.length !== 6 || confirmPinValue.length !== 6))
              }
              className="btn-primary w-full mt-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {step === 'email' && 'Send Recovery Code'}
                  {step === 'otp' && 'Verify Code'}
                  {step === 'pin' && 'Reset Login PIN'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-vault-borderSubtle text-center">
            <Link to="/login" className="text-xs font-bold text-vault-accentLight hover:underline">
              ← Return to Unlock
            </Link>
          </div>
        </div>

        <footer className="mt-6 text-center text-xs text-vault-subtle flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-vault-success" />
          <span>Encrypted Vault Security Preserved</span>
        </footer>
      </main>
    </div>
  );
};
