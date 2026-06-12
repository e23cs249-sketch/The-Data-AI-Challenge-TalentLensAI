import { useState } from "react";
import { motion } from "framer-motion";
import { getAIResponse } from "../utils/chatEngine";

export default function ChatBot({ data }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm your AI assistant for candidate analysis. Ask me about scores, rankings, and explainability. Try: 'What's the average score?' or 'How does scoring work?'" }
  ]);

  const [input, setInput] = useState("");

  const suggestedQuestions = [
    "What's the average score?",
    "Show top 5 candidates",
    "How does scoring work?",
    "Semantic vs rule-based?",
    "Score distribution?",
  ];

  const send = (event, customInput = null) => {
    event?.preventDefault?.();
    const trimmed = (customInput || input).trim();
    if (!trimmed) return;

    const userMsg = { role: "user", text: trimmed };
    const botMsg = {
      role: "bot",
      text: getAIResponse(trimmed, data)
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card chat-panel"
    >
      <div className="chat-header">
        <div>
          <span className="eyebrow">AI Assistant</span>
          <h3>Candidate Analysis & Explainability</h3>
        </div>
      </div>

      <div className="chat-history">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "chat-bubble user" : "chat-bubble bot"}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="suggested-questions">
        <small className="suggestion-label">Quick questions:</small>
        <div className="suggestion-buttons">
          {suggestedQuestions.map((q) => (
            <motion.button
              key={q}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => send(e, q)}
              className="suggestion-button"
            >
              {q}
            </motion.button>
          ))}
        </div>
      </div>

      <form className="chat-actions" onSubmit={send}>
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about scores, candidates, methodology, or explanations..."
        />
        <button type="submit" className="button button-primary">
          Send
        </button>
      </form>
    </motion.section>
  );
}
