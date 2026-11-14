import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, KeyRound, Mail, Shield, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getApiErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const registerSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  otp: z.string().optional(),
  pin: z.string().optional(),
  confirmPin: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = (searchParams.get('email') || '').trim().toLowerCase();
  const initialStep = searchParams.get('step') === 'otp' && initialEmail ? 'otp' : 'email';

  const [step, setStep] = React.useState<'email' | 'otp' | 'pin'>(initialStep);
  const [email, setEmail] = React.useState(initialEmail);
  const [error, setError] = React.useState('');
  const [isResending, setIsResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [showPin, setShowPin] = React.useState(false);

  const rememberEmail = useAuthStore((state) => state.rememberEmail);

  const { register, handleSubmit, formState: { isSubmitting }, watch, reset, setError: setFieldError } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: initialEmail, otp: '', pin: '', confirmPin: '' },
  });

  // Handle countdown timer for resend
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onSubmit = async (data: RegisterFormData) => {
    setError('');

    try {
      if (step === 'email') {
        const normalizedEmail = data.email.trim().toLowerCase();
        await api.post('/auth/register', { email: normalizedEmail });
        setEmail(normalizedEmail);
        rememberEmail(normalizedEmail);
        setStep('otp');
        setResendCooldown(60);
        return;
      }

      if (step === 'otp') {
        const otpValue = (data.otp || '').trim();
        if (!/^\d{6}$/.test(otpValue)) {
          setError('Verification code must be exactly 6 digits.');
          return;
        }

        await api.post('/auth/otp/verify', { email, otp: otpValue });
        setStep('pin');
        return;
      }

      // Step: PIN setup
      const pin = data.pin || '';
      const confirmPin = data.confirmPin || '';

      if (!/^\d{6}$/.test(pin)) {
        setError('PIN must be exactly 6 numeric digits.');
        return;
      }

      if (pin !== confirmPin) {
        setError('PINs do not match.');
        return;
      }

      await api.post('/auth/pin/complete-registration', {
        email,
        pin,
        confirmPin,
      });

      // Remember email so returning to login lands on PIN state
      rememberEmail(email);
      navigate('/login');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Registration process could not be completed.'));
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setError('');
    setIsResending(true);
    try {
      await api.post('/auth/otp/send', { email });
      setResendCooldown(60);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to resend verification code. Please wait.'));
    } finally {
      setIsResending(false);
    }
  };

  const otpValue = watch('otp') || '';
  const pinValue = watch('pin') || '';
  const confirmPinValue = watch('confirmPin') || '';

  return (
    <div className="auth-shell app-shell">
      <main className="w-full max-w-[min(100%,30rem)] mx-auto">
        <div className="glass-surface p-[clamp(1.25rem,4vw,2.5rem)] w-full">
          {/* Header Branding */}
          <header className="flex items-center gap-3 mb-[clamp(1.5rem,3.5vw,2rem)]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-800/30 border border-violet-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/20 overflow-hidden">
              <img
                src="/secure-save-logo.png"
                alt="Secure Save Shield"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="eyebrow">Personal Vault</p>
              <h1 className="font-display font-bold text-lg tracking-tight text-vault-text truncate">
                Secure Save
              </h1>
            </div>
          </header>

          {/* Step Indicator */}
          <div className="flex items-center justify-between gap-2 mb-6 text-xs">
            <div className={`flex items-center gap-1.5 font-semibold ${step === 'email' ? 'text-vault-accentLight' : 'text-vault-success'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'email' ? 'bg-vault-accent text-white' : 'bg-vault-success/20 text-vault-success'}`}>
                {step !== 'email' ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span>Email</span>
            </div>
            <div className="h-[1px] flex-1 bg-vault-borderSubtle" />
            <div className={`flex items-center gap-1.5 font-semibold ${step === 'otp' ? 'text-vault-accentLight' : step === 'pin' ? 'text-vault-success' : 'text-vault-subtle'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'otp' ? 'bg-vault-accent text-white' : step === 'pin' ? 'bg-vault-success/20 text-vault-success' : 'bg-vault-surface text-vault-subtle'}`}>
                {step === 'pin' ? <Check className="w-3 h-3" /> : '2'}
              </span>
              <span>Verify</span>
            </div>
            <div className="h-[1px] flex-1 bg-vault-borderSubtle" />
            <div className={`flex items-center gap-1.5 font-semibold ${step === 'pin' ? 'text-vault-accentLight' : 'text-vault-subtle'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'pin' ? 'bg-vault-accent text-white' : 'bg-vault-surface text-vault-subtle'}`}>
                3
              </span>
              <span>PIN</span>
            </div>
          </div>

          {/* Title Area */}
          <div>
            <h2 className="title-section text-vault-text">
              {step === 'email' && 'Create Your Vault'}
              {step === 'otp' && 'Verify Your Email'}
              {step === 'pin' && 'Set Your Login PIN'}
            </h2>
            <p className="text-xs sm:text-sm text-vault-muted mt-1.5 leading-relaxed">
              {step === 'email' && 'Begin your secure digital vault in seconds.'}
              {step === 'otp' && `Enter the 6-digit code sent to ${email}.`}
              {step === 'pin' && 'Choose a 6-digit PIN to securely unlock your vault.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mt-4 p-3.5 rounded-xl border border-vault-danger/30 bg-vault-danger/10 text-vault-danger flex items-start gap-2.5 text-xs sm:text-sm animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="flex-1 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            {step === 'email' && (
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-vault-muted mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-subtle pointer-events-none" />
                  <input
                    id="reg-email"
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
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
                  <label htmlFor="reg-otp" className="block text-xs font-semibold text-vault-muted mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="reg-otp"
                    {...register('otp')}
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
                    onClick={resendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className="font-semibold text-vault-accentLight hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {step === 'pin' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="reg-pin" className="text-xs font-semibold text-vault-muted">
                      6-Digit Vault PIN
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
                      id="reg-pin"
                      {...register('pin')}
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
                  <label htmlFor="reg-confirm-pin" className="block text-xs font-semibold text-vault-muted mb-1.5">
                    Confirm 6-Digit Vault PIN
                  </label>
                  <input
                    id="reg-confirm-pin"
                    {...register('confirmPin')}
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
                (step === 'pin' && (pinValue.length !== 6 || confirmPinValue.length !== 6))
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
                  {step === 'email' && 'Send Verification Code'}
                  {step === 'otp' && 'Verify Code'}
                  {step === 'pin' && 'Create My Vault'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-vault-borderSubtle text-center">
            <p className="text-xs text-vault-muted">
              Already have a vault?{' '}
              <Link to="/login" className="font-bold text-vault-accentLight hover:underline">
                Unlock It
              </Link>
            </p>
          </div>
        </div>

        <footer className="mt-6 text-center text-xs text-vault-subtle flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-vault-success" />
          <span>Client-Side AES-256 GCM Protected</span>
        </footer>
      </main>
    </div>
  );
};
