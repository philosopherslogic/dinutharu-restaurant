'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { claimGuestOrders, getSavedCustomerProfile } from '@/lib/customerIdentity';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let authUserId: string | null = null;
      const savedProfile = getSavedCustomerProfile();

      if (isSignUp) {
        // Creates account and logs in immediately
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: fullName,
              phone: savedProfile?.phone || undefined,
              address: savedProfile?.address || undefined,
            },
          },
        });

        if (error) throw error;

        authUserId = data.user?.id || null;

        // Fallback sign-in if automatic login session didn't trigger instantly
        if (!data.session) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInErr) throw signInErr;
          authUserId = signInData.user?.id || authUserId;
        }

        alert('Account created and signed in successfully!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        authUserId = data.user?.id || null;
      }

      // Claim all prior guest orders and attach them to this user's account
      if (authUserId) {
        await claimGuestOrders(authUserId, savedProfile?.phone);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-[#292929] rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
              className={`text-sm font-black uppercase transition-all ${!isSignUp ? 'text-[#ffbd18] border-b-2 border-[#ffbd18] pb-1' : 'text-gray-400'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
              className={`text-sm font-black uppercase transition-all ${isSignUp ? 'text-[#ffbd18] border-b-2 border-[#ffbd18] pb-1' : 'text-gray-400'}`}
            >
              Register
            </button>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ruwan Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          {errorMsg && <p className="text-xs text-red-400 font-semibold">{errorMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}