import express from "express";

const app = express();
app.disable("x-powered-by");
app.use(express.json());

const PORT = 3001;
const MODEL = "gemini-flash-latest";
const KEY = process.env.GEMINI_API_KEY;
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

if (!KEY) throw new Error("GEMINI_API_KEY is not set");

// v1: simple request/response.
app.post("/api/ask", async (req, res) => {
  const { prompt } = req.body ?? {};

  if (!prompt?.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const response = await fetch(
      `${BASE}/${MODEL}:generateContent?key=${KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("/api/ask model error:", response.status, detail);
      return res.status(502).json({ error: "Model call failed" });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    res.json({ text });
  } catch (err) {
    console.error("/api/ask failed:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// v2: streaming. Same call with :streamGenerateContent + alt=sse.
app.post("/api/ask-stream", async (req, res) => {
  const { prompt } = req.body ?? {};

  if (!prompt?.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const response = await fetch(
      `${BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("/api/ask-stream model error:", response.status, detail);
      return res.status(502).json({ error: "Model call failed" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep the incomplete last line for the next chunk

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(line.slice("data: ".length));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) res.write(text);
        } catch {
          // ignore lines that are not valid JSON
        }
      }
    }

    res.end();
  } catch (err) {
    console.error("/api/ask-stream failed:", err);
    if (res.headersSent) {
      res.end(); // stream already started; just close it
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
});

// v3: multi-turn chat. Takes the whole conversation and streams the reply.
app.post("/api/chat-stream", async (req, res) => {
  const { messages } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages are required" });
  }

  try {
    // Gemini wants { role, parts }. Our "assistant" maps to Gemini's "model".
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `${BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("/api/chat-stream model error:", response.status, detail);
      return res.status(502).json({ error: "Model call failed" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep the incomplete last line for the next chunk

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(line.slice("data: ".length));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) res.write(text);
        } catch {
          // ignore non-JSON keep-alive lines
        }
      }
    }

    res.end();
  } catch (err) {
    console.error("/api/chat-stream failed:", err);
    if (res.headersSent) {
      res.end();
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
});

app.listen(PORT, () =>
  console.log(`Proxy running on http://localhost:${PORT}`),
);
