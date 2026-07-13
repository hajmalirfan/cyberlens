import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Bell, Shield, Globe, Eye, EyeOff, Key, RefreshCw } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useStore } from '@/store/useStore'

export function Settings() {
  const { theme, setTheme } = useStore()
  const [notifications, setNotifications] = useState(true)
  const [autoInvestigate, setAutoInvestigate] = useState(true)
  const [llmEndpoint, setLlmEndpoint] = useState('http://localhost:11434')
  const [llmModel, setLlmModel] = useState('cyberlens')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure platform preferences</p>
      </div>

      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-neon-blue" />
          General Settings
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-gray-500">Toggle dark/light theme</p>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-neon-blue' : 'bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-gray-500">Receive investigation alerts</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications ? 'bg-neon-cyan' : 'bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto Investigate</p>
              <p className="text-sm text-gray-500">Automatically run AI investigation on new uploads</p>
            </div>
            <button
              onClick={() => setAutoInvestigate(!autoInvestigate)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoInvestigate ? 'bg-neon-cyan' : 'bg-gray-600'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                autoInvestigate ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-neon-purple" />
          AI Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">LLM Endpoint</label>
            <input
              type="text"
              value={llmEndpoint}
              onChange={(e) => setLlmEndpoint(e.target.value)}
              className="input-cyber w-full"
              placeholder="http://localhost:11434"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Model Name</label>
            <input
              type="text"
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="input-cyber w-full"
              placeholder="cyberlens"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-neon-amber" />
          API Keys
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">OpenAI API Key</label>
            <div className="relative">
              <input
                type="password"
                className="input-cyber w-full pr-10"
                placeholder="sk-..."
                defaultValue=""
              />
              <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-cyber-primary">
          {saved ? (
            <><RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />Saved</>
          ) : (
            <><Save className="w-4 h-4 inline mr-2" />Save Settings</>
          )}
        </button>
      </div>
    </div>
  )
}
