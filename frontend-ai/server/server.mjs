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
app.post("/api/ask", async (req, res) => {});

// v2: streaming. Same call with :streamGenerateContent + alt=sse.
app.post("/api/ask-stream", async (req, res) => {});

app.listen(PORT, () =>
  console.log(`Proxy running on http://localhost:${PORT}`),
);
