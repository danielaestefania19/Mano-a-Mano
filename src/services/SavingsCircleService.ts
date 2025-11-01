import { readContract, writeContract } from "@wagmi/core";
import { config } from "../config";
import { type Hash, type Abi } from "viem";
import { type SavingsCircleInterface } from "../interfaces/SavingsCircleInterface";
import { type Participant, type Round } from "../types/types";
import SavingsCircleArtifact from "../contracts/abi/SavingsCircle.json";

/**
 * 🏦 Concrete implementation of the SavingsCircleInterface.
 * Handles all blockchain interactions for an individual SavingsCircle contract.
 */
export class SavingsCircleService implements SavingsCircleInterface {
  private readonly savingsCircleAbi: Abi;

  constructor() {
    this.savingsCircleAbi = SavingsCircleArtifact.abi as Abi;
  }

  /**
   * 🧍‍♀️ Allows a user to join a SavingsCircle by sending the insurance deposit.
   */
  async joinCircle(
    circleAddress: Hash,
    name: string
  ): Promise<Hash> {
    try {
      const txHash = await writeContract(config, {
        abi: this.savingsCircleAbi,
        address: circleAddress,
        functionName: "joinCircle",
        args: [name],
      });

      return txHash;
    } catch (error) {
      console.error(`❌ Error joining circle ${circleAddress}:`, error);
      throw new Error("Fallo al unirse a la tanda. Verifica tu depósito y red.");
    }
  }

  /**
   * 📋 Retrieves all participants in the SavingsCircle.
   */
  async getParticipants(
    circleAddress: Hash
  ): Promise<Participant[]> {
    try {
      const participants = await readContract(config, {
        abi: this.savingsCircleAbi,
        address: circleAddress,
        functionName: "getParticipants",
      });

       return participants as Participant[];
    } catch (error) {
      console.error(`❌ Error fetching participants for ${circleAddress}:`, error);
      throw new Error("Fallo al obtener los participantes de la tanda.");
    }
  }

  /**
   * 🔁 Fetches information about the current round.
   */
  async getCurrentRound(
    circleAddress: Hash
  ): Promise<Round> {
    try {
      const currentIndex = await readContract(config, {
        abi: this.savingsCircleAbi,
        address: circleAddress,
        functionName: "currentRound",
      });

      const round = await readContract(config, {
        abi: this.savingsCircleAbi,
        address: circleAddress,
        functionName: "rounds",
        args: [currentIndex],
      });

      const [index, totalCollected, beneficiary, status, startTime, endTime] =
        round as [bigint, bigint, string, number, bigint, bigint];

      return {
        index,
        totalCollected,
        beneficiary: beneficiary as Hash,
        status,
        startTime,
        endTime,
      };
    } catch (error) {
      console.error(`❌ Error fetching current round for ${circleAddress}:`, error);
      throw new Error("Fallo al obtener la ronda actual.");
    }
  }

  /**
   * 💰 Allows a participant to contribute the required amount to the active round.
   */
  async contribute(
    circleAddress: Hash,
    amount: bigint
  ): Promise<Hash> {
    try {
      const txHash = await writeContract(config, {
        abi: this.savingsCircleAbi,
        address: circleAddress,
        functionName: "contribute",
        value: amount,
      });

      return txHash;
    } catch (error) {
      console.error(`❌ Error contributing to circle ${circleAddress}:`, error);
      throw new Error("Fallo al contribuir en la tanda.");
    }
  }
}

/**
 * ✅ Export a singleton instance for use across hooks and components.
 */
export const savingsCircleService = new SavingsCircleService();
