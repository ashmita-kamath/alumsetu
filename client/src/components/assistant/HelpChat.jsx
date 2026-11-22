import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

/**
 * Floating "Help" assistant, shown on every page (see MainLayout).
 *
 *   GET  /assistant            → greeting + suggested questions (once, on first open)
 *   POST /assistant {message}  → { answer, links, items, suggestions }
 *
 * The backend matches the question to a help topic (TF-IDF) and, for some
 * topics, adds live data: the student's mentor matches, next events, newest jobs.
 * Messages live only in this component; nothing is saved.
 */
export default function HelpChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { from: "user" | "bot", text, links, items, suggestions }
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  // A different person logged in or out: start a fresh conversation
  useEffect(() => {
    setMessages([]);
  }, [user?.id]);

  // Load the greeting the first time the panel opens
  useEffect(() => {
    if (!open || messages.length > 0) return;
    api
      .get("/assistant")
      .then((w) => setMessages([{ from: "bot", text: w.answer, suggestions: w.suggestions }]))
      .catch(() => setMessages([{ from: "bot", text: "Hi! Ask me about mentors, events, jobs or how to use AlumSetu." }]));
  }, [open, messages.length]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const send = async (question) => {
    const message = question.trim();
    if (!message || busy) return;
    setText("");
    setMessages((prev) => [...prev, { from: "user", text: message }]);
    setBusy(true);
    try {
      const reply = await api.post("/assistant", { message });
      setMessages((prev) => [...prev, { from: "bot", text: reply.answer, links: reply.links, items: reply.items, suggestions: reply.suggestions }]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: "bot", text: err.message }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <div
          id="help-chat"
          role="dialog"
          aria-label="AlumSetu help assistant"
          onKeyDown={(e) => e.key === "Escape" && close()}
          className="fixed inset-x-4 bottom-20 z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-card shadow-xl sm:inset-x-auto sm:right-6 sm:w-96"
        >
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-white">
            <p className="font-heading font-bold">AlumSetu assistant</p>
            <button type="button" onClick={close} aria-label="Close help" className="rounded p-1 text-xl leading-none hover:bg-white/10">
              ×
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((m, i) =>
              m.from === "user" ? (
                <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-orange px-3 py-2 text-sm text-white">
                  {m.text}
                </p>
              ) : (
                <BotMessage key={i} message={m} onAsk={send} onNavigate={() => setOpen(false)} />
              )
            )}
            {busy && <p className="text-sm text-body/70">Typing…</p>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex gap-2 border-t border-gray-100 p-3"
          >
            <label htmlFor="help-input" className="sr-only">
              Your question
            </label>
            <input
              ref={inputRef}
              id="help-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              placeholder="Ask a question…"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-orange/50"
            />
            <button type="submit" disabled={busy || !text.trim()} className="rounded-lg bg-orange px-4 text-sm font-semibold text-white hover:bg-orange-dark disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="help-chat"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange sm:right-6"
      >
        <span aria-hidden="true">💬</span>
        {open ? "Close help" : "Need help?"}
      </button>
    </>
  );
}

function BotMessage({ message, onAsk, onNavigate }) {
  const { text, links = [], items = [], suggestions = [] } = message;
  return (
    <div className="max-w-[90%] space-y-2">
      <p className="w-fit rounded-2xl rounded-bl-sm bg-cream px-3 py-2 text-sm text-navy">{text}</p>

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.to}>
              <Link to={item.to} onClick={onNavigate} className="block rounded-lg border border-gray-200 px-3 py-2 hover:border-orange">
                <span className="block text-sm font-semibold text-navy">{item.title}</span>
                {item.subtitle && <span className="block text-xs">{item.subtitle}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={onNavigate} className="rounded-full border border-orange px-3 py-1 text-xs font-semibold text-orange-dark hover:bg-orange hover:text-white">
              {l.label} →
            </Link>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => onAsk(s)} className="rounded-full border border-gray-300 px-3 py-1 text-xs text-navy hover:border-navy">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
