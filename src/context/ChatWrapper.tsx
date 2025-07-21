// src/pages/ChatWrapper.tsx
import { useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import Chat from "../pages/chat";
import { useEffect } from "react";
import { useUser } from "./user.context";

export default function ChatWrapper() {
  const { address, isConnected } = useAccount();
  const { saveOrFetchUser } = useUser();
  // Initialize when wallet connects and set up real-time fetches
  useEffect(() => {
    let isMounted = true;
    if (isConnected && isMounted) {
      saveOrFetchUser(String(address));
    }

    return () => {
      isMounted = false;
    };
  }, [isConnected, address, saveOrFetchUser]);

  const { tokenAddress } = useParams<{ tokenAddress: string }>();

  return <Chat address={address} tokenAddress={tokenAddress} />;
}
