import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages, loading }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div
      ref={boxRef}
      className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-accent rounded-md pb-24"
    >
      {messages.map((msg, i) => (
        <MessageBubble key={i} {...msg} />
      ))}

      {loading && <div className="text-gray-500 text-sm animate-pulse">Assistant is thinking…</div>}
    </div>
  );
}
