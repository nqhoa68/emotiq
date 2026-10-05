import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { Sparkles, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import ftuLogo from '../assets/FTU-logo.png';

import { useAppContext } from '../contexts/AppContext';
import type { Message } from '../contexts/AppContext';

const AutoResizeTextarea = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      rows={3}
    />
  );
};

export default function ChatView() {
  const { messages, setMessages, chatInput: inputValue, setChatInput: setInputValue } = useAppContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue
    };

    const botMessageId = (Date.now() + 1).toString();
    const botLoadingMessage: Message = {
      id: botMessageId,
      type: 'bot',
      text: 'Đang phân tích...',
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, botLoadingMessage]);
    setInputValue('');

    try {
      const responseData = await apiService.analyzeReview(userMessage.text);

      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? {
            ...msg,
            isLoading: false,
            text: 'Dưới đây là kết quả phân tích review của bạn:',
            analysis: responseData
          }
          : msg
      ));
    } catch (error: any) {
      console.error(error);
      let errorMessage = '❌ Đã xảy ra lỗi khi kết nối với server phân tích. Vui lòng kiểm tra xem backend đã hoạt động chưa.';

      if (error.message) {
        errorMessage = `❌ Lỗi: ${error.message}`;
      }

      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? {
            ...msg,
            isLoading: false,
            text: errorMessage
          }
          : msg
      ));
    }
  };

  const renderStars = (star: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={i < star ? "text-amber-400" : "text-slate-600"}>
        ★
      </span>
    ));
  };

  const handleGenerateReply = async () => {
    const lastBotMsgIndex = messages.map(m => !!m.analysis).lastIndexOf(true);
    if (lastBotMsgIndex === -1) return;

    const lastMsg = messages[lastBotMsgIndex];
    if (lastMsg.isGeneratingReply) return; // đang generate thì không bấm tiếp

    // Tìm tin nhắn user ngay trước đó
    const userMsg = messages[lastBotMsgIndex - 1];
    const reviewText = userMsg?.text || '';

    setMessages(prev => prev.map((msg, idx) =>
      idx === lastBotMsgIndex ? { ...msg, isGeneratingReply: true, isErrorReply: false } : msg
    ));

    try {
      const customKey = localStorage.getItem('gemini_custom_api_key') || undefined;

      const responseData = await apiService.generateReply(reviewText, lastMsg.analysis!.aspects, customKey);

      setMessages(prev => prev.map((msg, idx) =>
        idx === lastBotMsgIndex ? { ...msg, isGeneratingReply: false, reply: responseData.reply, isErrorReply: false } : msg
      ));
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message ? `⚠️ ${error.message}` : '⚠️ Đã xảy ra sự cố khi kết nối với AI. Vui lòng thử lại.';

      setMessages(prev => prev.map((msg, idx) =>
        idx === lastBotMsgIndex ? { ...msg, isGeneratingReply: false, reply: errorMessage, isErrorReply: true } : msg
      ));
    }
  };

  const handleCopyReply = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canGenerateReply = messages.some(m => !!m.analysis) && !messages.some(m => m.isGeneratingReply);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-white/5 max-w-4xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg">
            <img src={ftuLogo} alt="FTU Logo" className="w-full h-full object-cover scale-100 rounded-full" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 z-10"></div>
          </div>
          <div>
            <h1 className="text-lg font-semibold bg-linear-to-r from-indigo-500 to-purple-500 dark:from-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">Emotiq AI</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Online</p>
          </div>
        </div>
        <button
          onClick={handleGenerateReply}
          disabled={!canGenerateReply}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-indigo-500 dark:text-indigo-300 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white dark:disabled:hover:bg-white/5 cursor-pointer shadow-sm"
        >
          <Sparkles size={16} />
          Tạo phản hồi tự động
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out`}
          >
            <div className={`rounded-2xl p-4 transition-all duration-300 ${msg.type === 'user'
                ? 'max-w-[85%] sm:max-w-[75%] bg-linear-to-br from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 text-white rounded-br-none shadow-md shadow-indigo-200/50 dark:shadow-none'
                : `${(msg.reply || msg.isGeneratingReply) ? 'w-full max-w-[95%] sm:max-w-[85%]' : 'max-w-[85%] sm:max-w-[75%] w-fit'} bg-white border border-slate-100 dark:bg-slate-800 dark:border-none rounded-bl-none text-slate-700 dark:text-slate-200 shadow-sm shadow-slate-200/50 dark:shadow-none`
              }`}>
              {msg.isLoading ? (
                <div className="flex items-center gap-2 text-indigo-300">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="leading-relaxed">{msg.text}</p>

                  {msg.analysis && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Kết quả nhận diện</div>

                      {msg.analysis.aspects.length > 0 ? (
                        <div className="grid gap-2">
                          {msg.analysis.aspects.map((aspect, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5">
                              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                <div className="px-2.5 py-1 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-medium uppercase tracking-wide">
                                  {aspect.aspect}
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {(aspect.probability * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex text-sm tracking-widest" title={`${aspect.star} sao`}>
                                  {renderStars(aspect.star)}
                                </div>
                                <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md ml-1 whitespace-nowrap">
                                  {aspect.description.replace(/[^a-zA-ZÀ-ỹ\s]/g, '').trim()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/80 text-sm">
                          Không tìm thấy khía cạnh dịch vụ nào (tất cả xác suất đều &lt; 50%).
                        </div>
                      )}

                      {/* --- Vùng Auto Reply --- */}
                      {msg.isGeneratingReply && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                          <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 text-sm font-medium mb-3">
                            <Sparkles size={16} className="animate-pulse" /> AI đang soạn câu trả lời...
                          </div>
                          <div className="space-y-2 animate-pulse">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-5/6"></div>
                          </div>
                        </div>
                      )}

                      {msg.reply && !msg.isGeneratingReply && (
                        <div className={`mt-4 pt-4 border-t ${msg.isErrorReply ? 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 mt-2' : 'border-slate-200 dark:border-white/10 flex flex-col relative'}`}>
                          {msg.isErrorReply && (
                            <div className="flex items-center gap-2 text-sm font-medium mb-2 text-amber-600 dark:text-amber-400">
                              <AlertTriangle size={16} />
                              Lỗi Phản hồi AI
                            </div>
                          )}
                          {!msg.isErrorReply ? (
                            <div className="bg-indigo-50/50 border border-indigo-100 dark:bg-slate-900 dark:border-slate-700 rounded-xl overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-100/50 dark:bg-slate-800/80 border-b border-indigo-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                                  <Sparkles size={16} />
                                  Gợi ý Phản hồi Tự động
                                </div>
                                <button
                                  onClick={() => handleCopyReply(msg.reply || '', msg.id)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white transition-all duration-200 cursor-pointer"
                                  title="Copy"
                                >
                                  {copiedId === msg.id ? (
                                    <>
                                      <CheckCircle2 size={14} className="text-emerald-500 dark:text-emerald-400" />
                                      <span className="text-emerald-500 dark:text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={14} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <AutoResizeTextarea
                                className="w-full bg-transparent p-5 text-[15px] leading-relaxed text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-0 resize-none overflow-hidden"
                                value={msg.reply || ''}
                                onChange={(val) => {
                                  setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reply: val } : m));
                                }}
                              />
                            </div>
                          ) : (
                            <div className="text-amber-600 dark:text-amber-200/90 text-sm leading-relaxed">
                              {msg.reply.replace(/^⚠️\s*/, '')}
                            </div>
                          )}
                        </div>
                      )}
                      {/* ---------------------- */}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nhập review tiếng Việt của bạn ở đây..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </form>
      </div>

    </div>
  );
}
