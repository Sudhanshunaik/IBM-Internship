import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate('/scenes', { replace: true });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await login({ email, password });
      else await register({ email, username, password });
      navigate('/scenes', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form onSubmit={onSubmit}>
        <h2 style={{ margin: 0, color: 'var(--accent)' }}>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
        {mode === 'register' && (
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <button type="submit" disabled={busy}>{busy ? '...' : (mode === 'login' ? 'Sign in' : 'Sign up')}</button>
        {error && <div style={{ color: 'salmon', fontSize: 12 }}>{error}</div>}
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}