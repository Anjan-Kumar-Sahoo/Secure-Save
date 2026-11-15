import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Shield, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api, { getApiErrorMessage } from '../../services/api';

const emailSchema = z.object({
  email: z.string().trim().min(1, 'Email address is required').email('Enter a valid email address'),
});

const pinSchema = z.object({
  pin: z.string().length(6, 'PIN must be exactly 6 digits').regex(/^\d{6}$/, 'PIN must contain only numbers'),
});

type EmailForm = z.infer<typeof emailSchema>;
type PinForm = z.infer<typeof pinSchema>;

type AuthScreenState = 'EMAIL_REQUIRED' | 'PIN_REQUIRED';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, rememberedEmail, rememberEmail, clearRememberedEmail } = useAuthStore();

  const [screenState, setScreenState] = React.useState<AuthScreenState>(
    rememberedEmail ? 'PIN_REQUIRED' : 'EMAIL_REQUIRED'
  );
  const [activeEmail, setActiveEmail] = React.useState<string>(rememberedEmail || '');
  const [showPin, setShowPin] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false);
  const [pendingRegistrationEmail, setPendingRegistrationEmail] = React.useState<string | null>(null);
  const [notFoundEmail, setNotFoundEmail] = React.useState<string | null>(null);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: rememberedEmail || '' },
  });

  const pinForm = useForm<PinForm>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: '' },
  });

  // Keep state synchronized if remembered email changes externally
  React.useEffect(() => {
    if (rememberedEmail) {
      setActiveEmail(rememberedEmail);
      setScreenState('PIN_REQUIRED');
    } else {
      setActiveEmail('');
      setScreenState('EMAIL_REQUIRED');
    }
  }, [rememberedEmail]);

  // Handle email lookup (State One -> State Two transition)
  const handleEmailSubmit = async (data: EmailForm) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    setErrorMessage('');
    setPendingRegistrationEmail(null);
    setNotFoundEmail(null);
    setIsCheckingEmail(true);

    try {
      const response = await api.post('/auth/session/lookup', { email: normalizedEmail });
      const status = response.data?.data?.status;

      if (status === 'active') {
        rememberEmail(normalizedEmail);
        setActiveEmail(normalizedEmail);
        setScreenState('PIN_REQUIRED');
        pinForm.reset({ pin: '' });
      } else if (status === 'pending') {
        setPendingRegistrationEmail(normalizedEmail);
        setErrorMessage('This vault registration is pending verification. Please complete verification with your OTP.');
      } else if (status === 'not_found') {
        setNotFoundEmail(normalizedEmail);
        setErrorMessage('No vault found for this email address.');
      } else {
        setErrorMessage('Unable to confirm account status. Please try again.');
      }
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, 'Unable to check vault status.'));
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Handle PIN unlock (State Two -> Dashboard)
  const handlePinSubmit = async (data: PinForm) => {
    if (!activeEmail) {
      setScreenState('EMAIL_REQUIRED');
      return;
    }

    setErrorMessage('');
    try {
      const response = await api.post('/auth/session/login', {
        email: activeEmail,
        pin: data.pin,
      });

      const token = response.data?.data?.token;
      if (token) {
        setAuth({ email: activeEmail }, token);
        navigate('/dashboard');
      } else {
        setErrorMessage('Authentication succeeded but session token was missing.');
      }
    } catch (err) {
      pinForm.setValue('pin', '');
      setErrorMessage(getApiErrorMessage(err, 'Unable to unlock your vault. Check your PIN and try again.'));
    }
  };

  // Safe Account Switching
  const handleSwitchAccount = () => {
    clearRememberedEmail();
    setActiveEmail('');
    setErrorMessage('');
    setPendingRegistrationEmail(null);
    setNotFoundEmail(null);
    emailForm.reset({ email: '' });
    pinForm.reset({ pin: '' });
    setScreenState('EMAIL_REQUIRED');
  };

  const pinValue = pinForm.watch('pin') || '';

  return (
    <div className="auth-shell app-shell">
      <main className="w-full max-w-[min(100%,30rem)] mx-auto">
        <div className="glass-surface p-[clamp(1.25rem,4vw,2.5rem)] w-full">
          {/* Header Branding: Always compact and strictly contained */}
          <header className="flex items-center gap-3 mb-[clamp(1.5rem,3.5vw,2rem)]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-800/30 border border-violet-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/20 overflow-hidden">
              <img
                src="/logo.png"
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

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl border border-vault-danger/30 bg-vault-danger/10 text-vault-danger flex items-start gap-2.5 text-xs sm:text-sm animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 leading-relaxed">
                <p>{errorMessage}</p>
                {notFoundEmail && (
                  <Link
                    to={`/register?email=${encodeURIComponent(notFoundEmail)}`}
                    className="inline-block mt-2 font-bold text-vault-accentLight hover:underline"
                  >
                    Create Your Vault Now →
                  </Link>
                )}
                {pendingRegistrationEmail && (
                  <Link
                    to={`/register?email=${encodeURIComponent(pendingRegistrationEmail)}&step=otp`}
                    className="inline-block mt-2 font-bold text-vault-accentLight hover:underline"
                  >
                    Enter Verification Code →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* STATE ONE: EMAIL REQUIRED */}
          {screenState === 'EMAIL_REQUIRED' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <p className="eyebrow mb-1">Welcome to Secure Save</p>
                <h2 className="title-section text-vault-text">
                  Unlock your safe place
                </h2>
                <p className="text-xs sm:text-sm text-vault-muted mt-1.5 leading-relaxed">
                  Your personal space for keeping important information safe and organized.
                </p>
              </div>

              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4 pt-2">
                <div>
                  <label htmlFor="vault-email" className="block text-xs font-semibold text-vault-muted mb-1.5">
                    Enter your email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-subtle pointer-events-none" />
                    <input
                      id="vault-email"
                      {...emailForm.register('email')}
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="name@example.com"
                      disabled={isCheckingEmail}
                      className="input-vault pl-10"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-xs text-vault-danger mt-1">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isCheckingEmail}
                  className="btn-primary w-full"
                >
                  {isCheckingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Checking Vault...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-vault-borderSubtle text-center">
                <p className="text-xs text-vault-muted">
                  New to Secure Save?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-vault-accentLight hover:text-white transition-colors"
                  >
                    Create Your Vault
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* STATE TWO: LOGIN PIN REQUIRED */}
          {screenState === 'PIN_REQUIRED' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <p className="eyebrow mb-1">Vault Locked</p>
                <h2 className="title-section text-vault-text">
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-vault-muted mt-1.5 leading-relaxed">
                  Your vault is ready. Enter your Login PIN to continue.
                </p>
              </div>

              {/* Account Badge with Switch Account Option */}
              <div className="p-3 rounded-xl bg-vault-surface/60 border border-vault-borderSubtle flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-vault-accentMuted flex items-center justify-center text-vault-accentLight shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-vault-subtle tracking-wider">Active Account</p>
                    <p className="text-xs sm:text-sm font-semibold text-vault-text truncate">{activeEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="text-xs font-semibold text-vault-accentLight hover:underline shrink-0"
                >
                  Switch
                </button>
              </div>

              <form onSubmit={pinForm.handleSubmit(handlePinSubmit)} className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="vault-pin" className="text-xs font-semibold text-vault-muted">
                      Login PIN
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
                      id="vault-pin"
                      {...pinForm.register('pin')}
                      type={showPin ? 'text' : 'password'}
                      autoComplete="current-password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="••••••"
                      disabled={pinForm.formState.isSubmitting}
                      className="input-vault pl-10 tracking-[0.4em] font-mono text-center text-base"
                    />
                  </div>
                  {pinForm.formState.errors.pin && (
                    <p className="text-xs text-vault-danger mt-1">
                      {pinForm.formState.errors.pin.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={pinValue.length !== 6 || pinForm.formState.isSubmitting}
                  className="btn-primary w-full"
                >
                  {pinForm.formState.isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Unlocking Vault...
                    </>
                  ) : (
                    <>
                      Unlock Vault
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-3 flex items-center justify-between text-xs border-t border-vault-borderSubtle">
                <Link
                  to={`/forgot-pin?email=${encodeURIComponent(activeEmail)}`}
                  className="font-semibold text-vault-accentLight hover:underline"
                >
                  Forgot Login PIN?
                </Link>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="text-vault-muted hover:text-vault-text transition-colors"
                >
                  Use another email
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Assurance Footer */}
        <footer className="mt-6 text-center text-xs text-vault-subtle flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-vault-success" />
          <span>AES-256 Client-Side Encrypted Digital Vault</span>
        </footer>
      </main>
    </div>
  );
};
