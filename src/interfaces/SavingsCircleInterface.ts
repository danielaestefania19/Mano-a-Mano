import { type Hash } from "viem";
import { type Participant, type Round } from "../types/types";

/**
 * Interface that defines all the methods for interacting with
 * an individual SavingsCircle contract instance.
 *
 * This abstraction allows different implementations (e.g., wagmi, viem, ethers, mocks)
 * while keeping a consistent API surface across the app.
 */
export interface SavingsCircleInterface {
  /**
   * Allows a user to join a SavingsCircle by sending the required insurance deposit.
   *
   * @param circleAddress - The address of the SavingsCircle contract to join
   * @param insuranceDeposit - The insurance deposit amount required to join
   * @returns The transaction hash confirming the join operation
   */
  joinCircle(
    circleAddress: Hash,
    insuranceDeposit: bigint
  ): Promise<Hash>;

  /**
   * Retrieves the complete list of participants for a given SavingsCircle.
   *
   * @param circleAddress - The address of the SavingsCircle contract
   * @returns An array of participants containing wallet addresses and names
   */
  getParticipants(
    circleAddress: Hash
  ): Promise<Participant[]>;

  /**
   * Retrieves information about the current active round in the SavingsCircle.
   *
   * @param circleAddress - The address of the SavingsCircle contract
   * @returns A `Round` object describing the current round (index, totalCollected, beneficiary, status, start and end time)
   */
  getCurrentRound(
    circleAddress: Hash
  ): Promise<Round>;

  /**
   * Allows a participant to contribute to the current active round.
   * Requires sending the exact `contributionAmount` in wei as `msg.value`.
   *
   * @param circleAddress - The address of the SavingsCircle contract where the contribution is made
   * @param amount - The contribution amount to send (must match the contract's `contributionAmount`)
   * @returns The transaction hash confirming the contribution
   */
  contribute(
    circleAddress: Hash,
    amount: bigint
  ): Promise<Hash>;

  /**
   * Checks if a participant has already contributed in a specific round.
   *
   * @param circleAddress - The address of the SavingsCircle contract  
   * @param roundIndex - The index of the round to check  
   * @param participant - The wallet address of the participant  
   * @returns A boolean indicating whether the participant has contributed in that round  
   */
  getHasContributed(
    circleAddress: Hash,
    roundIndex: bigint,
    participant: string
  ): Promise<boolean>;

}
