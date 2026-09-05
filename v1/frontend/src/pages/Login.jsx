import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, confirm2fa } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.twoFactorRequired) {
        setTwoFactor(true);
        toast('Two-factor authentication required', { icon: '🛡️' });
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handle2fa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirm2fa(code);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
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
          <p className="text-sm text-gray-500">Collection Centre Management</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          {!twoFactor ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Welcome back</h2>
              <p className="text-sm text-gray-500 mb-6">Sign in to continue to your collection centre.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
                  {loading ? 'Signing in...' : 'Login →'}
                </button>
              </form>

              <p className="mt-3 text-center text-sm">
                <Link to="/forgot-password" className="text-brand-600 hover:text-brand-700 font-medium">Forgot password?</Link>
              </p>

              <p className="mt-4 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-medium">Sign up</Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Two-factor verification</h2>
              <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code from your authenticator app.</p>

              <form onSubmit={handle2fa} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">6-digit code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field text-center text-2xl tracking-widest"
                    placeholder="••••••"
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
                  {loading ? 'Verifying...' : 'Verify'}
                </button>

                <button
                  type="button"
                  onClick={() => { setTwoFactor(false); setCode(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ← Back to login
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
