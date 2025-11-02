import { type Hash } from "viem";

/**
 * 💠 Data model representing an existing SavingsCircle (Tanda) deployed on-chain.
 *
 * This structure enriches the on-chain address data with full metadata
 * fetched from the individual SavingsCircle contract.
 */
export interface Circle {
  address: Hash;
  name: string;
  image: string;
  contributionAmount: bigint;
  maxParticipants: number;
  roundDuration: bigint;
  insuranceDeposit: bigint;
  owner: Hash;
}

/**
 * 🧩 Data model representing a SavingsCircle creation request.
 */
export type CreateCircleParams = Omit<Circle, "address" | "owner">;


/**
 * 🧠 Represents a participant profile in a SavingsCircle.
 */
export interface Participant {
  wallet: Hash;
  hasContributed?: Record<number, boolean>;
}

/**
 * 🔁 Represents a savings round within a circle.
 */
export interface Round {
  index: bigint;
  totalCollected: bigint;
  beneficiary: Hash;
  status: number; 
  startTime: bigint;
  endTime: bigint;
}
