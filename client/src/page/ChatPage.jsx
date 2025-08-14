import { useState } from "react";
import axios from "axios";

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/query", { question });
      setResponse(JSON.parse(res.data.result)); // parse JSON string
    } catch (err) {
      alert("Error fetching answer");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-4">Ask a Question</h1>
      <div className="flex gap-2 mb-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={askQuestion}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

      {response && (
        <div className="border-t pt-4">
          <h2 className="font-semibold">Answer:</h2>
          <p>{response.answer}</p>

          <h2 className="font-semibold mt-2">Summary:</h2>
          <p>{response.summary}</p>

          <h2 className="font-semibold mt-2">Key Points:</h2>
          <ul className="list-disc pl-6">
            {response.key_points.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
