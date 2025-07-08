import React, { createContext, useContext, useState } from "react";

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

// eslint-disable-next-line react-refresh/only-export-components
export const useTokenContext = () => {
  const ctx = useContext(TokenContext);
  if (!ctx)
    throw new Error("useTokenContext must be used within TokenProvider");
  return ctx;
};

export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tokens] = useState<TokenMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <TokenContext.Provider value={{ tokens, searchTerm, setSearchTerm }}>
      {children}
    </TokenContext.Provider>
  );
};
