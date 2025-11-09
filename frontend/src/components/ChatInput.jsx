import { useState } from "react";
import useRecorder from "../hooks/useRecorder";

export default function ChatInput({ onSend, disabled }) {
  const [input, setInput] = useState("");
  const [lang, setLang] = useState("auto");

  const { recording, start, stopAndTranscribe } = useRecorder({ lang });

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onVoiceClick = async () => {
    if (!recording) {
      await start();
      return;
    }
    const text = await stopAndTranscribe();
    if (text) onSend(text);
  };

  return (
    <div
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2
        w-[90%] max-w-[650px]
        border border-[2px] rounded-md bg-accent
        focus-within:border-original p-3
      "
    >
      <div className="flex items-center gap-2">
        <select
          className="text-sm border rounded px-2 py-2 bg-white"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={disabled || recording}
        >
          <option value="auto">auto</option>
          <option value="sk">slovensky</option>
          <option value="en">english</option>
        </select>

        <textarea
          className="flex-1 p-2 text-sm resize-none focus:outline-none
                     h-10 max-h-32 overflow-y-auto"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
        />

        <button
          onClick={onVoiceClick}
          disabled={disabled}
          className={`px-3 py-2 rounded-md ${
            recording ? "bg-red-100 text-white" : "bg-blue-100 text-white"
          } disabled:opacity-50`}
        >
          {recording ? <img src="./mic_off_icon.svg" className="w-5 h-5" /> : <img src="./mic_icon.svg" className="w-5 h-5" />}
        </button>

        <button
          onClick={submit}
          disabled={disabled}
          className="bg-original text-white px-3 py-2 rounded-md disabled:opacity-50"
        >
          <img src="./send_button.svg" className="h-5" />
        </button>
      </div>
    </div>
  );
}
