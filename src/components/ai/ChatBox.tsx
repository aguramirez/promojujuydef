"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, Loader2, MessageSquare, Bot } from "lucide-react";

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

const STORAGE_KEY = "promo_jujuy_chat_history";
const TTL = 12 * 60 * 60 * 1000; // 12 hours

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmittedData, setHasSubmittedData] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history and lead status from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { history, timestamp } = JSON.parse(saved);
      if (Date.now() - timestamp < TTL) {
        setMessages(history);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const leadSaved = localStorage.getItem("hasSubmittedData");
    if (leadSaved === "true") {
      setHasSubmittedData(true);
    }
  }, []);

  // Prevent landing page scroll when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  // Save history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        history: messages,
        timestamp: Date.now()
      }));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: "user", parts: [{ text: textToSend }] };
    const newMessages = [...messages, userMessage];
    
    // Limit to last 10 messages for token efficiency
    const limitedMessages = newMessages.slice(-10);
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: limitedMessages.slice(0, -1), // Send history minus the current message
        }),
      });


      const data = await response.json();
      if (data.text) {
        setMessages([...newMessages, { role: "model", parts: [{ text: data.text }] }]);
      } else {
        throw new Error(data.error || "Error en el chat");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: "model", parts: [{ text: "Lo siento, tuve un problema. ¿Podés intentar de nuevo?" }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractButtons = (text: string) => {
    const buttonRegex = /\[BUTTON:\s*(.*?)\]/g;
    const buttons = [];
    let match;
    while ((match = buttonRegex.exec(text)) !== null) {
      buttons.push(match[1]);
    }
    return buttons;
  };

  const cleanText = (text: string) => {
    return text.replace(/\[BUTTON:.*?\]/g, "").trim();
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          id="chatbot-open-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center ai-glow-bg text-white p-3.5 rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
        >
          <span className="relative flex h-8 w-8 items-center justify-center shrink-0">
            <span className="relative flex h-7 w-7 rounded-full bg-white/20 items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </span>
          </span>
          {/* Hidden by default, expands on hover */}
          <div className="flex flex-col items-start leading-none max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-3 group-hover:mr-2 transition-all duration-300 whitespace-nowrap overflow-hidden">
            <span className="text-xs font-semibold tracking-wide">Asistente IA</span>
            <span className="text-[10px] text-white/75 mt-0.5">¿En qué te ayudo?</span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          id="chatbot-window"
          className="fixed z-50 flex flex-col overflow-hidden shadow-2xl
            bottom-0 inset-x-0 w-full h-[78vh] rounded-t-3xl
            sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[540px] sm:rounded-2xl"
        >
          <div className="absolute inset-0 ai-glow-border rounded-t-3xl sm:rounded-2xl z-0 pointer-events-none" />
          <div className="absolute inset-[2px] bg-white dark:bg-neutral-950 rounded-t-[22px] sm:rounded-[20px] z-[1]" />

          <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">Promo Jujuy Bot</p>
                <p className="text-xs text-emerald-500 font-medium">● En línea</p>
              </div>
            </div>
            <button
              id="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 self-start rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
                ¡Hola! Soy el asistente de Promo Jujuy. ¿Qué tipo de promoción o comida estás buscando hoy?
              </div>
            )}
            {messages.map((msg, i) => {
              const buttons = extractButtons(msg.parts[0].text);
              const textContent = cleanText(msg.parts[0].text);

              return (
                <div key={i} className="flex flex-col gap-2">
                  <div
                    className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-white self-end rounded-br-sm"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 self-start rounded-bl-sm"
                    }`}
                  >
                    {textContent}
                  </div>
                  {msg.role === "model" && buttons.length > 0 && (
                    <div className="flex flex-wrap gap-2 self-start mb-2">
                      {buttons.map((btn, bi) => (
                        <button
                          key={bi}
                          onClick={() => handleSend(btn)}
                          className="bg-white dark:bg-neutral-900 border border-primary text-primary px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 self-start rounded-2xl rounded-tl-sm px-4 py-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Pensando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* Lead Capture Overlay */}
            {messages.length >= 2 && !hasSubmittedData && (
              <div className="absolute inset-0 backdrop-blur-md bg-white/60 dark:bg-black/60 z-20 flex items-center justify-center p-5">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-bold text-base text-center mb-1">¡Casi llegás!</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-4">
                    Dejanos tus datos para seguir descubriendo promociones con nuestro asistente.
                  </p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get('name') as string;
                    const email = formData.get('email') as string;
                    const whatsapp = formData.get('whatsapp') as string;
                    
                    if (name && email && whatsapp) {
                      try {
                        const res = await fetch('/api/leads', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name, email, whatsapp })
                        });
                        if (res.ok) {
                          setHasSubmittedData(true);
                          localStorage.setItem("hasSubmittedData", "true");
                        }
                      } catch (err) {
                        console.error('Error submitting form', err);
                      }
                    }
                  }}>
                    <input name="name" required type="text" placeholder="Tu nombre" className="w-full mb-2 px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 outline-none focus:border-primary transition-colors" />
                    <input name="email" required type="email" placeholder="Tu email" className="w-full mb-2 px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 outline-none focus:border-primary transition-colors" />
                    <input name="whatsapp" required type="tel" placeholder="Tu WhatsApp (ej: 3884123456)" className="w-full mb-4 px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 outline-none focus:border-primary transition-colors" />
                    <button
                      type="submit"
                      className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 active:scale-95 transition-all"
                    >
                      Desbloquear Chat Gratis
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 bg-white dark:bg-neutral-950">
            <input
              id="chatbot-input"
              type="text"
              placeholder="Escribí un mensaje..."
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm outline-none border-2 border-transparent focus:border-primary transition-colors placeholder:text-neutral-400 disabled:opacity-50"
            />
            <button
              id="chatbot-send-btn"
              onClick={() => handleSend()}
              disabled={isLoading}
              className="w-10 h-10 shrink-0 rounded-full bg-primary text-white flex items-center justify-center hover:bg-red-700 active:scale-90 transition-all shadow-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
