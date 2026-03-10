import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Pause, Play, Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";

export default function LiveRecord() {
  // --- State ---
  const [status, setStatus] = useState("idle"); // idle | recording | paused | processing | done | error
  const [transcript, setTranscript] = useState("");
  const [mom, setMom] = useState("");
  const [momId, setMomId] = useState(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  // --- Refs ---
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const chunkIntervalRef = useRef(null);
  const isRecordingRef = useRef(false);

  // --- Timer ---
  useEffect(() => {
    if (status === "recording") {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- Waveform Visualization ---
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = status === "paused" ? "#d1d5db" : "#111827";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }, [status]);

  // --- Cleanup ---
  const cleanup = useCallback(() => {
    isRecordingRef.current = false;
    if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Helper: create and start a fresh MediaRecorder that sends one complete
  // WebM blob when stopped
  const startNewRecorder = (stream, ws) => {
    const mr = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (event) => {
      if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(event.data);
      }
    };

    mr.start(); // records until we call .stop()
  };

  // --- Start Recording ---
  const startRecording = async () => {
    setError("");
    setTranscript("");
    setMom("");
    setMomId(null);
    setElapsed(0);
    setStatusMessage("");

    // Request mic permission
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err) {
      setError("Microphone access denied. Please allow microphone permission and try again.");
      return;
    }

    // Setup audio analyser for waveform
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;

    // Connect WebSocket
    const token = localStorage.getItem("token");
    const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const wsUrl = apiUrl.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/ws/live-transcribe?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("recording");
      isRecordingRef.current = true;

      // Start first recorder
      startNewRecorder(stream, ws);
      drawWaveform();

      // Every 5 seconds: stop current recorder (sends complete WebM),
      // then start a fresh one
      chunkIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current) return;
        const mr = mediaRecorderRef.current;
        if (mr && mr.state === "recording") {
          mr.stop(); // triggers ondataavailable with a complete WebM blob
          // Start a new recorder immediately
          startNewRecorder(stream, ws);
        }
      }, 5000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "partial") {
        setTranscript(data.full_transcript);
      } else if (data.type === "status") {
        setStatusMessage(data.message);
      } else if (data.type === "mom") {
        setMom(data.mom);
        setMomId(data.mom_id);
        setStatus("done");
        setStatusMessage("");
        cleanup();
      } else if (data.type === "error") {
        setError(data.message);
        setStatus("error");
        setStatusMessage("");
        cleanup();
      }
    };

    ws.onerror = () => {
      setError("Connection to server failed. Make sure the backend is running.");
      setStatus("error");
      cleanup();
    };

    ws.onclose = () => {
      // Connection closed
    };
  };

  // --- Pause/Resume ---
  const togglePause = () => {
    if (status === "recording") {
      // Stop the chunk interval and current recorder
      isRecordingRef.current = false;
      if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
      const mr = mediaRecorderRef.current;
      if (mr && mr.state === "recording") {
        mr.stop(); // sends current chunk
      }
      setStatus("paused");
    } else if (status === "paused") {
      // Resume: start a new recorder and chunk interval
      const stream = streamRef.current;
      const ws = wsRef.current;
      if (!stream || !ws) return;

      isRecordingRef.current = true;
      startNewRecorder(stream, ws);

      chunkIntervalRef.current = setInterval(() => {
        if (!isRecordingRef.current) return;
        const mr = mediaRecorderRef.current;
        if (mr && mr.state === "recording") {
          mr.stop();
          startNewRecorder(stream, ws);
        }
      }, 5000);

      setStatus("recording");
    }
  };

  // --- Stop ---
  const stopRecording = () => {
    // Stop the chunk cycle
    isRecordingRef.current = false;
    if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);

    const mr = mediaRecorderRef.current;
    const ws = wsRef.current;

    if (mr && mr.state !== "inactive") {
      mr.stop(); // sends final chunk
    }

    // Small delay to let the last chunk be sent before stop signal
    setTimeout(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "stop" }));
        setStatus("processing");
        setStatusMessage("Generating meeting minutes...");
      }
    }, 500);

    // Stop waveform
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // --- Reset ---
  const resetAll = () => {
    setStatus("idle");
    setTranscript("");
    setMom("");
    setMomId(null);
    setError("");
    setElapsed(0);
    setStatusMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-black mb-2">
            Live recording
          </h1>
          <p className="text-gray-500">
            Record your meeting live and get real-time transcription with
            AI-generated minutes
          </p>
        </div>

        {/* Recording Controls */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
          {/* Timer */}
          {(status === "recording" || status === "paused" || status === "processing") && (
            <div className="text-center mb-6">
              <div className="text-5xl font-mono font-light text-black tracking-wider">
                {formatTime(elapsed)}
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                {status === "recording" && (
                  <>
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-red-600 font-medium">Recording</span>
                  </>
                )}
                {status === "paused" && (
                  <>
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="text-sm text-yellow-600 font-medium">Paused</span>
                  </>
                )}
                {status === "processing" && (
                  <>
                    <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                    <span className="text-sm text-gray-600 font-medium">Processing</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Waveform */}
          {(status === "recording" || status === "paused") && (
            <div className="mb-6 bg-gray-50 rounded-xl p-4">
              <canvas
                ref={canvasRef}
                width={700}
                height={80}
                className="w-full h-20"
              />
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            {status === "idle" && (
              <button
                onClick={startRecording}
                className="flex items-center gap-3 px-8 py-4 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition text-lg"
              >
                <Mic className="w-6 h-6" />
                Start recording
              </button>
            )}

            {(status === "recording" || status === "paused") && (
              <>
                <button
                  onClick={togglePause}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-xl font-medium transition"
                >
                  {status === "recording" ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Resume
                    </>
                  )}
                </button>

                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
                >
                  <Square className="w-5 h-5" />
                  Stop & generate
                </button>
              </>
            )}

            {status === "processing" && (
              <div className="flex items-center gap-3 px-8 py-4 bg-gray-100 text-gray-600 rounded-xl font-medium">
                <Loader2 className="w-5 h-5 animate-spin" />
                {statusMessage || "Processing..."}
              </div>
            )}

            {(status === "done" || status === "error") && (
              <button
                onClick={resetAll}
                className="flex items-center gap-3 px-8 py-4 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition"
              >
                <Mic className="w-5 h-5" />
                Record again
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Live Transcript Panel */}
        {transcript && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h3 className="text-lg font-medium text-black">
                Live transcript
              </h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 max-h-60 overflow-y-auto">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {transcript}
              </p>
            </div>
          </div>
        )}

        {/* Generated MOM Display */}
        {mom && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-black" />
              <h3 className="text-xl font-medium text-black">
                Meeting minutes
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                {mom}
              </pre>
            </div>

            <button
              onClick={() => {
                const blob = new Blob([mom], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `meeting-minutes-live-${momId || "recording"}.txt`;
                a.click();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
