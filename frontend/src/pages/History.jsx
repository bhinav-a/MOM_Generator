import { useEffect, useState } from "react";
import API from "../api/api";
import { FileText, Download, X, Loader2, Clock, Trash2 } from "lucide-react";

export default function History() {
  const [moms, setMoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMom, setSelectedMom] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    setLoading(true);
    API.get("/mom/history")
      .then((res) => {
        setMoms(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load history");
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this meeting?"
    );
    if (!confirm) return;

    setDeleting(true);

    try {
      await API.delete(`/mom/${id}`);
      setMoms((prev) => prev.filter((m) => m.id !== id));
      setSelectedMom(null); // close modal
    } catch (err) {
      alert("Failed to delete MOM");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-black mb-2">History</h1>
          <p className="text-gray-500">
            View all your previously generated meeting minutes
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && moms.length === 0 && (
          <div className="bg-white border rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No meeting minutes yet
            </h3>
            <p className="text-gray-500 text-sm">
              Upload your first meeting to get started
            </p>
          </div>
        )}

        {/* List */}
        {!loading && !error && moms.length > 0 && (
          <div className="space-y-3">
            {moms.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMom(m)}
                className="w-full bg-white border hover:border-gray-300 rounded-xl p-6 text-left transition"
              >
                <p className="font-medium text-black mb-2 line-clamp-2">
                  {m.preview}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {formatDate(m.created_at)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedMom && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedMom(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between p-6 border-b">
                <div>
                  <h3 className="text-xl font-medium">Meeting Minutes</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedMom.created_at)}
                  </p>
                </div>
                <button onClick={() => setSelectedMom(null)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {selectedMom.full_content || selectedMom.preview}
                </pre>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center p-6 border-t">
                <button
                  onClick={() => handleDelete(selectedMom.id)}
                  disabled={deleting}
                  className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>

                <button
                  onClick={() => {
                    const blob = new Blob(
                      [selectedMom.full_content || selectedMom.preview],
                      { type: "text/plain" }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `meeting-minutes-${selectedMom.id}.txt`;
                    a.click();
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
