# Frontend + AI Series

Build a real AI feature into a React app: a streaming "Ask Anything" box with a proxy server, proper loading states, and readable errors.

This folder is the code for **Session 1** of the DMC Frontend + AI series. Each session builds on the last, ending with everyone deploying their own AI app.

## Structure

```
frontend-ai/
├── client/   React app (Vite). The UI and the stream reader.
└── server/   Tiny Express proxy. Holds the API key and talks to the model.
```

Why two pieces? **The API key can never live in the browser.** Anything shipped to the browser is public: open devtools, Network tab, and any key in there is exposed. So the browser talks to our server, and only the server talks to the model.

Note from class: frameworks like Next.js can play the server role for you (API routes and server components run server-side, so a key in a server-only env var stays hidden). Same principle, built into the framework. Credit to Austin's question in Session 1.

## Setup

**1. Get a free Gemini API key (no card needed):**
- Go to https://aistudio.google.com and sign in with your Google account
- Click "Get API key" in the left sidebar
- Click "Create API key" (let it create a project if it asks)
- Copy the key and keep it private. Never commit it, never post it in the group.

**2. Server:**

```bash
cd frontend-ai/server
npm install
cp .env.example .env   # then paste your key into .env
npm run dev            # starts on http://localhost:3001
```

If there is no `.env.example` here, create `.env` with one line: `GEMINI_API_KEY=your_key_here`

**3. Client (separate terminal):**

```bash
cd frontend-ai/client
npm install
npm run dev            # opens on http://localhost:5173
```

The Vite dev server proxies `/api` to the Express server, so there is no CORS to deal with.

## Endpoints

| Endpoint | What it does |
|---|---|
| `POST /api/ask` | Simple request and response. Send `{ "prompt": "..." }`, get `{ "text": "..." }` back. |
| `POST /api/ask-stream` | Streaming. Same request, but the answer arrives in chunks as the model generates it. |

Test from the terminal:

```bash
curl -s localhost:3001/api/ask -H "Content-Type: application/json" \
  -d '{"prompt":"Explain closures in one sentence"}'

curl -N localhost:3001/api/ask-stream -H "Content-Type: application/json" \
  -d '{"prompt":"Write 3 tips for junior frontend developers"}'
```

## How the streaming works (short version)

1. The server calls Gemini with `:streamGenerateContent?alt=sse`, so Google sends the answer as server-sent events.
2. The server reads each event, pulls out just the text, and forwards it as plain text chunks.
3. The React app reads the response with `res.body.getReader()`, decodes each chunk, and appends it to state. React re-renders and the answer types itself out.

## Troubleshooting

- **429 or rate-limit errors:** the free tier has per-minute limits. Wait a minute and retry, or create a fresh key. We hit this live in class.
- **404 model not found:** model names rotate. List what your key can use: `curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY" | grep '"name"'` and prefer `gemini-flash-latest`.
- **Server won't start:** check `.env` exists next to `server.mjs` and Node is v20.6 or newer (`node -v`).

## Session 1 assignment

Build your own single-purpose AI UI: a tone rewriter, an idea generator, or a title generator (or your own idea at this size). Requirements:
- Your API key stays on a small server, never in the browser
- Streaming response rendered progressively
- A loading state and a readable error state (test it by killing your server)
- Push to GitHub and drop your repo link in the group

Every submission gets feedback.
