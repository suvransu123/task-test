import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import yaml from 'js-yaml'
import {
  Maximize2,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { ChatInput } from '../../../components/ui/ChatInput'
import { resolveContent } from '../../../components/ui/DocumentRenderer/utils'
import { extractMentionKeys } from '../../../utils/mentionLookup'

// --- Types ---
interface Message {
  id: string | number
  content: string
  role: 'user' | 'assistant' | 'system'
  created_at: string
  type?:
  | 'text'
  | 'document'
  | 'status_'
  | 'status'
  | 'error'
  | 'questions'
  | 'insight'
  | 'nodes'
  document_data?: {
    document_name: string
    document_type: string
    document_content: any
  }
  questions_data?: {
    question: string
    options: string[]
  }[]
  nodes_data?: any[]
}

type DocData = {
  document_name: string
  document_type: string
  document_content: any
}

// --- Sub-components (extracted from old SessionDetailView) ---

const DocumentPreviewPopup: React.FC<{
  docs: DocData[]
  initialIndex?: number
  onClose: () => void
}> = ({ docs, initialIndex = 0, onClose }) => {
  const [activeIdx, setActiveIdx] = useState(initialIndex)
  const doc = docs[activeIdx]

  const formatKey = (key: string) =>
    key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

  const unescapeString = (str: string) => {
    try {
      return str.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'")
    } catch {
      return str
    }
  }

  const parseContent = (content: any): any => {
    if (typeof content !== 'string') return content
    const trimmed = content.trim()
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return JSON.parse(trimmed)
      } catch {
        /* fall through */
      }
    }
    if (trimmed.includes(': ') || trimmed.startsWith('- ')) {
      try {
        const parsed = yaml.load(trimmed)
        if (typeof parsed === 'object' && parsed !== null) return parsed
      } catch {
        /* fall through */
      }
    }
    return unescapeString(trimmed)
  }

  const renderContent = (data: any, depth = 1): React.ReactNode => {
    if (data === null || data === undefined) return null
    const parsedData = parseContent(data)

    if (typeof parsedData !== 'object') {
      const content = String(parsedData)
      const isMarkdown = /#|\*|- |[0-9]\. |\[.*\]\(.*\)/.test(content)
      if (isMarkdown) {
        return (
          <div className="prose prose-slate prose-sm max-w-none text-text-secondary leading-relaxed mb-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )
      }
      return (
        <p className="text-text-secondary mb-6 leading-relaxed text-[14px] font-medium">
          {content}
        </p>
      )
    }

    if (Array.isArray(parsedData)) {
      return (
        <div className="bg-surface-muted border border-border-default rounded-xl p-5 mb-8">
          <ul className="space-y-2 font-mono text-[11px] text-text-secondary">
            {parsedData.map((item, idx) => (
              <li key={idx} className="flex gap-2 items-start leading-relaxed">
                <span className="text-text-muted shrink-0 select-none">-</span>
                <span>
                  {typeof item === 'object'
                    ? JSON.stringify(item)
                    : unescapeString(String(item))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    const entries = Object.entries(parsedData).filter(
      ([key]) => !['id', '_id', '__v'].includes(key),
    )
    if (entries.length === 0) return null

    return entries.map(([key, value]) => {
      const isHeader = depth === 1
      return (
        <div
          key={key}
          className={
            isHeader ? 'mb-12' : 'mb-6 pl-4 border-l-2 border-border-default'
          }
        >
          {isHeader ? (
            <div className="space-y-4 mb-6">
              <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
                {formatKey(key)}
              </p>
              <div className="h-px bg-linear-to-r from-[#E2E8F0] to-transparent w-full" />
            </div>
          ) : (
            <p className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] opacity-50 mb-3">
              {formatKey(key)}
            </p>
          )}
          {renderContent(value, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-accent/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface rounded-4xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="px-8 pt-8 pb-0 bg-surface-muted border-b border-border-default relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent" />

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="p-3.5 bg-accent text-white rounded-2xl shadow-xl rotate-3 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-black text-text-primary tracking-tight truncate">
                  {doc.document_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-accent text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                    {doc.document_type}
                  </span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Intelligence Standard
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="unstyled"
              onClick={onClose}
              className="p-3 text-text-muted hover:text-text-primary hover:bg-surface rounded-2xl border border-transparent hover:border-border-default transition-all shadow-sm active:scale-95 group"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
            </Button>
          </div>

          {docs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-0">
              {docs.map((d, idx) => (
                <Button
                  variant="unstyled"
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-t-xl transition-all border-b-2 ${activeIdx === idx
                    ? 'bg-surface text-accent border-[#5E43FB] shadow-[0_-4px_10px_-5px_rgba(94,67,251,0.1)]'
                    : 'bg-transparent text-text-muted border-transparent hover:text-text-secondary hover:bg-surface-muted'
                    }`}
                >
                  {d.document_name}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-surface p-10 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            {renderContent(resolveContent(doc.document_content))}
          </div>
        </div>

        <div className="px-8 py-5 border-t border-border-default bg-surface-muted/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full border-2 border-white bg-accent" />
              <div className="w-6 h-6 rounded-full border-2 border-white bg-accent" />
            </div>
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">
              AI Consensus Validated
            </span>
          </div>
          <Button
            variant="unstyled"
            onClick={onClose}
            className="px-8 py-3 bg-accent text-white text-[13px] font-black rounded-xl hover:bg-accent-muted transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Finalize Review
          </Button>
        </div>
      </div>
    </div>
  )
}

const QuestionCard: React.FC<{
  questions: { question: string; options: string[] }[]
  onAnswer: (answer: string) => void
  onClose: () => void
}> = ({ questions, onAnswer, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, string[]>
  >({})
  const current = questions[currentIndex]

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) => {
      const currentSelections = prev[currentIndex] || []
      const newSelections = currentSelections.includes(option)
        ? currentSelections.filter((o) => o !== option)
        : [...currentSelections, option]
      return { ...prev, [currentIndex]: newSelections }
    })
  }

  const isLastQuestion = currentIndex === questions.length
  const hasSelection = (selectedOptions[currentIndex] || []).length > 0

  const handleSend = () => {
    let output = ''
    questions.forEach((_, idx) => {
      const selections = selectedOptions[idx] || []
      selections.forEach((opt) => {
        output += opt + '\n'
      })
    })
    onAnswer(output.trim())
  }

  if (!current) return null

  return (
    <div className="w-full max-w-2xl bg-accent rounded-4xl shadow-2xl overflow-hidden border border-white/5 animate-in zoom-in-95 duration-300 my-6">
      <div className="px-8 pt-8 pb-6 flex items-start justify-between bg-linear-to-b from-white/5 to-transparent">
        <div className="space-y-4 pr-6">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-accent text-white text-[9px] font-black uppercase tracking-widest rounded-md">
              Intelligence Query
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Action Required
            </span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight leading-relaxed prose-invert prose-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {current.question}
            </ReactMarkdown>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 pt-1">
          <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-widest bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
            <Button
              variant="unstyled"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev))}
              disabled={currentIndex === 0}
              className="hover:text-white disabled:opacity-10 transition-colors"
            >
              <ChevronLeft className="w-1.5" />
            </Button>
            <span className="w-12 text-center">
              {currentIndex + 1} / {questions.length}
            </span>
            <Button
              variant="unstyled"
              onClick={() =>
                setCurrentIndex((prev) => Math.min(questions.length, prev + 1))
              }
              disabled={isLastQuestion || !hasSelection}
              className="hover:text-white disabled:opacity-10 transition-colors"
            >
              <ChevronRight className="w-1.5" />
            </Button>
          </div>
          <Button
            variant="unstyled"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-surface/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-8 py-4 space-y-3">
        {current.options.map((option, idx) => {
          const isSelected = (selectedOptions[currentIndex] || []).includes(
            option,
          )
          return (
            <Button
              variant="unstyled"
              key={idx}
              onClick={() => toggleOption(option)}
              className={`w-full group flex items-center gap-4 p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${isSelected
                ? 'bg-surface text-text-primary border-transparent shadow-xl'
                : 'bg-surface/3 text-slate-300 border-white/5 hover:bg-surface/6 hover:border-white/10'
                }`}
            >
              {isSelected && (
                <div className="absolute left-0 top-0 w-1.5 h-full bg-accent" />
              )}
              <div
                className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-xl font-bold text-[11px] transition-colors ${isSelected ? 'bg-accent text-white shadow-lg shadow-[#5E43FB]/30' : 'bg-black/40 text-slate-500 group-hover:text-slate-300'}`}
              >
                {String.fromCharCode(65 + idx)}
              </div>
              <span
                className={`text-[14px] font-semibold tracking-tight ${isSelected ? 'text-text-primary' : 'text-slate-300'}`}
              >
                {option}
              </span>
            </Button>
          )
        })}
      </div>

      <div className="px-8 py-8 bg-black/40 flex items-center justify-between border-t border-white/5">
        <Button
          variant="unstyled"
          onClick={() => toggleOption('Require Modification')}
          className="flex items-center gap-3 text-slate-500 hover:text-slate-300 text-[11px] font-black uppercase tracking-[0.2em] group transition-all"
        >
          <div
            className={`p-2.5 rounded-xl transition-all ${(selectedOptions[currentIndex] || []).includes('Require Modification') ? 'bg-accent text-white' : 'bg-surface/5'}`}
          >
            <Pencil className="w-4 h-4" />
          </div>
          Detailed Input
        </Button>
        <Button
          variant="unstyled"
          onClick={
            isLastQuestion
              ? handleSend
              : () => setCurrentIndex((prev) => prev + 1)
          }
          disabled={!hasSelection}
          className={`px-10 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${isLastQuestion ? 'bg-accent text-white hover:bg-surface hover:text-accent shadow-[#5E43FB]/20' : 'bg-surface text-text-primary hover:bg-accent hover:text-white'}`}
        >
          {isLastQuestion ? 'Initialize Module' : 'Next Question'}
        </Button>
      </div>
    </div>
  )
}

const NodesCard: React.FC<{
  nodes: any[]
}> = ({ nodes }) => {
  return (
    <div className="w-full max-w-2xl bg-accent rounded-4xl shadow-2xl overflow-hidden border border-white/5 animate-in zoom-in-95 duration-300 my-6">
      <div className="px-8 pt-8 pb-6 flex items-start justify-between bg-linear-to-b from-white/5 to-transparent">
        <div className="space-y-4 pr-6">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-accent text-white text-[9px] font-black uppercase tracking-widest rounded-md">
              Nodes
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Generated
            </span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight leading-relaxed prose-invert prose-sm">
            Generated Nodes
          </div>
        </div>
      </div>
      <div className="px-8 pb-8">
        <div className="space-y-4">
          {nodes.map((node, index) => (
            <div
              key={index}
              className="p-4 bg-surface/5 rounded-xl border border-white/10"
            >
              <pre className="text-white text-sm whitespace-pre-wrap">
                {JSON.stringify(node, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const MessageBubble: React.FC<{
  msg: Message
  onShowDoc?: (doc: any) => void
  onAnswer?: (answer: string) => void
  onCloseQuestions?: () => void
}> = ({ msg, onShowDoc, onAnswer, onCloseQuestions }) => {
  const isUser = msg.role === 'user'
  const isDoc = msg.type === 'document'
  const isQuestions = msg.type === 'questions'
  const isNodes = msg.type === 'nodes'
  const isStatus = msg.type === 'status_' || msg.type === 'status'
  const isError = msg.type === 'error'

  if (isQuestions && msg.questions_data) {
    return (
      <QuestionCard
        questions={msg.questions_data}
        onAnswer={(ans: string) => onAnswer?.(ans)}
        onClose={() => onCloseQuestions?.()}
      />
    )
  }

  if (isNodes && msg.nodes_data) {
    return <NodesCard nodes={msg.nodes_data} />
  }

  if (isStatus || isError) {
    return (
      <div className="flex flex-col items-center w-full my-6 animate-in fade-in duration-700">
        <div
          className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${isError
            ? 'bg-red-50 text-red-500 border-red-100'
            : 'bg-slate-50 text-text-muted border-slate-100'
            }`}
        >
          {isError ? (
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              Critical: {msg.content}
            </span>
          ) : (
            <span className="flex items-center gap-2">{msg.content}</span>
          )}
        </div>
      </div>
    )
  }

  // Detect "Suggested Insight" based on content patterns
  const isInsight =
    msg.type === 'insight' ||
    (msg.role === 'assistant' &&
      msg.content.toLowerCase().includes('suggested insight')) ||
    (msg.role === 'assistant' &&
      msg.content.toLowerCase().includes('technical complexity'))

  if (isInsight) {
    const cleanContent = msg.content.replace(/ suggested insight:?/i, '').trim()
    return (
      <div className="flex flex-col w-full my-4 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-surface-muted border border-[#EDE9FE] rounded-3xl p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow max-w-[92%] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
          <div className="flex items-center gap-3 text-accent">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">
              Suggested Insight
            </span>
          </div>
          <div className="prose prose-sm max-w-none font-bold text-text-secondary leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {cleanContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-2 animate-in slide-in-from-bottom-3 duration-300 group`}
    >
      {isDoc && msg.document_data ? (
        <div
          onClick={() => onShowDoc?.(msg.document_data)}
          className="p-6 bg-surface border border-border-default rounded-3xl shadow-sm hover:border-accent hover:shadow-xl hover:shadow-[#5E43FB]/5 cursor-pointer transition-all flex items-center gap-5 max-w-[92%] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-3 bg-surface-muted text-text-primary rounded-2xl group-hover:bg-accent group-hover:text-white transition-all shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-black text-text-primary truncate tracking-tight">
              {msg.document_data.document_name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                {msg.document_data.document_type}
              </span>
            </div>
          </div>
          <Maximize2 className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
        </div>
      ) : (
        <div
          className={`px-8 py-5 rounded-3xl max-w-[92%] text-[15px] leading-relaxed relative ${isUser
            ? 'bg-accent text-white rounded-br-none shadow-xl shadow-[#0F172A]/10'
            : 'bg-surface-muted border border-border-default text-text-secondary rounded-bl-none font-bold'
            }`}
        >
          <div
            className={`prose prose-sm max-w-none font-bold ${isUser ? 'prose-invert text-white' : 'prose-slate text-text-secondary'}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main ChatComponent ---

interface ChatComponentProps {
  projectId: string
  models: string[]
  selectedModel: string
  onModelChange: (model: string) => void
  onNewDocument?: () => void
  onStatusUpdate?: (status: string) => void
  activeSession?: number
  /** Active tab name from MetadataPanel (e.g. "Brief", "Goals") */
  activeTab?: string
  /** Parsed document content for the active tab, for @mention key extraction */
  activeDocumentData?: any
  onError?: (errorMessage: string) => void
  /** Callback when nodes data is received via WebSocket */
  onNodesReceived?: (nodes: any[]) => void
  /** Callback when validate_output response is received - triggers graph refetch */
  onValidateOutputReceived?: () => void
  /** Callback when regenerate completes (validate_output or forge_output received) */
  onRegenerateComplete?: () => void
}

export interface ChatComponentRef {
  sendRawMessage: (payload: any) => void
}

export const ChatComponent = forwardRef<ChatComponentRef, ChatComponentProps>(
  (
    {
      projectId,
      models,
      selectedModel,
      onModelChange,
      onNewDocument,
      onStatusUpdate,
      activeTab = 'Brief',
      activeDocumentData = null,
      onError,
      onNodesReceived,
      onValidateOutputReceived,
      onRegenerateComplete,
    },
    ref,
  ) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [connectionStatus, setConnectionStatus] = useState<
      'connecting' | 'connected' | 'error' | 'disconnected'
    >('disconnected')
    const [inputValue, setInputValue] = useState('')
    const [isAiThinking, setIsAiThinking] = useState(false)
    const [previewDoc, setPreviewDoc] = useState<{
      docs: DocData[]
      activeIndex: number
    } | null>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const lastSentModelRef = useRef<string | null>(null)
    const isFirstMessageRef = useRef<boolean>(true)
    const [reconnectTrigger, setReconnectTrigger] = useState(0)
    const [reconnectAttempts, setReconnectAttempts] = useState(0)
    const MAX_RECONNECT_ATTEMPTS = 5

    // Clear all messages when user navigates to a different tab
    useEffect(() => {
      setMessages([])
    }, [activeTab])

    // Derive mentionable keys from the active tab and its document data
    const mentionKeys = useMemo(
      () => extractMentionKeys(activeTab, activeDocumentData),
      [activeTab, activeDocumentData],
    )

    // Send a payload over the socket, attaching the selected model only when it
    // changed since the last send (or on the first message after a connection).
    // Covers chat messages, regenerate, and initialize.
    const sendSocketPayload = (payload: Record<string, unknown>): boolean => {
      if (
        !socketRef.current ||
        socketRef.current.readyState !== WebSocket.OPEN
      ) {
        console.warn('Cannot send message, WebSocket is not open.')
        return false
      }
      const outgoing: Record<string, unknown> = { ...payload }
      if (isFirstMessageRef.current || selectedModel !== lastSentModelRef.current) {
        outgoing.model = selectedModel
      }
      socketRef.current.send(JSON.stringify(outgoing))
      lastSentModelRef.current = selectedModel
      isFirstMessageRef.current = false
      return true
    }

    useImperativeHandle(ref, () => ({
      sendRawMessage: (payload: any) => {
        sendSocketPayload(payload)
      },
    }))

    const triggerReconnect = useCallback(() => {
      setReconnectTrigger((prev) => prev + 1)
    }, [])

    useEffect(() => {
      if (models.length > 0 && !selectedModel) {
        onModelChange(models[0])
      }
    }, [models, selectedModel, onModelChange])

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
      scrollToBottom()
    }, [messages])

    useEffect(() => {
      let isActive = true

      const setupConnection = async () => {
        try {
          setConnectionStatus('connecting')
          const token = localStorage.getItem('access_token')
          const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL ||
            'http://192.168.1.138:8000/api/v1'
          const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws'
          const wsBaseUrl = apiBaseUrl.replace(/^https?:\/\//, '')

          if (!isActive) return

          const wsUrl = `${wsProtocol}://${wsBaseUrl}/ws/${projectId}?token=${token}`
          const socket = new WebSocket(wsUrl)
          socketRef.current = socket

          socket.onopen = () => {
            setConnectionStatus('connected')
            setReconnectAttempts(0)
            isFirstMessageRef.current = true
          }

          socket.onmessage = (event) => {
            try {
              const rawData = event.data

              if (!rawData || rawData === '{}' || rawData === '""') {
                return
              }

              let data
              try {
                data = JSON.parse(rawData)
              } catch (parseError) {
                console.error('[useWebSocket] JSON parse error:', parseError)
                return
              }
              if (Array.isArray(data)) {
                setMessages(data)
                setIsAiThinking(false)
              } else if (
                data &&
                data.type === 'nodes' &&
                (data.response || data.node || data.nodes)
              ) {
                // Pass nodes data to parent callback - support 'response', 'node', and 'nodes' keys
                const nodesData = data.response || data.node || data.nodes
                if (onNodesReceived) {
                  onNodesReceived(nodesData)
                }
                setIsAiThinking(false)
                return // Exit early after handling nodes
              } else if (
                data.type === 'convo_hist' &&
                Array.isArray(data.response)
              ) {
                const mappedMessages: Message[] = data.response.map(
                  (msg: any, idx: number) => ({
                    id: `hist-${idx}`,
                    content: msg.ai || msg.human || '',
                    role: msg.human ? 'user' : 'assistant',
                    created_at: new Date().toISOString(),
                  }),
                )
                setMessages(mappedMessages)
                setIsAiThinking(false)
              } else if (data.type === 'document' && data.response) {
                const newMsg: Message = {
                  id: Date.now(),
                  content: 'Sent a document',
                  role: 'assistant',
                  created_at: new Date().toISOString(),
                  type: 'document',
                  document_data: data.response,
                }
                setMessages((prev) => [
                  ...prev.filter(
                    (m) => m.type !== 'status_' && m.type !== 'status',
                  ),
                  newMsg,
                ])
                setIsAiThinking(false)
                onNewDocument?.()
              } else if (
                data.type === 'questions' &&
                Array.isArray(data.response)
              ) {
                const newMsg: Message = {
                  id: Date.now(),
                  content: 'Sent questions',
                  role: 'assistant',
                  created_at: new Date().toISOString(),
                  type: 'questions',
                  questions_data: data.response,
                }
                setMessages((prev) => [
                  ...prev.filter(
                    (m) => m.type !== 'status_' && m.type !== 'status',
                  ),
                  newMsg,
                ])
                setIsAiThinking(false)
              } else if (data.type === 'validate_output' || data.type === 'forge_output') {
                // Remove status messages, don't show validate_output/forge_output in chat
                // Trigger graph refetch and content re-render
                setIsAiThinking(false)
                onValidateOutputReceived?.()
                if (data.type === 'validate_output') {
                  onRegenerateComplete?.()
                }
              }
              else if (data.type === 'ai_response' && data.response) {
                const newMsg: Message = {
                  id: Date.now(),
                  content:
                    typeof data.response === 'string'
                      ? data.response
                      : JSON.stringify(data.response),
                  role: 'assistant',
                  created_at: new Date().toISOString(),
                  type: 'text',
                }
                setMessages((prev) => [
                  ...prev.filter(
                    (m) => m.type !== 'status_' && m.type !== 'status',
                  ),
                  newMsg,
                ])
                setIsAiThinking(false)
              } else if (
                data.type === 'status_' ||
                data.type === 'status' ||
                data.type === 'error'
              ) {
                let content: string
                if (
                  typeof data === 'object' &&
                  data !== null &&
                  data.node &&
                  data.status &&
                  data.message
                ) {
                  content = `${data.node}:${data.status} - ${data.message}`
                } else if (
                  typeof data.response === 'object' &&
                  data.response !== null &&
                  data.response.node &&
                  data.response.status &&
                  data.response.message
                ) {
                  content = `${data.response.node}:${data.response.status} - ${data.response.message}`
                } else {
                  content =
                    typeof data.response === 'string'
                      ? data.response
                      : typeof data === 'string'
                        ? data
                        : JSON.stringify(data)
                }
                const isOutputStatus = content.toLowerCase().includes('output')
                if (!isOutputStatus) {
                  const newMsg: Message = {
                    id: Date.now() + Math.random(),
                    content,
                    role: 'system',
                    created_at: new Date().toISOString(),
                    type: data.type as 'status_' | 'status' | 'error',
                  }
                  setMessages((prev) => [...prev, newMsg])
                }
                if (data.type === 'error') {
                  setIsAiThinking(false)
                  onError?.(content)
                }
                if ((data.type === 'status_' || data.type === 'status') && !isOutputStatus) {
                  onStatusUpdate?.(content)
                }
              } else {
                const resp = data.response || data
                const content =
                  resp.content ||
                  resp.ai ||
                  resp.human ||
                  (typeof resp === 'string' ? resp : null)

                if (content !== null) {
                  const isAi =
                    !resp.human && resp.role !== 'user' && !data.human
                  const newMsg: Message = {
                    id: Date.now() + Math.random(),
                    content:
                      typeof content === 'string'
                        ? content
                        : JSON.stringify(content, null, 2),
                    role: isAi ? 'assistant' : 'user',
                    created_at: resp.created_at || new Date().toISOString(),
                    type: data.type === 'document' ? 'document' : 'text',
                    document_data: data.type === 'document' ? resp : undefined,
                  }
                  setMessages((prev) => [
                    ...(isAi
                      ? prev.filter(
                        (m) => m.type !== 'status_' && m.type !== 'status',
                      )
                      : prev),
                    newMsg,
                  ])
                  if (isAi) {
                    setIsAiThinking(false)
                  }
                  if (data.type === 'document') {
                    onNewDocument?.()
                  }
                } else {
                  // No content found - unknown message type, ignore silently
                }
              }
            } catch (e) {
              console.error('Failed to process WebSocket message:', e)
            }
          }

          socket.onclose = () => {
            setConnectionStatus('disconnected')

            if (isActive && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              const delay = Math.min(
                Math.pow(2, reconnectAttempts) * 1000,
                30000,
              )
              reconnectTimeoutRef.current = setTimeout(() => {
                setReconnectAttempts((prev) => prev + 1)
                triggerReconnect()
              }, delay)
            }
          }

          socket.onerror = (error) => {
            console.error('WebSocket Error:', error)
            setConnectionStatus('error')
            // onclose will be called after onerror, so the retry logic stays there
          }
        } catch (error) {
          console.error(
            '[useWebSocket] Failed to setup WebSocket connection:',
            error,
          )
          setConnectionStatus('error')

          if (isActive && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30000)
            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts((prev) => prev + 1)
              triggerReconnect()
            }, delay)
          }
        }
      }

      setupConnection()

      return () => {
        isActive = false
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        if (socketRef.current) {
          socketRef.current.close()
          socketRef.current = null
        }
      }
    }, [projectId, reconnectTrigger])

    const handleSendMessage = (textOverride?: string) => {
      const text = textOverride || inputValue
      if (!text.trim()) return

      if (connectionStatus !== 'connected' || !socketRef.current) {
        triggerReconnect()
        return
      }

      const messagePayload = {
        content: text,
        role: 'user',
        created_at: new Date().toISOString(),
      }

      // Detect @mention at the start: (@VALUE):rest_of_text
      // Also handle inline mention: if the text starts with @MENTION followed by a space or end
      const mentionPattern = /^@([\w][\w\s-]*)\s(.*)$/s
      const compactPattern = /^\(@([^)]+)\):(.*)$/s

      let questionText = text
      const compactMatch = compactPattern.exec(text)
      if (compactMatch) {
        // Already formatted — pass through
        questionText = text
      } else {
        const inlineMatch = mentionPattern.exec(text.trim())
        if (inlineMatch) {
          const mentionValue = inlineMatch[1].trim()
          const restText = inlineMatch[2].trim()
          questionText = `(@${mentionValue}):${restText}`
        }
      }

      // Force session_index to 0 for user-typed messages - this applies universally
      // across all chat sessions per backend requirements
      const wsPayload: any = {
        session_index: 0,
        message: questionText,
      }

      sendSocketPayload(wsPayload)

      if (!textOverride) {
        setMessages((prev) => [...prev, messagePayload as Message])
        setInputValue('')
      }
      setIsAiThinking(true)
    }

    // ── Tab-aware config for the right rail ──────────────────────────────


    // Latest assistant insight from messages (if any)

    return (
      <div className="flex flex-col h-full bg-surface overflow-hidden">
        {/* ── INTELLIGENCE Section ── */}
        <div className="px-5 pt-5 pb-2 border-b border-border-default shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Intelligence</span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : connectionStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-[#CBD5E1]'
                  }`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${connectionStatus === 'connected'
                  ? 'text-emerald-600'
                  : connectionStatus === 'connecting'
                    ? 'text-amber-500'
                    : 'text-text-muted'
                  }`}
              >
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'connecting'
                    ? 'Connecting'
                    : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>




        {/* ── COPILOT Chat Section ── */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Copilot label */}
          <div className="px-5 pt-3 pb-1 shrink-0">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Copilot</span>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4 scroll-smooth custom-scrollbar">
            {messages.length === 0 ? (
              <p className="text-[12px] text-text-muted pt-1">
                Analyzing{' '}
                <span className="font-bold text-text-secondary">{activeTab}</span>.
                {' '}Ask me anything.
              </p>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onShowDoc={(doc) =>
                    setPreviewDoc({ docs: [doc], activeIndex: 0 })
                  }
                  onAnswer={(ans) => handleSendMessage(ans)}
                />
              ))
            )}
            {isAiThinking && (
              <div className="flex items-center gap-3 animate-in fade-in duration-500">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-1 bg-accent rounded-full animate-bounce" />
                </div>
                <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">
                  Synthesizing...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Chat Input — pinned to bottom of copilot section */}
          <div className="px-4 pb-4 pt-2 shrink-0 border-t border-border-default">
            <ChatInput
              value={inputValue}
              onChange={(val) => setInputValue(val)}
              onSend={() => handleSendMessage()}
              placeholder="Describe your requirements..."
              disabled={connectionStatus !== 'connected'}
              models={models}
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              mentionKeys={mentionKeys}
            />
          </div>
        </div>

        {previewDoc && (
          <DocumentPreviewPopup
            docs={previewDoc.docs}
            initialIndex={previewDoc.activeIndex}
            onClose={() => setPreviewDoc(null)}
          />
        )}
      </div>
    )
  },
)
