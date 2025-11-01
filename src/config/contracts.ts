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
  'arbitrumSepolia' | 'scrollSepolia',
  NetworkContracts
> = {
  arbitrumSepolia: {
    factory: '0x12060831E33E51D78F2fB1c30b361A6E20870894',
  },
  scrollSepolia: {
    factory: '0x33c8BdEBFb083fA77C7c0eB8b3B490B350BcCc4e',
  },
} as const

/**
 * Helper type that infers all supported networks.
 * Example usage: `type SupportedNetwork = keyof typeof CONTRACT_ADDRESSES`
 */
export type SupportedNetwork = keyof typeof CONTRACT_ADDRESSES
