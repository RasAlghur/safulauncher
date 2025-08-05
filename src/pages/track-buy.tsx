import { useEffect, useState } from "react";
import { useApiClient } from "../lib/api";

interface response {
  user: string;
  tokenAddr: string;
  buy: boolean;
  inAmt: string;
  outAmt: string;
  timestamp: string;
  start?: string;
  eventType: "track" | "deployment" | "trade";
  name: string;
  symbol: string;
  tokenAddress: string;
  identifier: string;
  creator: string;
}

export default function TrackBuy() {
  const base = useApiClient();
  const [result, setResult] = useState<response[]>([]);

  const fetchErrors = async () => {
    try {
      const req = await base.get("track-event");
      setResult(req.data.data);
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
      {result.map((res, idx) => {
        if (res.eventType === "track") {
          return (
            <div
              key={idx}
              className="bg-blue-600 text-white shadow-md rounded-md p-4 my-4"
            >
              <p>{res.timestamp}</p>
              <p>{res.start}</p>
            </div>
          );
        }

        if (res.eventType === "deployment") {
          return (
            <div
              key={idx}
              className="bg-amber-400 text-black shadow-md rounded-md p-4 my-4"
            >
              <p>
                Token Name: {res.name}({res.symbol})
              </p>
              <p>Token Address: {res.tokenAddress}</p>
              <p>Identifier: {res.identifier}</p>
              <p>Creator: {res.creator}</p>
              <p>timestamp: {res.timestamp}</p>
            </div>
          );
        }

        return (
          <div
            key={idx}
            className={`${
              res.buy ? "bg-green-500" : "bg-red-500"
            } shadow-md rounded-md p-4 my-4`}
          >
            <p>{res.timestamp}</p>
            <p>
              user: {res.user} {res.buy ? "buy" : "sell"} token: {res.tokenAddr}
            </p>
            <p>
              Amount In:{res.inAmt} Amount Out {res.outAmt}
            </p>
          </div>
        );
      })}
    </div>
  );
}
