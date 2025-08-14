import { useState } from "react";
import axios from "axios";

export default function FileUploader({ onUpload }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("File uploaded & processed!");
      onUpload();
    } catch (err) {
      alert("Upload failed: " + err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Upload your PDF/Excel</h1>
      <input
        type="file"
        accept=".pdf,.xlsx,.xls"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
