import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrumSepolia, scrollSepolia } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

export const projectId = import.meta.env.VITE_PROJECT_ID
if (!projectId) throw new Error("Falta el PROJECT ID de AppKit")

console.log("PROJECT ID:", projectId)
export const metadata = {
    name: 'AppKit',
    description: 'AppKit Example',
    url: 'https://reown.com',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
    
  }

export const networks = [ mainnet, arbitrumSepolia, scrollSepolia ] as [AppKitNetwork, ...AppKitNetwork[]]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig