import { readContract, writeContract } from "@wagmi/core";
import { config } from "../config";
import { CONTRACT_ADDRESSES, type SupportedNetwork } from "../config/contracts";
import { type SavingsCircleFactoryInterface } from "../interfaces/SavingsCircleFactoryInterface";
import { type CreateCircleParams } from "../types/types";
import SavingsCircleFactoryArtifact from "../contracts/abi/SavingsCircleFactory.json";
import { type Hash, type Abi } from "viem";

/**
 * 🏗️ Concrete implementation of the SavingsCircleFactoryInterface.
 * Handles all blockchain interactions related to the factory contract.
 */
export class SavingsCircleFactoryService implements SavingsCircleFactoryInterface {
  private readonly abi: Abi;

  constructor() {
    this.abi = SavingsCircleFactoryArtifact.abi as Abi;
  }

  /**
   * 📦 Creates a new Savings Circle (Tanda) by calling the `createSavingsCircle` function on-chain.
   */
  async createCircle(
    network: SupportedNetwork,
    params: CreateCircleParams
  ): Promise<Hash> {
    try {
      const txHash = await writeContract(config, {
        abi: this.abi,
        address: CONTRACT_ADDRESSES[network].factory as Hash,
        functionName: "createSavingsCircle",
        args: [
          params.name,
          params.image,
          params.contributionAmount,
          params.maxParticipants,
          params.roundDuration,
          params.insuranceDeposit,
        ],
      });

      return txHash;
    } catch (error) {
      console.error("❌ Error creating circle:", error);
      throw new Error(
        "Fallo al crear la tanda. Por favor, verifica tu billetera o conexión a la red."
      );
    }
  }

  /**
   * 🔍 Returns all deployed SavingsCircles.
   */
  async getAllCircles(network: SupportedNetwork): Promise<readonly Hash[]> {
    try {
      const circles = await readContract(config, {
        abi: this.abi,
        address: CONTRACT_ADDRESSES[network].factory as Hash,
        functionName: "getAllCircles",
      });
      return circles as readonly Hash[];
    } catch (error) {
      console.error("❌ Error fetching all circles:", error);
      throw new Error("Fallo al obtener las tandas.");
    }
  }

  /**
   * 🧾 Returns all SavingsCircles created by a specific user.
   */
  async getCirclesByUser(
    network: SupportedNetwork,
    user: Hash
  ): Promise<readonly Hash[]> {
    try {
      const circles = await readContract(config, {
        abi: this.abi,
        address: CONTRACT_ADDRESSES[network].factory as Hash,
        functionName: "getCirclesByUser",
        args: [user],
      });
      return circles as readonly Hash[];
    } catch (error) {
      console.error("❌ Error fetching user circles:", error);
      throw new Error("Fallo al obtener las tandas del usuario.");
    }
  }

  /**
   * 🤝 Returns all SavingsCircles where the user is a participant.
   */
  async getCirclesByParticipant(
    network: SupportedNetwork,
    user: Hash
  ): Promise<readonly Hash[]> {
    try {
     const circles = await readContract(config, {
        abi: this.abi,
        address: CONTRACT_ADDRESSES[network].factory as Hash,
        functionName: "getCirclesByParticipant",
        args: [user],
      });
      return circles as readonly Hash[];
    } catch (error) {
      console.error("❌ Error fetching participant circles:", error);
      throw new Error("Fallo al obtener las tandas en las que participa.");
    }
  }

  /**
   * 🔢 Returns the total number of deployed SavingsCircles.
   */
  async getTotalCircles(network: SupportedNetwork): Promise<bigint> {
    try {
      const circles = await readContract(config, {
        abi: this.abi,
        address: CONTRACT_ADDRESSES[network].factory as Hash,
        functionName: "getTotalCircles",
      });
      return circles as bigint;
    } catch (error) {
      console.error("❌ Error fetching total circles:", error);
      throw new Error("Fallo al obtener el conteo total.");
    }
  }
}

/**
 * ✅ Export a singleton instance for dependency injection across hooks/components.
 */
export const savingsCircleFactoryService = new SavingsCircleFactoryService();
