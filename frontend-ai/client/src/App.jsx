import { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | streaming | error
  const [error, setError] = useState("");

  async function ask(e) {
    e.preventDefault();
    setAnswer("");
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/ask-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);

        throw new Error(data?.error ?? `The AI service returned an error (${res.status})`)
      }

      setStatus("streaming");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
      }

      const tail = decoder.decode(); // flush any buffered partial character
      if (tail) {
        setAnswer((prev) => prev + tail);
      }

      setStatus("idle");

      console.log('I am here!');

    } catch (err) {
      setStatus("error");
      setError(err.message || "Something went wrong. Please try again.");

      console.log("Error here: ", err);
    }
  }

  const busy = status === "loading" || status === "streaming";

  const buttonLabels = { loading: "Thinking...", streaming: "Clauding..." };
  const buttonLabel = buttonLabels[status] ?? "Ask";

  return (
    <main style={{ maxWidth: 1024, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Ask Anything</h1>
      <form onSubmit={ask}>
        <textarea 
          rows={2} 
          style={{ width: "100%", padding: 8 }} 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask me anything..." />

        <button disabled={busy || !prompt.trim()} style={{ marginTop: 8, padding: "8px 16px"}}>
          {buttonLabel}
        </button>
      </form>

      {status === "error" && (
        <p style={{ color: "red", marginTop: 12}}>{error}</p>
      )}

      { answer && (
        <pre style={{ whitespace: "break-space", marginTop: 16, padding: 12}}>{answer}</pre>
      )}
    </main>
  );
}
