import { useEffect, useState } from "react";
import { base } from "../lib/api";

interface error {
  timestamp: string;
  error: string;
  stack: string;
}
export default function ErrorsPage() {
  const [errors, setErrors] = useState<error[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const fetchErrors = async () => {
    try {
      const req = await base.get("errors");
      setErrors(req.data.data);
      console.log(req.data);
    } catch (error) {
      console.error("Error fetching errors:", error);
    }
  };

  useEffect(() => {
    fetchErrors();

    const intervalId = setInterval(fetchErrors, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const handleFile = () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput.files) {
      setFile(fileInput.files[0]);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("status", "Published");
    formData.append("title", "Introduction to crypto");
    formData.append("description", "learn basic crypto data");
    formData.append("level", "Beginner");
    formData.append("type", "article");
    if (file) formData.append("document", file);

    const req = await fetch("http://localhost:3000/learning", {
      method: "POST",
      body: formData,
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YjlmZjk5MC0yMTQ3LTRlY2UtYjFmYS04OTRmYTRhYTEwZDUiLCJlbWFpbCI6ImFsaWNlQHN0cmVwbGUuY29tIiwicm9sZSI6IlBST19UUkFERVIiLCJpYXQiOjE3NTM0NDU3NDgsImV4cCI6MTc1MzQ0OTM0OH0.diHgdd-45Ivj2vPYH8k4azRg-QhII2VcXonB658M7S4",
      },
    });

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
