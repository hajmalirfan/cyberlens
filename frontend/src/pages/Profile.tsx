import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Shield, Calendar, Mail, Edit2, Save, Camera } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useStore } from '@/store/useStore'

export function Profile() {
  const { user } = useStore()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')

  if (!user) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <GlassCard className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                {(user.full_name || user.username).charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-2 right-0 p-1.5 rounded-full bg-cyber-800 border border-white/10 text-gray-400 hover:text-white transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold">{user.full_name || user.username}</h2>
            <p className="text-sm text-gray-500 font-mono uppercase">@{user.username}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-mono uppercase">
              <Shield className="w-3 h-3" />
              {user.role}
            </div>
          </GlassCard>
        </div>

        <div className="md:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Account Details</h3>
              <button
                onClick={() => setEditing(!editing)}
                className="btn-cyber-secondary text-sm"
              >
                {editing ? (
                  <><Save className="w-4 h-4 inline mr-2" />Save</>
                ) : (
                  <><Edit2 className="w-4 h-4 inline mr-2" />Edit</>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-cyber w-full"
                  />
                ) : (
                  <p className="text-white">{user.full_name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-cyber w-full"
                  />
                ) : (
                  <p className="text-white">{user.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <p className="text-white font-mono">@{user.username}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                <p className="text-white font-mono uppercase">{user.role}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Member Since</label>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
