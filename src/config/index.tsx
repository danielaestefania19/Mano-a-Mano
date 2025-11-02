import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrumSepolia, scrollSepolia } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

export const projectId = "1d089db2baa74b6f4d8ce33d7ea5571f"
if (!projectId) {
  throw new Error('Project ID is not defined')
}

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