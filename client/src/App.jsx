import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import ChatPage from "./pages/ChatPage";

function App() {
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {!uploaded ? (
        <UploadPage onUpload={() => setUploaded(true)} />
      ) : (
        <ChatPage />
      )}
    </div>
  );
}

export default App;
