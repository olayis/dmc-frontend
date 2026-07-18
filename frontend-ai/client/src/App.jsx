import { useState, useEffect } from "react";

const STORAGE_KEY = "ai-chat-history";

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export default function App() {
  const [messages, setMessages] = useState(loadHistory); // [{ role, content }]
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | streaming | error
  const [error, setError] = useState("");

  // persist the conversation whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setError("");

    const history = [...messages, { role: "user", content: input }];
    // show the user's message + an empty assistant bubble we'll stream into
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStatus("loading");

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error(`The AI service returned an error (${res.status})`);
      setStatus("streaming");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // append the chunk to the LAST message (immutably)
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Something went wrong.");
      setMessages((prev) => prev.slice(0, -1)); // drop the empty assistant bubble
    }
  }

  const busy = status === "loading" || status === "streaming";

  return (
    <main className="chat">
      <header className="chat__header">
        <h1 className="chat__title">AI Chat</h1>
        <button
          type="button"
          className="chat__clear"
          onClick={() => setMessages([])}
          disabled={busy || messages.length === 0}
        >
          Clear
        </button>
      </header>

      <div className="chat__messages">
        {messages.length === 0 && (
          <p className="chat__empty">Ask anything — replies stream in as they generate.</p>
        )}
        {messages.map((m, i) => {
          const pending = m.role === "assistant" && !m.content && status === "loading";
          return (
            <div
              key={i}
              className={[
                "bubble",
                m.role === "user" ? "bubble--user" : "bubble--assistant",
                pending ? "bubble--pending" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {m.content || (pending ? "…" : "")}
            </div>
          );
        })}
      </div>

      {status === "error" && <p className="chat__error">{error}</p>}

      <form className="chat__form" onSubmit={send}>
        <input
          className="chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={busy}
          aria-label="Message"
        />
        <button className="chat__send" type="submit" disabled={busy || !input.trim()}>
          {busy ? "…" : "Send"}
        </button>
      </form>
    </main>
  );
}
