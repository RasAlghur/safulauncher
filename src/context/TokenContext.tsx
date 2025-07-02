// src/context/TokenContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { base } from "../lib/api";

interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  tokenImageId?: string;
  image?: {
    name: string;
    path: string;
  };
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

  useEffect(() => {
    (async () => {
      try {
        const res = await base.get("/tokens?includes=image");
        const data = res.data as { data: TokenMetadata[] };
        setTokens(data.data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  return (
    <TokenContext.Provider value={{ tokens, searchTerm, setSearchTerm }}>
      {children}
    </TokenContext.Provider>
  );
};
