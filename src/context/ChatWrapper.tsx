// src/pages/ChatWrapper.tsx
import { useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import Chat from "../pages/chat";

export default function ChatWrapper() {
  const { address } = useAccount();
  const { tokenAddress } = useParams<{ tokenAddress: string }>();

  return <Chat address={address} tokenAddress={tokenAddress} />;
}
