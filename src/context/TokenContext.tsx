// src/context/TokenContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  logoFilename?: string;
  createdAt?: string;
  expiresAt?: string;
}

interface TokenContextType {
  tokens: TokenMetadata[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const TokenContext = createContext<TokenContextType | null>(null);

export const useTokenContext = () => useContext(TokenContext)!;

export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const API = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${API}/api/tokens`)
      .then((res) => res.json())
      .then((data: TokenMetadata[]) => setTokens(data))
      .catch(console.error);
  }, []);

  return (
    <TokenContext.Provider value={{ tokens, searchTerm, setSearchTerm }}>
      {children}
    </TokenContext.Provider>
  );
};
