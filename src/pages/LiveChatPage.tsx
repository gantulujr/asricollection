import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, ShieldCheck, CheckCheck } from 'lucide-react';
import { ChatMessage } from '../types';
import { getChatMessages, sendChatMessage, markMessagesAsRead } from '../services/chatStorage';

export const LiveChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    const msgs = getChatMessages();
    setMessages(msgs);
    markMessagesAsRead();
  };

  useEffect(() => {
    loadMessages();

    // Listen to cross-tab or component updates
    const handleUpdate = () => loadMessages();
    window.addEventListener('asri_chat_updated', handleUpdate);
    return () => window.removeEventListener('asri_chat_updated', handleUpdate);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    sendChatMessage('customer', inputText.trim());
    setInputText('');
    loadMessages();
  };

  const handleQuickChip = (text: string) => {
    sendChatMessage('customer', text);
    loadMessages();
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5]">
      {/* Concierge Info Banner */}
      <div className="px-4 py-3 bg-white border-b border-[#EAE4DC] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-serif text-xs font-bold">
              AC
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <h3 className="font-serif text-xs font-bold text-stone-900">Asri VIP Concierge</h3>
            <p className="text-[10px] text-stone-500">Live Support · Respons &lt; 2 menit</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C85A32]" />
          <span>Privasi Aman</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
        {messages.map((msg) => {
          const isCustomer = msg.sender === 'customer';
          const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                  isCustomer
                    ? 'bg-[#C85A32] text-white rounded-tl-xl rounded-tr-xs rounded-bl-xl rounded-br-xl'
                    : 'bg-white text-stone-800 border border-[#EAE4DC] rounded-tl-xs rounded-tr-xl rounded-bl-xl rounded-br-xl'
                }`}
              >
                <p>{msg.text}</p>
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                    isCustomer ? 'text-white/75' : 'text-stone-400'
                  }`}
                >
                  <span>{time}</span>
                  {isCustomer && <CheckCheck className="w-3 h-3 text-white/90" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-4 py-2 bg-[#F3EFEA] border-t border-[#EAE4DC] flex gap-1.5 overflow-x-auto custom-scroll">
        {[
          'Bagaimana garansi keaslian produk?',
          'Berapa lama estimasi pengiriman?',
          'Metode pembayaran Duitku apa saja?',
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => handleQuickChip(chip)}
            className="text-[11px] px-2.5 py-1 bg-white border border-stone-200 text-stone-700 hover:border-[#C85A32] hover:text-[#C85A32] whitespace-nowrap shrink-0 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-[#EAE4DC] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tulis pesan untuk tim Asri Concierge..."
          className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-9 h-9 bg-stone-900 hover:bg-[#C85A32] text-white rounded-none flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs"
          aria-label="Kirim Pesan"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
