import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mail, Lock, User, ArrowRight, 
  ShieldCheck, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Logo } from './Logo';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
  title?: string;
  description?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  title,
  description
}) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Live Email Checker State
  const [emailChecking, setEmailChecking] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'invalid_format' | 'available' | 'in_use' | 'not_found'>('idle');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const checkTimeoutRef = useRef<any>(null);

  // Email format regex
  const isValidEmail = (val: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim());
  };

  // Debounced email check against database
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailStatus('idle');
      setEmailMessage('');
      setEmailChecking(false);
      return;
    }

    if (!isValidEmail(trimmed)) {
      setEmailStatus('invalid_format');
      setEmailMessage('Please enter a valid email address (e.g. name@example.com)');
      setEmailChecking(false);
      return;
    }

    setEmailChecking(true);
    setEmailStatus('idle');

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        
        if (data.exists) {
          setEmailStatus('in_use');
          setEmailMessage('This email is already in use.');
        } else {
          setEmailStatus(isSignUp ? 'available' : 'not_found');
          setEmailMessage(isSignUp ? 'Email is available to register.' : 'No account found with this email.');
        }
      } catch (e) {
        setEmailStatus('idle');
        setEmailMessage('');
      } finally {
        setEmailChecking(false);
      }
    }, 350);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [email, isSignUp]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address format (e.g. name@domain.com)');
      return;
    }

    if (isSignUp && emailStatus === 'in_use') {
      setError('This email is already registered. Please log in instead or use another email.');
      return;
    }

    setIsLoading(true);

    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
    const payload = isSignUp ? { email: trimmedEmail, password, name } : { email: trimmedEmail, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.user) {
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#212121] border border-[#2F2F2F] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2F2F2F] flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {title || (isSignUp ? 'Create your account' : 'Welcome back')}
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              {description || (isSignUp 
                ? 'Sign up with your email to start chatting and generating live web applications.' 
                : 'Log in with your email to access your conversations and history.')}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-[#171717] border border-[#2F2F2F] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#E4E4E7] placeholder-[#71717A] focus:outline-none focus:border-white font-sans transition-colors"
                  />
                  <User className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Email Address</label>
                {emailChecking && (
                  <span className="text-[10px] text-[#A1A1AA] flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Checking...
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full bg-[#171717] border rounded-xl pl-9 pr-8 py-2.5 text-xs text-[#E4E4E7] placeholder-[#71717A] focus:outline-none font-sans transition-colors ${
                    emailStatus === 'available' ? 'border-emerald-500/50 focus:border-emerald-400' :
                    emailStatus === 'in_use' && isSignUp ? 'border-amber-500/60 focus:border-amber-400' :
                    emailStatus === 'invalid_format' ? 'border-rose-500/50 focus:border-rose-400' :
                    'border-[#2F2F2F] focus:border-white'
                  }`}
                />
                <Mail className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                
                {/* Status Indicator Icon in Input */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailStatus === 'available' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {emailStatus === 'in_use' && isSignUp && (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              </div>

              {/* Email Checker Status Banner / Help */}
              {emailStatus === 'invalid_format' && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Invalid email format. E.g. name@domain.com</span>
                </p>
              )}

              {isSignUp && emailStatus === 'in_use' && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0 text-amber-400" />
                    This email is already in use.
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(''); }}
                    className="text-white hover:underline font-semibold text-[10px] ml-2"
                  >
                    Log In →
                  </button>
                </div>
              )}

              {isSignUp && emailStatus === 'available' && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Email is valid and available</span>
                </p>
              )}

              {!isSignUp && emailStatus === 'not_found' && (
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0 text-indigo-400" />
                    No account with this email.
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setError(''); }}
                    className="text-white hover:underline font-semibold text-[10px] ml-2"
                  >
                    Sign Up →
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#171717] border border-[#2F2F2F] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#E4E4E7] placeholder-[#71717A] focus:outline-none focus:border-white font-sans transition-colors"
                />
                <Lock className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {isSignUp && (
                <p className="text-[10px] text-[#71717A]">Must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || (isSignUp && emailStatus === 'in_use')}
              className="w-full py-2.5 px-4 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md mt-3 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Please wait...</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Sign Up' : 'Log In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="pt-2 text-center border-t border-[#2F2F2F] text-xs text-[#A1A1AA]">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(''); }}
                  className="text-white hover:underline font-semibold ml-1"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className="text-white hover:underline font-semibold ml-1"
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#171717] border-t border-[#2F2F2F] flex items-center justify-center gap-1.5 text-[10px] text-[#71717A]">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Secure encrypted authentication</span>
        </div>
      </div>
    </div>
  );
};
