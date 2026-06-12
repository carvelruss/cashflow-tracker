import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

type Step = 'request' | 'confirm';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError('');
    try {
      const res = await api.auth.resetPassword(email);
      setMessage(res.message);
      if (res.token) setResetToken(res.token); // Personal use: token in response
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally { setLoading(false); }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.auth.resetPasswordConfirm({ token, password });
      setMessage(res.message);
      setStep('request');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">₱</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}
          {message && <Alert variant="success" className="mb-4">{message}</Alert>}

          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              <Button type="submit" className="w-full" loading={loading}>Send Reset Token</Button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              {resetToken && (
                <Alert variant="info">
                  <p className="font-medium">Your reset token:</p>
                  <code className="text-xs break-all mt-1 block">{resetToken}</code>
                  <p className="text-xs mt-1">Copy this token and paste it below.</p>
                </Alert>
              )}
              <Input label="Reset Token" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste your reset token" required />
              <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
              <Input label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required />
              <Button type="submit" className="w-full" loading={loading}>Reset Password</Button>
              <button type="button" onClick={() => setStep('request')} className="w-full text-sm text-slate-500 hover:text-slate-700">
                ← Back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/login" className="text-primary-600 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
