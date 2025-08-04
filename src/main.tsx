// main.tsx
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
import { NetworkWarning } from "./components/generalcomponents/NetworkWarning.tsx";
import { useNetworkEnvironment } from "./config/useNetworkEnvironment.ts";

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

const MyDApp: React.FC = () => {
  const networkInfo = useNetworkEnvironment();

  return (
    <div className="p-4">
      <NetworkWarning />

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Network Information</h2>
        <div className="space-y-2 text-sm">
          <p><strong>API Base URL:</strong> {networkInfo.apiBaseUrl}</p>
          <p><strong>Chain ID:</strong> {networkInfo.chainId}</p>
          <p><strong>Chain Name:</strong> {networkInfo.chainName}</p>
          <p><strong>Explorer URL:</strong> {networkInfo.explorerUrl}</p>
          <p><strong>Environment Match:</strong> {networkInfo.environmentMatch ? "✅ Yes" : "❌ No"}</p>
          <p><strong>SafuLauncher Address:</strong> {networkInfo.safuContract}</p>
        </div>
      </div>
      {/* Your app components */}
      <App />
    </div>
  );
};


const WalletApp = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <UserProvider>
            <MyDApp />
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
