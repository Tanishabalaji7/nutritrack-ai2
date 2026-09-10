"use client";

import { useEffect, useRef, useState } from "react";

const QUICK_ACTIONS = [
  "🇮🇳 Suggest a high-protein Indian dinner",
  "🔥 What's my calorie & deficit status today?",
  "🍲 Log 2 rotis and palak paneer for dinner",
  "🔎 Suggest a breakfast under 400 kcal",
  "💧 Log 500ml water",
];

export default function NutriBotPage() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me");
      setUser((await meRes.json()).user);
      const chatRes = await fetch("/api/chat");
      const chatData = await chatRes.json();
      setMessages(chatData.messages || []);
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(text) {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setError("");
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message || "The AI assistant is unavailable right now.");
    } finally {
      setSending(false);
    }
  }

  async function clearHistory() {
    await fetch("/api/chat", { method: "DELETE" });
    setMessages([]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs font-bold text-plum tracking-wide">INTELLIGENT NUTRITION COACH</div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-maroonDark">NutriBot AI Assistant</h1>
            <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Gemini Active
            </span>
          </div>
          <p className="text-maroonDark/60 text-sm mt-1">
            Ask any nutrition, meal, recipe, or fitness question across global &amp; Indian cuisines, compute deficits, or log meals via natural language.
          </p>
        </div>
        <button onClick={clearHistory} className="btn-secondary text-sm shrink-0">Clear History</button>
      </div>

      <div ref={scrollRef} className="card flex-1 overflow-y-auto flex flex-col gap-4 mb-4">
        {messages.length === 0 && (
          <div className="text-maroonDark/50 text-sm italic text-center py-10">
            Say hello to NutriBot, or describe what you ate to log it instantly.
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 whitespace-pre-wrap text-sm ${
                m.role === "user" ? "bg-plum text-white" : "bg-blush/30 text-maroonDark"
              }`}
            >
              {m.role === "assistant" && (
                <div className="text-[10px] font-bold text-plum/70 mb-1">✨ NUTRIBOT</div>
              )}
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-blush/30 text-maroonDark rounded-2xl px-4 py-3 text-sm italic">NutriBot is thinking…</div>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      <div className="flex gap-2 flex-wrap mb-3">
        {QUICK_ACTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q.replace(/^\S+\s/, ""))}
            className="text-xs bg-creamLight border border-blush rounded-full px-3 py-2 hover:bg-blush/30 text-maroonDark"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex gap-3"
      >
        <input
          className="input-field"
          placeholder="Ask anything or describe what you ate (e.g. 'I had 2 rotis and dal tadka for lunch')…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={sending}>
          Send
        </button>
      </form>
    </div>
  );
}
