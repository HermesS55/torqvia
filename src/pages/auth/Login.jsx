import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useT } from '../../contexts/LangContext'
import AuthCard from '../../components/auth/AuthCard'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { checkRateLimit } from '../../lib/security'

export default function Login() {
  const { signIn } = useAuth()
  const t = useT()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      checkRateLimit(`login:${form.email}`, 5, 60_000)
    } catch (err) {
      setError(err.message)
      return
    }
    setLoading(true)
    try {
      await signIn(form)
      toast.success(t('auth.login.success'))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || t('auth.login.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <span>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300">
            {t('auth.login.create')}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.email')}</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className="input-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.password')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="input-base pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="text-right mt-1.5">
            <Link to="/forgot-password" className="text-xs text-zinc-500 hover:text-brand-400">
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <Spinner size="sm" /> : t('auth.login.submit')}
        </button>
      </form>
    </AuthCard>
  )
}
