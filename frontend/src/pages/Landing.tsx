import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Brain, GitBranch, FileSearch, BarChart3, Activity } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI Investigation', desc: 'LLM-powered analysis reconstructs attack timelines with evidence-backed conclusions' },
  { icon: GitBranch, title: 'Attack Graph', desc: 'Visual relationship mapping of systems, users, processes, and attack paths' },
  { icon: FileSearch, title: 'Log Parser', desc: 'Parse EVTX, Sysmon, CSV, JSON, Apache, and Firewall logs into unified schema' },
  { icon: BarChart3, title: 'Interactive Timeline', desc: 'Zoomable, filterable timeline with severity-colored events' },
  { icon: Activity, title: 'MITRE Mapping', desc: 'Automatic MITRE ATT&CK technique identification and mapping' },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-cyber-950 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-30" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-neon-blue" />
          <span className="text-xl font-bold text-gradient">CyberLens</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-300 hover:text-white transition-colors px-4 py-2">
            Login
          </Link>
          <Link to="/register" className="btn-cyber-primary text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-sm mb-8">
              <Activity className="w-4 h-4" />
              <span>AI-Powered Security Investigation Platform</span>
            </div>
            <h1 className="text-6xl font-bold leading-tight mb-6">
              Reconstruct Cyber Attacks
              <br />
              <span className="text-gradient">with AI Precision</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your security logs. CyberLens AI reconstructs the complete attack timeline,
              identifies every technique, and provides evidence-backed conclusions.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register" className="btn-cyber-primary text-lg px-8 py-4">
                Start Investigation
              </Link>
              <Link to="/login" className="btn-cyber-secondary text-lg px-8 py-4">
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
        >
          <div className="glass-panel p-8 text-center">
            <p className="text-4xl font-bold text-gradient mb-2">10+</p>
            <p className="text-gray-400">Log Formats Supported</p>
          </div>
          <div className="glass-panel p-8 text-center">
            <p className="text-4xl font-bold text-gradient mb-2">MITRE</p>
            <p className="text-gray-400">ATT&CK Framework Mapped</p>
          </div>
          <div className="glass-panel p-8 text-center">
            <p className="text-4xl font-bold text-gradient mb-2">100%</p>
            <p className="text-gray-400">Evidence-Backed Analysis</p>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">Core Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card-hover p-8"
            >
              <feature.icon className="w-10 h-10 text-neon-blue mb-4" />
              <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-gray-500 text-sm">
        <p>CyberLens v1.0 — AI-Powered Cyber Security Investigation Platform</p>
      </footer>
    </div>
  )
}
