import { useState } from "react";

export default function Sidebar({
  sessions,
  activeId,
  onSelect,
  onNewChat,
  onRenameChat,
  onDeleteChat,
}) {
  const [editingId, setEditingId] = useState(null);
  const [tempTitle, setTempTitle] = useState("");

  const startEdit = (session) => {
    setEditingId(session.id);
    setTempTitle(session.title);
  };

  const finishEdit = () => {
    if (tempTitle.trim()) {
      onRenameChat(editingId, tempTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-64 border-r h-full flex flex-col">
      <button
        className="p-3 m-2 bg-original text-white rounded cursor-pointer"
        onClick={onNewChat}
      >
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`p-3 cursor-pointer flex items-center justify-between gap-2
              ${s.id === activeId ? "bg-gray-200 font-semibold" : ""}
            `}
          >
            <div
              className="flex-1"
              onClick={() => onSelect(s.id)}
            >
              {editingId === s.id ? (
                <input
                  autoFocus
                  className="border rounded px-1 py-0.5 w-full"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={finishEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finishEdit();
                  }}
                />
              ) : (
                s.title
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="hover:opacity-75"
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(s);
                }}
              >
                <img
                  src="./edit_icon.svg"
                  alt="edit"
                  className="w-5 h-5"
                />
              </button>

              <button
                className="hover:opacity-75"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(s.id);
                }}
              >
                <img
                  src="./trash_icon.svg"
                  alt="delete"
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
