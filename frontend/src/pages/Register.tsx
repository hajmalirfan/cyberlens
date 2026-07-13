import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { api } from '@/services/api'
import { useStore } from '@/store/useStore'

export function Register() {
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser, setToken } = useStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const data = await api.register(form.email, form.username, form.password, form.full_name)
      setToken(data.access_token)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cyber-950 hex-grid-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-neon-blue mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gradient">CyberLens</h1>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel p-8 space-y-5">
          <h2 className="text-xl font-semibold text-center">Register</h2>

          {error && (
            <div className="p-3 rounded-lg bg-neon-red/10 border border-neon-red/30 text-neon-red text-sm">{error}</div>
          )}

          {[
            { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Optional' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@company.com', required: true },
            { label: 'Username', key: 'username', type: 'text', placeholder: 'Choose a username', required: true },
            { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 8 characters', required: true },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-400 mb-2">{field.label}</label>
              <input
                type={field.type}
                value={(form as any)[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="input-cyber w-full"
                placeholder={field.placeholder}
                required={field.required}
              />
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-cyber-primary w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-neon-blue hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
