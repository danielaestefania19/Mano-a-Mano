import { Routes, Route, Navigate } from "react-router-dom";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { projectId, metadata, networks, wagmiAdapter } from "./config";
import Sidebar from "./components/Sidebar";
import Tandas from "./components/Tandas";
import "./index.css";

const queryClient = new QueryClient();

const generalConfig = {
  projectId,
  networks,
  metadata,
  themeMode: "light" as const,
  themeVariables: {
    "--w3m-accent": "#E0319D",
  },
};

createAppKit({
  adapters: [wagmiAdapter],
  ...generalConfig,
  features: {
    analytics: true,
  },
});

export function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/circles" replace />} />
              <Route path="/circles" element={<Tandas />} />
            </Routes>
          </div>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}

export default App;
