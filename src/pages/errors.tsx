import { useEffect, useState, useCallback } from "react";
import { useApiClient } from "../lib/api";

interface error {
  timestamp: string;
  error: string;
  stack: string;
}
export default function ErrorsPage() {
  const base = useApiClient();
  const [errors, setErrors] = useState<error[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const fetchErrors = useCallback(async () => {
    try {
      const req = await base.get("errors");
      setErrors(req.data.data);
      console.log(req.data);
    } catch (error) {
      console.error("Error fetching errors:", error);
    }
  }, [base]);

  useEffect(() => {
    fetchErrors();

    const intervalId = setInterval(fetchErrors, 60000);

    return () => clearInterval(intervalId);
  }, [fetchErrors]);

  const handleFile = () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput.files) {
      setFile(fileInput.files[0]);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("draft", "false");
    formData.append("schedule", "false");
    ["Yes", "No"].forEach((tag) => formData.append("tags", tag));
    formData.append("content", "what a very long text");
    formData.append("title", "Its a long Day");
    formData.append("metatitle", "yes");
    formData.append("description", "yes");
    formData.append("scheduleDate", "2025-02-04");
    if (file) formData.append("thumbnail", file);

    console.log(file);

    const req = await fetch(
      "http://localhost:3000/learning/63f46ed1-e67b-4a1f-8289-d557d38a8a0d",
      {
        method: "PATCH",
        headers: {
          // "Content-Type": "application/json", //remove for formdata
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YjlmZjk5MC0yMTQ3LTRlY2UtYjFmYS04OTRmYTRhYTEwZDUiLCJlbWFpbCI6ImFsaWNlQHN0cmVwbGUuY29tIiwicm9sZSI6IlBST19UUkFERVIiLCJpYXQiOjE3NTM2OTg0MjQsImV4cCI6MTc1MzcwMjAyNH0.4VYFvNh3xDeCQirHchD_8kGbukwKBxZwFfvfsrugjSE",
        },
        body: formData, //JSON.stringify(data),
      }
    );

    const res = await req.json();
    console.log(res);
  };
  // 0xbf310e2cb2cb53720a781e6e9e6ccb796c9646df;
  // 0x1F69bE6e06A2E5cFd1D9EF0dd9560f333fEc4518
  return (
    <div>
      <div className="space-y-10 p-10">
        {errors.map((error, idx) => (
          <div key={idx} className="bg-red-500 shadow-md rounded-md p-4 my-4">
            <p>{error.timestamp}</p>
            <p>{error.error}</p>
            <p>{error.stack}</p>
          </div>
        ))}
      </div>

      <input type="file" name="" id="fileInput" onChange={handleFile} />
      <button onClick={handleSubmit}>Submit Data</button>
    </div>
  );
}
