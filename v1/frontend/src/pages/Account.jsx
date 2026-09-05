import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Mail, Phone, ShieldCheck, Lock, Save, KeyRound, RefreshCw } from 'lucide-react';
import { authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { refreshUser, setAuthData } = useAuth();

  const [profile, setProfile] = useState({ name: '', email: '', phone: '', role: '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', code: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpHint, setOtpHint] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailHint, setEmailHint] = useState('');

  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneHint, setPhoneHint] = useState('');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFaSetup, setTwoFaSetup] = useState(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  useEffect(() => {
    authAPI.me().then(async (res) => {
      const u = res.data;
      setProfile({ name: u.name, email: u.email, phone: u.phone || '', role: u.role });
      setEmailVerifying(!u.emailVerified);
      setPhoneVerifying(!u.phoneVerified);
      setTwoFactorEnabled(!!u.twoFactorEnabled);
    }).catch(() => {});
  }, []);

  async function saveProfile() {
    try {
      const res = await authAPI.updateProfile({ name: profile.name, phone: profile.phone, email: profile.email });
      const data = res.data;
      if (data.token) setAuthData(data);
      toast.success('Profile updated');
      await refreshUser();
      const emailChanged = data.email && data.email !== profile.email;
      if (emailChanged || data.emailVerified === false) {
        setEmailVerifying(true);
        toast('Re-verify the new email — a code will be sent to confirm it', { icon: '✉️' });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update profile');
    }
  }

  async function changePassword() {
    setPwdSaving(true);
    try {
      await authAPI.changePassword(pwd);
      toast.success('Password changed');
      setPwd({ currentPassword: '', newPassword: '', code: '' });
      setOtpSent(false);
      setOtpHint('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not change password');
    } finally {
      setPwdSaving(false);
    }
  }

  async function sendPasswordOtp() {
    setOtpSending(true);
    try {
      const res = await authAPI.sendPasswordOtp();
      setOtpSent(true);
      if (res.data.sent === false) {
        toast.error(res.data.message || 'Could not send the OTP');
        if (res.data.demoCode) setOtpHint(`Delivery unavailable — your code is: ${res.data.demoCode}`);
      } else if (res.data.demoCode) {
        setOtpHint(`Demo mode — your code is: ${res.data.demoCode}`);
      } else {
        toast.success('OTP sent — check your email inbox');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not send OTP');
    } finally {
      setOtpSending(false);
    }
  }

  async function sendEmailCode() {
    setEmailSending(true);
    try {
      const res = await authAPI.sendEmailCode();
      setEmailSent(true);
      if (res.data.sent === false) {
        toast.error(res.data.message || 'Could not send the code');
        if (res.data.demoCode) setEmailHint(`Delivery unavailable — your code is: ${res.data.demoCode}`);
      } else if (res.data.demoCode) {
        setEmailHint(`Demo mode — your code is: ${res.data.demoCode}`);
      } else {
        toast.success('Verification code sent — check your email inbox');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not send code');
    } finally {
      setEmailSending(false);
    }
  }

  async function confirmEmail() {
    try {
      await authAPI.confirmEmail(emailCode);
      toast.success('Email verified');
      setEmailVerifying(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid code');
    }
  }

  async function sendPhoneCode() {
    setPhoneSending(true);
    try {
      const res = await authAPI.sendPhoneCode();
      setPhoneSent(true);
      if (res.data.mode === 'manual' || res.data.demoCode) {
        const hint = res.data.demoCode
          ? `Manual mode — enter the code shown to a supervisor: ${res.data.demoCode}`
          : 'Manual verification mode — a supervisor can verify your phone from the User module';
        setPhoneHint(hint);
        toast('Manual/SMS mode active', { icon: '📱' });
      } else {
        toast.success('OTP sent — check your phone SMS');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not send code');
    } finally {
      setPhoneSending(false);
    }
  }

  async function confirmPhone() {
    try {
      await authAPI.confirmPhone(phoneCode);
      toast.success('Phone verified');
      setPhoneVerifying(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid code');
    }
  }

  async function start2faSetup() {
    try {
      const res = await authAPI.get2faSetup();
      setTwoFaSetup(res.data);
      toast.success('Scan the QR code with Google Authenticator');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not start 2FA setup');
    }
  }

  async function enable2fa() {
    setTwoFaBusy(true);
    try {
      await authAPI.enable2fa(twoFaCode);
      setTwoFactorEnabled(true);
      setTwoFaSetup(null);
      setTwoFaCode('');
      toast.success('Two-factor authentication enabled');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid code');
    } finally {
      setTwoFaBusy(false);
    }
  }

  async function disable2fa() {
    setTwoFaBusy(true);
    try {
      await authAPI.disable2fa(twoFaCode);
      setTwoFactorEnabled(false);
      setTwoFaCode('');
      toast.success('Two-factor authentication disabled');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid code');
    } finally {
      setTwoFaBusy(false);
    }
  }

  const Field = ({ children }) => <div className="mb-4">{children}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg"><Mail size={18} /></span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Profile</h2>
          </div>
          <Field>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full name</label>
            <input className="input-field" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </Field>
          <Field>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input className="input-field" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="you@example.com" />
          </Field>
          <Field>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input className="input-field" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 ..." />
          </Field>
          <button onClick={saveProfile} className="btn-primary inline-flex items-center gap-2"><Save size={16} /> Save changes</button>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={18} className="text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Change password</h2>
          </div>
          <Field>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current password</label>
            <input type="password" className="input-field" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          </Field>
          <Field>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New password</label>
            <input type="password" className="input-field" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          </Field>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email OTP</label>
            {!otpSent ? (
              <button onClick={sendPasswordOtp} disabled={otpSending} className="btn-secondary w-full">
                {otpSending ? 'Sending...' : 'Send OTP to my email'}
              </button>
            ) : (
              <div className="flex gap-2">
                <input className="input-field text-center tracking-widest" value={pwd.code} onChange={(e) => setPwd({ ...pwd, code: e.target.value })} placeholder="••••••" />
                <button onClick={sendPasswordOtp} disabled={otpSending} className="btn-secondary whitespace-nowrap" title="Resend code">⟳</button>
              </div>
            )}
            {otpHint && <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">{otpHint}</p>}
          </div>
          <button onClick={changePassword} disabled={pwdSaving || !otpSent || !pwd.code} className="btn-primary inline-flex items-center gap-2">
            <KeyRound size={16} /> {pwdSaving ? 'Updating...' : 'Update password with OTP'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={18} className="text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Email verification</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            {emailVerifying ? 'Your email is not yet verified.' : <span className="pill-green">Verified</span>}
          </p>
          {emailVerifying && !emailSent && (
            <button onClick={sendEmailCode} disabled={emailSending} className="btn-secondary w-full">
              {emailSending ? 'Sending...' : 'Send verification code'}
            </button>
          )}
          {emailHint && <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">{emailHint}</p>}
          {emailVerifying && emailSent && (
            <div className="flex gap-2">
              <input className="input-field text-center tracking-widest" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} placeholder="••••••" />
              <button onClick={confirmEmail} className="btn-primary whitespace-nowrap">Verify</button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={18} className="text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Phone verification</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            {phoneVerifying ? 'Your phone is not yet verified.' : <span className="pill-green">Verified</span>}
          </p>
          {phoneVerifying && !phoneSent && (
            <button onClick={sendPhoneCode} disabled={phoneSending} className="btn-secondary w-full">
              {phoneSending ? 'Sending...' : 'Send verification code'}
            </button>
          )}
          {phoneHint && <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">{phoneHint}</p>}
          {phoneVerifying && phoneSent && (
            <div className="flex gap-2">
              <input className="input-field text-center tracking-widest" value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} placeholder="••••••" />
              <button onClick={confirmPhone} className="btn-primary whitespace-nowrap">Verify</button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Two-factor authentication</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            {twoFactorEnabled ? <span className="pill-green">2FA enabled</span> : <span className="pill-gray">2FA disabled</span>}
          </p>

          {!twoFactorEnabled && !twoFaSetup && (
            <button onClick={start2faSetup} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
              <RefreshCw size={16} /> Set up Google Authenticator
            </button>
          )}

          {twoFaSetup && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Scan this QR code in the Google Authenticator app, then enter the 6-digit code.</p>
              <div className="bg-white p-3 rounded-lg border border-gray-200 inline-block mb-3">
                <QRCodeSVG value={twoFaSetup.otpauthUrl} size={160} />
              </div>
              <p className="text-xs text-gray-500 mb-2 break-all">Secret: <code className="font-mono">{twoFaSetup.secret}</code></p>
              <div className="flex gap-2">
                <input className="input-field text-center tracking-widest" value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" />
                <button onClick={enable2fa} disabled={twoFaBusy} className="btn-primary whitespace-nowrap">Enable</button>
              </div>
            </div>
          )}

          {twoFactorEnabled && (
            <div>
              <p className="text-xs text-gray-500 mb-2">To disable, enter the current code from your authenticator app.</p>
              <div className="flex gap-2">
                <input className="input-field text-center tracking-widest" value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" />
                <button onClick={disable2fa} disabled={twoFaBusy} className="btn-danger whitespace-nowrap">Disable</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}