import { useState, useCallback } from "react";
import { type Hash } from "viem";
import { useAccount } from "wagmi";
import { savingsCircleService } from "../services/SavingsCircleService";
import type { Participant, Round } from "../types/types";

/**
 * 🎯 Custom hook for interacting with a single SavingsCircle contract instance.
 * Handles joining, contributing, and fetching participant and round data.
 */
export function useSavingsCircle(circleAddress: Hash) {
  const { address: userAddress } = useAccount();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | null>(null);

  /**
   * 🔍 Loads participant list from the circle contract.
   */
  const fetchParticipants = useCallback(async () => {
    if (!circleAddress) return;
    setLoading(true);
    setError(null);

    try {
      const participants = await savingsCircleService.getParticipants(circleAddress);
      setParticipants(participants);
    } catch (err: unknown) {
      console.error("❌ Error loading participants:", err);
      setError(err instanceof Error ? err.message : "Fallo al obtener participantes.");
    } finally {
      setLoading(false);
    }
  }, [circleAddress]);

  /**
   * 🔁 Loads information about the current active round.
   */
  const fetchCurrentRound = useCallback(async () => {
    if (!circleAddress) return;
    setLoading(true);
    setError(null);

    try {
      const round = await savingsCircleService.getCurrentRound(circleAddress);
      if (round) setCurrentRound(round);
      else setCurrentRound(null);
    } catch (err: unknown) {
      console.error("❌ Error loading current round:", err);
      setError(err instanceof Error ? err.message : "Fallo al obtener la ronda actual.");
    } finally {
      setLoading(false);
    }
  }, [circleAddress]);

  /**
   * 🧍‍♀️ Joins the SavingsCircle by depositing the insurance amount.
   */
  const joinCircle = useCallback(
    async (name: string) => {
      if (!circleAddress) return;
      if (!userAddress) {
        setError("Conecta tu billetera antes de unirte a una tanda.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const hash = await savingsCircleService.joinCircle(circleAddress, name);
        setTxHash(hash);
        await fetchParticipants();
        return hash;
      } catch (err: unknown) {
        console.error("❌ Error joining circle:", err);
        setError(err instanceof Error ? err.message : "Fallo al unirse a la tanda.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [circleAddress, userAddress, fetchParticipants]
  );

  /**
   * 💰 Contributes to the current active round.
   */
  const contribute = useCallback(
    async (amount: bigint) => {
      if (!circleAddress) return;
      if (!userAddress) {
        setError("Conecta tu billetera antes de unirte a una tanda.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const hash = await savingsCircleService.contribute(circleAddress, amount);
        setTxHash(hash);
        await fetchCurrentRound();
        return hash;
      } catch (err: unknown) {
        console.error("❌ Error contributing:", err);
        setError(err instanceof Error ? err.message : "Fallo al contribuir.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [circleAddress, fetchCurrentRound, userAddress]
  );

  return {
    participants,
    currentRound,
    loading,
    error,
    txHash,
    joinCircle,
    contribute,
    fetchParticipants,
    fetchCurrentRound,
  };
}
