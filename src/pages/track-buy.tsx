import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import { base } from "../lib/api";

interface response {
  user: string;
  tokenAddr: string;
  buy: boolean;
  inAmt: string;
  outAmt: string;
  timestamp: string;
}
export default function TrackBuy() {
  const [result, setResult] = useState<response[]>([]);

  const fetchErrors = async () => {
    try {
      const req = await base.get("buy_log");
      setResult(req.data.data);
      console.log(req.data);
    } catch (error) {
      console.error("Error fetching errors:", error);
    }
  };
  useEffect(() => {
    fetchErrors();

    // const intervalId = setInterval(fetchErrors, 60000);

    // return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      console.log("socket connected");
      socket.connect();
    }

    const handleReceiveNewDeployment = (data: response) => {
      setResult((prev) => {
        const newTokens = [data, ...prev];
        return newTokens;
      });
    };

    socket.on("token_buy_or_sell", handleReceiveNewDeployment);

    return () => {
      socket.off("token_buy_or_sell", handleReceiveNewDeployment);
      socket.disconnect();
    };
  }, []);
  return (
    <div className="space-y-10 p-10">
      {result.map((res, idx) => (
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
      ))}
    </div>
  );
}
