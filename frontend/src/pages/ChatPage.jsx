import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import Sidebar from "../components/Sidebar";
import useChat from "../hooks/useChat";
import useChatSessions from "../hooks/useChatSessions";

export default function ChatPage() {
  const {
    sessions,
    activeId,
    activeSession,
    setActiveId,
    createSession,
    updateMessages,
    renameSession,
    deleteSession,
  } = useChatSessions();

  const { messages, sendMessage, loading } = useChat({
    session: activeSession,
    updateMessages,
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Shopping Assistant AI</h1>
      </div>

      <div className="flex flex-row flex-1 overflow-hidden">
        <Sidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={setActiveId}
          onNewChat={createSession}
          onRenameChat={renameSession}
          onDeleteChat={deleteSession}
        />

        <div className="flex flex-col flex-1 max-w-3xl mx-auto bg-white py-4 gap-4 overflow-hidden">
          {activeSession ? (
            <>
              <ChatWindow messages={messages} loading={loading} />
              <ChatInput
                onSend={sendMessage}
                disabled={loading}
                onVoice={() => console.log("voice clicked")}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select or create a chat
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
