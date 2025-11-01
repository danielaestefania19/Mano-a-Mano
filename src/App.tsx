import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { projectId, metadata, networks, wagmiAdapter } from './config'
import Navbar from './components/Navbar'
import "./index.css"

const queryClient = new QueryClient()

const generalConfig = {
  projectId,
  networks,
  metadata,
  themeMode: 'light' as const,
  themeVariables: {
    '--w3m-accent': '#000000',
  }
}
createAppKit({
  adapters: [wagmiAdapter],
  ...generalConfig,
  features: {
    analytics: true,
  },
})

export function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <main className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Bienvenido</h2>
          </main>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  )
}

export default App
