import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { config } from "./config/config.ts";
import { AuthProvider } from "./lib/AuthContext.tsx";

const queryClient = new QueryClient();
const WalletApp = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Check if the root already exists before creating it
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Only create root once
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <AuthProvider>
      <WalletApp />
    </AuthProvider>
  </StrictMode>
);
