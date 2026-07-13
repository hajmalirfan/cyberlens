import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, AlertCircle, Loader2, Clock, FileText } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { api } from '@/services/api'
import { useStore } from '@/store/useStore'
import { ChatMessage, Investigation, EvidenceItem } from '@/types'

export function Chat() {
  const { projects } = useStore()
  const [selectedInvestigation, setSelectedInvestigation] = useState<number | null>(null)
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projects.length > 0) {
      loadInvestigations(projects[0].id)
    }
  }, [projects])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadInvestigations = async (projectId: number) => {
    try {
      const data = await api.listInvestigations(projectId)
      setInvestigations(data.filter((i: Investigation) => i.status === 'completed'))
    } catch (err) {
      console.error('Failed to load investigations')
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedInvestigation || loading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await api.chatWithAI(selectedInvestigation, input)
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        confidence: response.confidence,
        evidence: response.evidence,
        timestamp: response.timestamp || new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investigation Chat</h1>
          <p className="text-gray-400 text-sm mt-1">Ask questions about your investigation</p>
        </div>
        <select
          value={selectedInvestigation || ''}
          onChange={(e) => {
            setSelectedInvestigation(parseInt(e.target.value))
            setMessages([])
          }}
          className="input-cyber text-sm"
        >
          <option value="">Select investigation...</option>
          {investigations.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.title} ({inv.attack_type || 'Pending'})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        <div className="lg:col-span-3 flex flex-col h-full">
          <GlassCard className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bot className="w-16 h-16 mb-4 text-gray-600" />
                  <h3 className="text-lg font-medium mb-2">Investigation Chat</h3>
                  <p className="text-sm text-center max-w-md">
                    Ask questions about the investigation. For example:
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      'How did the attacker enter?',
                      'What systems were affected?',
                      'What is the attack timeline?',
                      'What evidence supports your conclusions?',
                      'What should we fix?',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q) }}
                        className="block text-sm text-neon-blue hover:text-neon-cyan transition-colors"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-neon-purple" />
                        </div>
                      )}

                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                        <div className={`p-4 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-neon-blue/20 border border-neon-blue/30'
                            : 'bg-white/5 border border-white/10'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                          {msg.role === 'assistant' && msg.confidence != null && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Bot className="w-3 h-3" />
                                <span>Confidence: {msg.confidence}%</span>
                              </div>
                              <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-cyan"
                                  style={{ width: `${msg.confidence}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {msg.role === 'assistant' && msg.evidence && msg.evidence.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-xs text-gray-500 font-semibold mb-2">Supporting Evidence:</p>
                              <div className="space-y-2">
                                {msg.evidence.map((ev: EvidenceItem, i: number) => (
                                  <div key={i} className="p-2 rounded-lg bg-white/5 text-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                      <FileText className="w-3 h-3 text-gray-500" />
                                      <span className="font-mono text-neon-blue">{ev.event_id}</span>
                                      <Clock className="w-3 h-3 text-gray-500 ml-1" />
                                      <span className="text-gray-500">{ev.timestamp}</span>
                                    </div>
                                    <p className="text-gray-400">{ev.detail}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-600 mt-1 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-neon-blue" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-neon-purple" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-3 p-4 border-t border-white/5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={selectedInvestigation ? "Ask about the investigation..." : "Select an investigation first..."}
                disabled={!selectedInvestigation || loading}
                className="input-cyber flex-1"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !selectedInvestigation || loading}
                className="btn-cyber-primary px-4"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-1">
          <GlassCard>
            <h3 className="font-semibold mb-4">Active Investigations</h3>
            <div className="space-y-2">
              {investigations.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => {
                    setSelectedInvestigation(inv.id)
                    setMessages([])
                  }}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-all ${
                    selectedInvestigation === inv.id
                      ? 'bg-neon-blue/10 border border-neon-blue/30'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <p className="font-medium truncate">{inv.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{inv.attack_type || 'N/A'}</span>
                    {inv.confidence_score != null && (
                      <span className="text-xs text-neon-cyan">{inv.confidence_score}%</span>
                    )}
                  </div>
                </button>
              ))}
              {investigations.length === 0 && (
                <p className="text-gray-500 text-xs text-center py-4">
                  No completed investigations. Run an investigation first.
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
