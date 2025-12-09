import { useState } from "react";
import axios from "axios";
import "../src/App.css"; 

const Chat = () => {
  
  const apiUrl=import.meta.env.VITE_API_URL
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setIsTyping(true);

    
    setMessages(prev => [
      ...prev,
      { role: "bot", content: "Replying..." }
    ]);

    try {
      const res = await axios.post(apiUrl, { query, sessionId });
      setSessionId(res.data.sessionId);

     
      setMessages(prev =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? { role: "bot", content: res.data.reply }
            : msg
        )
      );
    } catch (err) {
      console.error("API Error:", err);
      setMessages(prev =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? { role: "bot", content: "Error getting response." }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const resetChat = async () => {
    if (!sessionId) return;
    await axios.delete(`${apiUrl}/clear/${sessionId}`);
    setMessages([]);
    setSessionId("");
  };

  return (
    <div className="chat-container">
      <h2> News RAG Chatbot</h2>

      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>

      <div className="input-box">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something about news..."
          disabled={isTyping}
        />
        <button onClick={sendMessage} disabled={isTyping}>
          {isTyping ? "Sending..." : "Send"}
        </button>
        <button className="reset" onClick={resetChat}>Reset</button>
      </div>
    </div>
  );
};

export default Chat;
