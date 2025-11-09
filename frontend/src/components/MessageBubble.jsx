export default function MessageBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-2 rounded-md max-w-[45%] text-sm whitespace-pre-wrap break-words
        ${isUser ? "bg-original text-white" : "bg-gray-100"}`}
      >
        {text}
      </div>
    </div>
  );
}
