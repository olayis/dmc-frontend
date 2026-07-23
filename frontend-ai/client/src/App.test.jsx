import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// Fakes a streamed fetch Response: each chunk comes back from one reader.read() call,
// exactly like the real /api/chat-stream endpoint does.
function mockStreamResponse(chunks) {
  let i = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader() {
        return {
          async read() {
            if (i < chunks.length) {
              return { done: false, value: new TextEncoder().encode(chunks[i++]) };
            }
            return { done: true, value: undefined };
          },
        };
      },
    },
  };
}

function mockErrorResponse(status) {
  return { ok: false, status };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AI Chat", () => {
  // Test 1: no fetch mock needed at all — nothing has been sent yet,
  // so this just proves the app renders.
  it("shows the empty state before any message is sent", () => {
    render(<App />);
    expect(screen.getByText(/ask anything/i)).toBeInTheDocument();
  });

  // Test 2: fetch is mocked but never resolves, so we can check what the UI
  // does the INSTANT you hit send, before any AI reply comes back.
  it("shows the user's message immediately and disables the form while sending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})), // hangs on purpose — we're not testing the reply here
    );
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Message"), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByText("hi")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("");
    expect(screen.getByLabelText("Message")).toBeDisabled();
  });

  // Test 3: the payoff. We fake the AI's reply and prove our app renders it,
  // without calling Gemini or spending a single token.
  it("streams a mocked AI reply into the assistant bubble", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(mockStreamResponse(["Hello", " there!"]))),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Message"), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Hello there!")).toBeInTheDocument();
  });

  // Test 4: the server says no. Confirm the error shows and the empty
  // assistant bubble we optimistically added gets cleaned up.
  it("shows a readable error and removes the empty bubble when the server fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(mockErrorResponse(500))));
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.type(screen.getByLabelText("Message"), "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText(/AI service returned an error \(500\)/i)).toBeInTheDocument();

    const bubbles = within(container).getAllByText(/./, { selector: ".bubble" });
    expect(bubbles).toHaveLength(1); // only the user's "hi" bubble is left
  });
});
