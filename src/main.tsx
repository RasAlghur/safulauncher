import { Buffer } from "buffer";
window.Buffer = Buffer;

/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { config } from "./config/config.ts";
import { AuthProvider } from "./lib/AuthContext.tsx";
import { TokenProvider } from "./context/TokenContext.tsx";
import { UserProvider } from "./context/user.context.tsx";

/**
 * Description placeholder
 *
 * @type {*}
 */
const queryClient = new QueryClient();
/**
 * Description placeholder
 *
 * @returns {*}
 */
const WalletApp = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Check if the root already exists before creating it
/**
 * Description placeholder
 *
 * @type {*}
 */
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Only create root once
/**
 * Description placeholder
 *
 * @type {*}
 */
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <AuthProvider>
      <TokenProvider>
        <WalletApp />
      </TokenProvider>
    </AuthProvider>
  </StrictMode>
);
