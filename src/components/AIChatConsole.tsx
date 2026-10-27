import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Share2,
  Trash2,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  BookmarkPlus,
  BookOpen,
  PlusCircle,
  Sliders,
  Check,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  timestamp: string;
  model?: string;
  learnedBadge?: string;
}

interface LearnedRule {
  id: string;
  type: 'template' | 'rule' | 'correction';
  title: string;
  content: string;
  createdAt: string;
}

interface AIChatConsoleProps {
  botToken?: string;
  targetChannel?: string;
  onPostSuccess?: (msg: string) => void;
}

export function AIChatConsole({
  targetChannel = '@jhdhhdcj',
  onPostSuccess,
}: AIChatConsoleProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `مرحباً بك يا مديرنا الأكاديمي! 👋
أنا محرر ومستشار المحتوى الأكاديمي الذكي لقناة (${targetChannel})، ومحركي مدعوم بـ DeepSeek-V4.1-Flash ومزود بـ **بنك الذاكرة التفاعلي**.

🧠 **كيف نتعلم ونتحدث في هذه الجلسة المفتوحة؟**
1. **أرسل لي أي صيغة أو قالب**: مثلاً "اعتمد هذه الصيغة للمنشورات: ..." وسأحفظها وأطبقها دائماً.
2. **علّمني قواعدك المفضلة**: مثل "تعلم: ضع روابط التقديم كاملة في سطر مستقل".
3. **صحح أخطائي السابقة**: مثل "صحح الخطأ: لا تذكر كلمة منقول أبداً".
4. **اطلب أي صياغة خبرية**: وسأنتجها لك فوراً وفق القالب المعتمد مع إمكانية نشرها بنقرة واحدة!`,
      timestamp: new Date().toLocaleTimeString('ar-SA'),
      model: 'DeepSeek-V4.1-Flash'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openReasoningId, setOpenReasoningId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'template' | 'memory'>('chat');
  const [memoryRules, setMemoryRules] = useState<LearnedRule[]>([]);
  const [masterTemplate, setMasterTemplate] = useState<{ id: string; name: string; structure: string; isActive: boolean; lastUpdated?: string } | null>(null);
  const [templateStructure, setTemplateStructure] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isResettingTemplate, setIsResettingTemplate] = useState(false);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleType, setNewRuleType] = useState<'template' | 'rule' | 'correction'>('template');
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [isSavingRule, setIsSavingRule] = useState(false);

  const isEditingTemplateRef = useRef(false);
  const lastFetchedStructureRef = useRef('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTemplate = async (force = false) => {
    try {
      const res = await fetch('/api/template');
      if (res.ok) {
        const data = await res.json();
        if (data.template) {
          setMasterTemplate(data.template);
          // Only update textarea if user is not currently editing, or if forced
          if (force || !isEditingTemplateRef.current || !lastFetchedStructureRef.current) {
            setTemplateStructure(data.template.structure || '');
            lastFetchedStructureRef.current = data.template.structure || '';
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch template', e);
    }
  };

  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/ai/memory');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.rules)) {
          setMemoryRules(data.rules);
        }
      }
    } catch (e) {
      console.warn('Could not fetch memory rules', e);
    }
  };

  useEffect(() => {
    fetchMemory();
    fetchTemplate(true);
    const interval = setInterval(() => {
      fetchMemory();
      fetchTemplate();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSaveTemplate = async () => {
    if (!templateStructure.trim()) return;
    setIsSavingTemplate(true);
    isEditingTemplateRef.current = false;
    try {
      const res = await fetch('/api/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structure: templateStructure.trim(),
          name: masterTemplate?.name || 'القالب الأكاديمي الموحد الدائم',
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setMasterTemplate(data.template);
        lastFetchedStructureRef.current = data.template.structure || '';
        setStatusMessage('✅ تم اعتماد وحفظ القالب الأكاديمي الدائم بنجاح ومزامنته فوراً مع التيليجرام والويب!');
      }
    } catch (err) {
      setStatusMessage('❌ تعذر حفظ القالب.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleResetTemplate = async () => {
    setIsResettingTemplate(true);
    isEditingTemplateRef.current = false;
    try {
      const res = await fetch('/api/template/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMasterTemplate(data.template);
        setTemplateStructure(data.template.structure);
        lastFetchedStructureRef.current = data.template.structure || '';
        setStatusMessage('✅ تمت استعادة القالب الأكاديمي الافتراضي بنجاح ومزامنته مع التيليجرام.');
      }
    } catch (err) {
      console.warn('Reset template error', err);
    } finally {
      setIsResettingTemplate(false);
    }
  };

  useEffect(() => {
    if (activeView === 'chat') {
      scrollToBottom();
    }
  }, [messages, loading, activeView]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('ar-SA')
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);
    setStatusMessage(null);

    // Multi-turn context
    const conversationHistory = messages.slice(-8).map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          model: selectedModel,
          conversationHistory,
        })
      });

      const data = await resp.json();
      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          role: 'assistant',
          content: data.reply,
          reasoning: data.reasoning,
          timestamp: new Date().toLocaleTimeString('ar-SA'),
          model: data.model || selectedModel,
          learnedBadge: data.learnedRuleAdded || undefined,
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (data.learnedRuleAdded) {
          fetchMemory();
          setStatusMessage(`🧠 تم التعلم والحفظ في بنك الذاكرة: ${data.learnedRuleAdded}`);
        }
      } else {
        throw new Error(data.error || 'فشل في استجابة خادم الذكاء');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ تعذر الحصول على رد من الذكاء الاصطناعي: ${errMsg}\nتأكد من اتصال السيرفر بالشبكة.`,
          timestamp: new Date().toLocaleTimeString('ar-SA')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (msgId: string, content: string) => {
    setPublishingId(msgId);
    setStatusMessage(null);
    try {
      const resp = await fetch('/api/university/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_channel: targetChannel,
          text: content
        })
      });
      const data = await resp.json();
      if (data.success) {
        setStatusMessage(`✅ تم النشر بنجاح في القناة ${targetChannel} (معرف الرسالة: ${data.messageId})!`);
        if (onPostSuccess) onPostSuccess(data.messageId);
      } else {
        setStatusMessage(`❌ تعذر النشر في ${targetChannel}: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`❌ فشل الاتصال بخادم النشر: ${msg}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveAsMemoryRule = async (text: string) => {
    try {
      const res = await fetch('/api/ai/memory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'template',
          title: 'قالب صياغة معتمد من المشرف',
          content: text.trim(),
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchMemory();
        setStatusMessage('🧠 تم حفظ نص الصياغة كقالب دائم في بنك الذاكرة بنجاح!');
      }
    } catch (e) {
      console.warn('Error saving rule', e);
    }
  };

  const handleAddManualRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleContent.trim()) return;
    setIsSavingRule(true);
    try {
      const res = await fetch('/api/ai/memory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newRuleType,
          title: newRuleTitle.trim() || undefined,
          content: newRuleContent.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchMemory();
        setNewRuleTitle('');
        setNewRuleContent('');
        setIsAddingRule(false);
        setStatusMessage('✅ تمت إضافة القاعدة الجديدة إلى بنك الذاكرة بنجاح!');
      }
    } catch (err) {
      console.warn('Failed to add manual rule', err);
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch('/api/ai/memory/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchMemory();
        setStatusMessage('تم حذف القاعدة من بنك الذاكرة.');
      }
    } catch (e) {
      console.warn('Delete rule error', e);
    }
  };

  const handleClearMemory = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح كافة القواعد والقوالب المحفوظة في بنك الذاكرة؟')) {
      try {
        const res = await fetch('/api/ai/memory/clear', { method: 'POST' });
        if (res.ok) {
          fetchMemory();
          setStatusMessage('تم مسح بنك الذاكرة بنجاح.');
        }
      } catch (e) {
        console.warn('Clear memory error', e);
      }
    }
  };

  const quickTeachingPrompts = [
    {
      label: '📐 اعتمد هذه الصيغة للمنشورات',
      prompt: `اعتمد هذه الصيغة المعتمدة لجميع المنشورات الأكاديمية:
📌 [عنوان بارز ومميز]
• [المحتوى في نقاط محددة مع إبراز التواريخ والشروط]
🔗 رابط التقديم / البوابة: [الرابط الكامل]
💬 [دعوة تفاعلية قصيرة للطلاب]
#جامعة #قبول #تسجيل`
    },
    {
      label: '📌 تعلم: قاعدة الروابط الرسمية',
      prompt: 'تعلم: الروابط الرسمية ونماذج التقديم والبوابات الجامعية خط أحمر؛ احتفظ بها دائماً كاملة في سطر مستقل يسبقها (🔗 رابط التقديم:).'
    },
    {
      label: '⚠️ صحح الخطأ: منع ذكر المصادر',
      prompt: 'عدل الخطأ السابق: ممنوع منعاً باتاً ذكر كلمات (منقول، المصدر، بحسب القناة، تغريدة تويتر)، واكتب المنشور بصفتك المشرف المباشر للقناة.'
    },
    {
      label: '💬 صياغة خبر تجريبي بالقالب',
      prompt: 'صغ لي خبراً عاجلاً عن فتح بوابة القبول والتسجيل للفصل الدراسي القادم وفق القالب المعتمد.'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[700px] overflow-hidden">
      {/* Console Header */}
      <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-950">
            <Brain className="w-5 h-5 text-sky-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">شات الذكاء الاصطناعي الأكاديمي (التعلم المستمر)</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                محادثة مفتوحة للتعلم
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              يعتمد قوالبك ويحفظ توجيهاتك ويصحح أخطاءه وينشر في <span className="text-sky-300 font-mono">{targetChannel}</span>
            </p>
          </div>
        </div>

        {/* View Switcher & Model Selection */}
        <div className="flex items-center gap-2">
          {/* Tabs Switcher */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                activeView === 'chat'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>المحادثة الحية</span>
            </button>

            <button
              onClick={() => setActiveView('template')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                activeView === 'template'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-amber-300" />
              <span>القالب الدائم 📐</span>
            </button>

            <button
              onClick={() => setActiveView('memory')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                activeView === 'memory'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>بنك الذاكرة ({memoryRules.length})</span>
            </button>
          </div>

          {/* Model Switcher with Ultra-Fast Gemini First */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-emerald-300 font-bold font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="gemini-2.5-flash" className="bg-slate-900 text-emerald-400">⚡ Gemini 2.5 Flash (&lt;1s سريع جداً)</option>
              <option value="gemini-3.8-flash" className="bg-slate-900 text-sky-400">🚀 Gemini 3.8 Flash (المتقدم)</option>
              <option value="DeepSeek-V4.1-Flash" className="bg-slate-900 text-white">DeepSeek-V4.1-Flash</option>
              <option value="DeepSeek-V4-Flash" className="bg-slate-900 text-white">DeepSeek-V4-Flash</option>
            </select>
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            title="مسح المحادثة"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Alert if any */}
      {statusMessage && (
        <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-between transition-all ${
          statusMessage.startsWith('✅') || statusMessage.startsWith('🧠')
            ? 'bg-emerald-950/70 text-emerald-200 border-b border-emerald-800/50'
            : 'bg-rose-950/70 text-rose-200 border-b border-rose-800/50'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.startsWith('✅') || statusMessage.startsWith('🧠') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* BODY: CHAT VIEW vs MEMORY BANK VIEW */}
      {activeView === 'chat' ? (
        <>
          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1 px-1">
                    <span>{isUser ? 'أنت (المشرف)' : `المحرر الأكاديمي (${m.model || selectedModel})`}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {/* Learned Rule Badge Banner */}
                    {m.learnedBadge && (
                      <div className="mb-3 p-2.5 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 rounded-xl text-purple-200 text-xs flex items-center gap-2 shadow-inner">
                        <Brain className="w-4 h-4 text-purple-400 shrink-0 animate-bounce" />
                        <div>
                          <span className="font-extrabold text-white">تم استيعاب وتثبيت التوجيه في بنك الذاكرة:</span>
                          <span className="text-purple-300 mx-1">{m.learnedBadge}</span>
                        </div>
                      </div>
                    )}

                    {/* Collapsible Reasoning if present */}
                    {m.reasoning && (
                      <div className="mb-3 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px]">
                        <button
                          type="button"
                          onClick={() => setOpenReasoningId(openReasoningId === m.id ? null : m.id)}
                          className="flex items-center justify-between w-full text-amber-300 font-semibold gap-1 hover:text-amber-200"
                        >
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>تحليل وتفكير الذكاء الاصطناعي (Chain of Thought)</span>
                          </span>
                          {openReasoningId === m.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {openReasoningId === m.id && (
                          <div className="mt-2 text-slate-400 font-mono text-[10px] max-h-36 overflow-y-auto leading-relaxed border-t border-slate-800 pt-2 text-left" dir="ltr">
                            {m.reasoning}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actual Message Text */}
                    <div className="leading-relaxed">{m.content}</div>

                    {/* Assistant Action Buttons */}
                    {!isUser && m.id !== 'welcome' && !m.content.startsWith('⚠️') && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(m.id, m.content)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] rounded-lg border border-slate-800 flex items-center gap-1 transition-colors"
                          >
                            {copiedId === m.id ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>نسخ النص</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleSaveAsMemoryRule(m.content)}
                            title="حفظ هذه الصياغة كقالب معتمد في بنك الذاكرة"
                            className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 hover:text-white text-[10px] rounded-lg border border-purple-800/50 flex items-center gap-1 transition-colors"
                          >
                            <BookmarkPlus className="w-3 h-3 text-purple-400" />
                            <span>حفظ كقالب دائم</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handlePublish(m.id, m.content)}
                          disabled={publishingId === m.id}
                          className="px-3 py-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-[11px] font-bold rounded-lg shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {publishingId === m.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري النشر...</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>نشر في {targetChannel}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex flex-col items-end">
                <div className="text-[11px] text-slate-400 mb-1 px-1">المحرر الأكاديمي يفكر ويطبق القواعد...</div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-xs text-sky-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>جاري تطبيق بنك الذاكرة وصياغة المنشور وفق توجيهاتك الأكاديمية...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts bar (Tailored for Teaching & Formula Setting) */}
          <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/70 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-400 shrink-0 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              نماذج التعلم والصيغ:
            </span>
            {quickTeachingPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                className="shrink-0 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب تعليماتك، أرسل صيغة/قالباً للاعتماد، أو صحح خطأ، أو الصق خبراً لصياغته..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>إرسال</span>
              </button>
            </form>
          </div>
        </>
      ) : activeView === 'template' ? (
        /* MASTER TEMPLATE VIEW */
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-amber-400" />
                <span>القالب الأكاديمي المعتمد الدائم (Master Template)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                هذا القالب يطبق دائماً وبشكل إلزامي على كل صياغة خبرية وإعادة نشر تتم عبر لوحة الويب أو بوت التيليجرام.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetTemplate}
                disabled={isResettingTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResettingTemplate ? 'animate-spin' : ''}`} />
                <span>استعادة الافتراضي</span>
              </button>

              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate || !templateStructure.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-900/30 transition-all disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingTemplate ? 'جاري الحفظ...' : 'حفظ واعتماد القالب الدائم'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Editor Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>محرر هيكل وصيغة القالب الدائم:</span>
                </label>
                <span className="text-[11px] text-slate-500">يتزامن تلقائياً مع أمر /template في التيليجرام</span>
              </div>

              <textarea
                rows={12}
                value={templateStructure}
                onChange={(e) => setTemplateStructure(e.target.value)}
                placeholder="أدخل هيكل القالب المعتمد..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl p-4 text-xs text-white leading-relaxed font-mono focus:outline-none shadow-inner"
              />

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300">💡 المتغيرات المدعومة في القالب:</span>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                  <span className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded border border-slate-800">&#123;title&#125; - العنوان البارز</span>
                  <span className="px-2 py-0.5 bg-slate-900 text-sky-300 rounded border border-slate-800">&#123;content&#125; - تفاصيل الخبر والمواعيد</span>
                  <span className="px-2 py-0.5 bg-slate-900 text-emerald-300 rounded border border-slate-800">&#123;link&#125; - رابط التقديم الرسمي</span>
                  <span className="px-2 py-0.5 bg-slate-900 text-purple-300 rounded border border-slate-800">#&#123;univ_tag&#125; - وسم الجامعة المستهدفة</span>
                </div>
              </div>
            </div>

            {/* Live Preview Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>المعاينة الحية الفورية للمنشور بالقالب:</span>
                </label>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  مطبّق الآن 100%
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-emerald-500/20 rounded-2xl shadow-xl flex flex-col justify-between h-[300px] overflow-y-auto">
                <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {templateStructure
                    .replace('{title}', 'بدء استقبال طلبات التحويل الداخلي والخارجي للفصل القادم')
                    .replace('{content}', '• فتح بوابة التحويل لجميع التخصصات والكليات العلمية والإنسانية.\n• آخر موعد لرفع الطلبات والوثائق هو يوم الخميس 15 رجب.\n• يشترط ألا يقل المعدل التراكمي عن 3.75 مع استيفاء شروط الكلية.')
                    .replace('{link}', 'https://dar.ksu.edu.sa/admission')
                    .replace('{univ_tag}', 'جامعة_الملك_سعود')}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>📱 مظهر النشر في قناة التلجرام: {targetChannel}</span>
                  <span className="text-emerald-400 font-mono font-bold">جاهز ومعتمد</span>
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>المزامنة التلقائية:</strong> أي تعديل تجريه هنا يظهر مباشرة للبوت في تيليجرام عند طلب <code>/template</code> أو عند إعادة صياغة أي خبر.
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MEMORY BANK & LEARNED RULES VIEW */
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>بنك الذاكرة والقواعد المكتسبة ({memoryRules.length})</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                كافة القوالب والصيغ والتصحيحات التي يتعلمها الذكاء الاصطناعي ويطبقها فوراً في كافة محادثاته وإعادة صياغاته
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingRule(!isAddingRule)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة قاعدة / صيغة جديدة</span>
              </button>

              {memoryRules.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearMemory}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 hover:border-rose-900 rounded-xl text-xs transition-colors"
                  title="مسح بنك الذاكرة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Add Rule Modal/Form */}
          {isAddingRule && (
            <form onSubmit={handleAddManualRule} className="p-4 bg-slate-950 border border-purple-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <BookmarkPlus className="w-4 h-4" />
                  <span>تثبيت قالب أو قاعدة صياغة جديدة</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">نوع التوجيه:</label>
                  <select
                    value={newRuleType}
                    onChange={(e: any) => setNewRuleType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-500"
                  >
                    <option value="template">📐 قالب صيغة معتمد (Template)</option>
                    <option value="rule">📌 قاعدة صياغة مستفادة (Guideline)</option>
                    <option value="correction">⚠️ تصحيح وتعديل خطأ سابق (Correction)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">عنوان القاعدة أو القالب:</label>
                  <input
                    type="text"
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    placeholder="مثال: قالب الإعلانات الأكاديمية الرسمي"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">نص الصيغة / القاعدة / تصحيح الخطأ:</label>
                <textarea
                  rows={4}
                  value={newRuleContent}
                  onChange={(e) => setNewRuleContent(e.target.value)}
                  placeholder="أدخل نص القالب بصيغته الدقيقة (مع الإيموجيات، ومواضع الروابط والهاشتاجات)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newRuleContent.trim() || isSavingRule}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow disabled:opacity-40"
                >
                  {isSavingRule ? 'جاري الحفظ...' : 'حفظ في بنك الذاكرة'}
                </button>
              </div>
            </form>
          )}

          {/* Rules Cards List */}
          {memoryRules.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Brain className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-300">بنك الذاكرة فارغ حالياً</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                ابدأ بمحادثة الذكاء الاصطناعي وأرسل له "اعتمد هذه الصيغة:" أو "تعلم: ..." ليقوم بحفظها هنا تلقائياً وتطبيقها دائماً!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memoryRules.map((r) => {
                const isTemplate = r.type === 'template';
                const isCorrection = r.type === 'correction';
                const badgeColor = isTemplate
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : isCorrection
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/30';

                return (
                  <div
                    key={r.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badgeColor}`}>
                          {isTemplate ? '📐 قالب صيغة معتمد' : isCorrection ? '⚠️ تصحيح خطأ سابق' : '📌 توجيه صياغة مستفاد'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(r.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="حذف القاعدة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h5 className="text-xs font-bold text-white mb-2">{r.title}</h5>
                      <div className="p-3 bg-slate-900 rounded-xl text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap border border-slate-800/80">
                        {r.content}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span>تاريخ الحفظ: {new Date(r.createdAt).toLocaleDateString('ar-SA')}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(r.content);
                          setStatusMessage(`تم نسخ نص "${r.title}"`);
                        }}
                        className="text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ النص</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
