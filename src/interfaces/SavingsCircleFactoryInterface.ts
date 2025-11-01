import { type SupportedNetwork } from "../config/contracts"
import { type Circle, type CreateCircleParams } from "../types/types"
import { type Hash } from "viem"
/**
 * Interface that defines all the methods for interacting with
 * the SavingsCircleFactory contract.
 *
 * This abstraction allows multiple implementations (e.g., mock services for tests,
 * or different network providers).
 */
export interface SavingsCircleFactoryInterface {

  /**
   * Creates a new Savings Circle (Tanda) on the selected network.
   * @param network - The target EVM network (e.g., arbitrumSepolia, scrollSepolia)
   * @param params - The parameters used for the creation
   * @returns The transaction hash or deployment address
   */
  createCircle(network: SupportedNetwork, params: CreateCircleParams): Promise<Hash>

  /**
   * Fetches all deployed SavingsCircles from the factory.
   * @param network - The target EVM network
   */
  getAllCircles(network: SupportedNetwork): Promise<readonly Hash[]>

  /**
   * Fetches detailed information about a specific SavingsCircle.
   * @param address - The contract address of the SavingsCircle
   */
  getCircleInfo(address: Hash): Promise<Circle>

  /**
   * Fetches all circles created by a specific user.
   * @param network - The target EVM network
   * @param user - The wallet address of the user
   */
  getCirclesByUser(network: SupportedNetwork, user: Hash): Promise<readonly Hash[]>

  /**
   * Fetches all circles in which a user participates.
   * @param network - The target EVM network
   * @param user - The wallet address of the user
   */
  getCirclesByParticipant(network: SupportedNetwork, user: Hash): Promise<readonly Hash[]>

  /**
   * Returns the total number of deployed SavingsCircles.
   * @param network - The target EVM network
   */
  getTotalCircles(network: SupportedNetwork): Promise<bigint>
}