import { useState } from "react";

// On purpose the wrong way: this key gets bundled into the browser.
const KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${KEY}`;

export default function ExposedKeyDemo() {
  const [answer, setAnswer] = useState("");

  async function askDirectly() {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Say hi in one sentence" }] }] }),
    });

    if (!response.ok) {
      setAnswer(`Request failed (${response.status})`);
      return;
    }

    const data = await response.json();
    setAnswer(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>The exposed key</h1>
      <button onClick={askDirectly}>Ask Gemini straight from the browser</button>
      <pre style={{ whiteSpace: "pre-wrap" }}>{answer}</pre>
    </div>
  );
}
