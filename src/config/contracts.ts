import { type Hash } from "viem"
/**
 * Contract address map by network.
 *
 */

export interface NetworkContracts {
  factory: Hash
}

/**
 *  Contract addresses for supported networks.
 */
export const CONTRACT_ADDRESSES: Record<
  'arbitrumSepolia' | 'scrollSepolia' | 'etherumMainnet',
  NetworkContracts
> = {
  arbitrumSepolia: {
    factory: '0xD4e4Ea2A6373Bc86A23a51CCB622C1D58fe2Aa29',
  },
  scrollSepolia: {
    factory: '0xdfe2F90fe244Ebdc87A7C60F63c90259896e0a89',
  },
  etherumMainnet: {
    factory: '0x721cC1f4dF6F89d05cF441192db2598aeED0a98b',
  },
} as const

/**
 * Helper type that infers all supported networks.
 * Example usage: `type SupportedNetwork = keyof typeof CONTRACT_ADDRESSES`
 */
export type SupportedNetwork = keyof typeof CONTRACT_ADDRESSES
