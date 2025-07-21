import { useEffect, useState } from "react";
import { base } from "../lib/api";

interface error {
  timestamp: string;
  error: string;
  stack: string;
}
export default function ErrorsPage() {
  const [errors, setErrors] = useState<error[]>([]);

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

  return (
    <div className="space-y-10 p-10">
      {errors.map((error, idx) => (
        <div key={idx} className="bg-red-500 shadow-md rounded-md p-4 my-4">
          <p>{error.timestamp}</p>
          <p>{error.error}</p>
          <p>{error.stack}</p>
        </div>
      ))}
    </div>
  );
}
