export default function useChat({ session, updateMessages }) {
  const { messages } = session || {};

  const sendMessage = async (text) => {
    const newMsgs = [...messages, { role: "user", text }];
    updateMessages(session.id, newMsgs);

    try {
      const res = await fetch("http://localhost:8000/api/chat/process_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();

      updateMessages(session.id, [
        ...newMsgs,
        { role: "assistant", text: data.response },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      updateMessages(session.id, [
        ...newMsgs,
        { role: "assistant", text: "Server error. Try again." },
      ]);
    }
  };

  return { messages, sendMessage };
}
