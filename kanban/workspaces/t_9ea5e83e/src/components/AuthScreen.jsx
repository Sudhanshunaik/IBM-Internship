import { useEffect, useState } from 'react'
import { useStore } from '../state/store.js'

/**
 * Login + register card. Calls the zustand store which dispatches the REST
 * request and persists the resulting token.
 */
export function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('demo@orbital.dev')
  const [password, setPassword] = useState('demo1234')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const login = useStore((s) => s.login)
  const register = useStore((s) => s.register)
  const authError = useStore((s) => s.authError)

  useEffect(() => {
    setError(authError)
  }, [authError])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result =
      mode === 'login'
        ? await login(email, password)
        : await register(email, password, name || email.split('@')[0])
    setSubmitting(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__brand-mark" aria-hidden="true" />
          <span>Orbital</span>
        </div>

        <h1 className="auth-card__title">
          {mode === 'login' ? 'Sign in to your surface' : 'Create an account'}
        </h1>
        <p className="auth-card__subtitle">
          {mode === 'login'
            ? 'Authenticate to access the live 3D data stream.'
            : 'Pick a name and we’ll set up your visualization workspace.'}
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === 'register' && (
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="name">
                Display name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                placeholder="Ada Lovelace"
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder="you@company.com"
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
            style={{ marginTop: 4 }}
          >
            {submitting
              ? mode === 'login'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        {error && <div className="auth-card__error">{error}</div>}

        <div className="auth-card__footer">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setMode('register')
                  setError(null)
                }}
              >
                Register
              </a>
            </>
          ) : (
            <>
              Already have one?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setMode('login')
                  setError(null)
                }}
              >
                Sign in
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}