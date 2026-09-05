import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, KeyRound, ChevronLeft } from 'lucide-react';
import { authAPI } from '../api/client';

export default function ForgotPassword() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoHint, setDemoHint] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      if (res.data.sent === false) {
        toast.error(res.data.message || 'Could not send the reset code');
        if (res.data.demoCode) setDemoHint(`Delivery unavailable — your code is: ${res.data.demoCode}`);
      } else if (res.data.demoCode) {
        setDemoHint(`Demo mode — your code is: ${res.data.demoCode}`);
      } else {
        toast.success('Reset code sent — check your email inbox');
      }
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No account found for this email');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, code, newPassword });
      toast.success('Password reset — sign in with your new password');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🍃</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">TeaLeafLedger</h1>
          <p className="text-sm text-gray-500">Reset your password</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          {step === 'email' ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Mail size={18} className="text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Forgot password?</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">Enter your account email and we'll send you a reset code.</p>
              <form onSubmit={sendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
                  {loading ? 'Sending code...' : 'Send reset code'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-500">
                <Link to="/login" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium">
                  <ChevronLeft size={14} /> Back to sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound size={18} className="text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Enter reset code</h2>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                A 6-digit code was sent to {email}. Enter it with your new password.
              </p>
              {demoHint && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">{demoHint}</p>
              )}
              <form onSubmit={resetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">6-digit code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field text-center text-2xl tracking-widest"
                    placeholder="••••••"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    placeholder="At least 6 characters"
                    minLength="6"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Re-enter your password"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ← Change email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">© 2026 TeaLeafLedger · Kamalesh Sivaraj</p>
      </div>
    </div>
  );
}