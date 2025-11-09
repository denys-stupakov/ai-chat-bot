import { useRef, useState } from "react";

export default function useRecorder({
  endpoint = "https://eu-api.lemonfox.ai/v1/audio/transcriptions",
  lang = "auto",
} = {}) {
  const mediaRec = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [recording, setRecording] = useState(false);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    mediaRec.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRec.current.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    mediaRec.current.start();
    setRecording(true);
  };

  const stopAndTranscribe = async () => {
    if (!mediaRec.current) return "";

    await new Promise((res) => {
      mediaRec.current.onstop = res;
      mediaRec.current.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);

    const file = new Blob(chunksRef.current, { type: "audio/webm" });

    const body = new FormData();
    body.append("file", file, "audio.webm");
    if (lang !== "auto") body.append("language", lang);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${import.meta.env.VITE_LEMONFOX_API_KEY}` },
      body,
    });

    if (!res.ok) return "";
    return (await res.json()).text || "";
  };

  return { recording, start, stopAndTranscribe };
}