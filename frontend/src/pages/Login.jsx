import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { ArrowRight, LockKeyhole, Mail, Truck } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      console.error('Sign-in request failed', {
        status: err.response?.status ?? null,
        code: err.code ?? null
      })
      setError(err.response?.data?.error || err.message || 'Unable to sign in. Check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <section className="login-art" aria-label="Bharat Transport Company">
        <div className="login-orbit" aria-hidden="true" />
        <div className="login-lamp" aria-hidden="true"><span className="login-lamp-base" /></div>
        <div aria-hidden="true">
          <span className="login-firefly" />
          <span className="login-firefly" />
          <span className="login-firefly" />
          <span className="login-firefly" />
          <span className="login-firefly" />
          <span className="login-firefly" />
        </div>
        <div className="login-art-copy">
          <div className="login-brand-kicker">Connected routes. Clear journeys.</div>
          <h1>Moving Bharat,<br />one delivery at a time.</h1>
          <p>Operations, people, and freight in one dependable workspace for Bharat Transport Company.</p>
        </div>
      </section>

      <section className="login-form-side">
        <div className="login-card">
          <div className="login-card-brand">
            <div className="login-card-mark"><Truck size={20} strokeWidth={1.8} /></div>
            <div>
              <div className="login-card-brand-name">BHARAT TRANSPORT COMPANY</div>
              <div className="login-card-brand-subtitle">Transport Management System</div>
            </div>
          </div>

          <h2>Welcome Back</h2>
          <p className="login-card-subtitle">Enter your details to access your account.</p>

          {error && <div role="alert" className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="login-email">Email or username</label>
              <div className="login-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or username"
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>

          <p className="login-copyright">© 2026 Bharat Transport Company</p>
        </div>
      </section>
    </div>
  )
}
