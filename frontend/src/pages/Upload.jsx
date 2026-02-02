import { useState } from "react";
import API from "../api/api";
import { Upload as UploadIcon, FileAudio, Loader2, Download, CheckCircle2 } from "lucide-react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [mom, setMom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an audio file");
      return;
    }

    setLoading(true);
    setError("");
    setMom("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await API.post("/generate-mom/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMom(res.data.mom);
    } catch (err) {
      setError("Failed to generate MOM. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError("");
    setMom("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-black mb-2">
            Upload meeting
          </h1>
          <p className="text-gray-500">
            Upload your audio file and get AI-generated minutes instantly
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
          {/* File Upload Area */}
          <div className="mb-6">
            <input
              type="file"
              accept=".mp3,.wav,.m4a"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="block border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl p-12 text-center cursor-pointer transition group"
            >
              {!file ? (
                <div>
                  <UploadIcon className="w-10 h-10 text-gray-400 mx-auto mb-4 group-hover:text-gray-600 transition" />
                  <p className="text-gray-700 font-medium mb-1">
                    Choose a file or drag it here
                  </p>
                  <p className="text-sm text-gray-500">
                    MP3, WAV, or M4A up to 100MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <FileAudio className="w-8 h-8 text-black" />
                  <div className="text-left">
                    <p className="font-medium text-black">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full py-4 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating minutes...
              </>
            ) : (
              "Generate minutes"
            )}
          </button>

          {/* Messages */}
          {loading && (
            <p className="mt-4 text-sm text-gray-600 text-center">
              This may take a moment. Processing your audio...
            </p>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600 text-center">
              {error}
            </p>
          )}
        </div>

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
                a.download = "meeting-minutes.txt";
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