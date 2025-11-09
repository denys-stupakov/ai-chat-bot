import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";

export default function useChatSessions() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("chatSessions");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(sessions));
  }, [sessions]);

  const createSession = () => {
    const id = uuid();
    const newSession = { id, title: "New Chat", messages: [] };
    setSessions((s) => [newSession, ...s]);
    setActiveId(id);
  };

  const updateMessages = (id, messages) => {
    setSessions((s) => s.map((c) => (c.id === id ? { ...c, messages } : c)));
  };

  const renameSession = (id, title) => {
    setSessions((s) => s.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const deleteSession = (id) => {
    setSessions((s) => s.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const activeSession = sessions.find((s) => s.id === activeId);

  return {
    sessions,
    activeId,
    activeSession,
    setActiveId,
    createSession,
    updateMessages,
    renameSession,
    deleteSession,
  };
}
