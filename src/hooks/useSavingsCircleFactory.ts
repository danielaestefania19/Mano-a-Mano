import { useEffect, useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { savingsCircleFactoryService } from "../services/SavingsCircleFactoryService";
import { type SupportedNetwork } from "../config/contracts";
import { type Circle, type CreateCircleParams } from "../types/types";
import { type Hash } from "viem";

/**
 * 🎯 Custom hook for loading, creating, and managing SavingsCircles dynamically
 * depending on the user's connected network.
 */
export function useSavingsCircles() {
  const { address } = useAccount();
  const chainId = useChainId();

  const [network, setNetwork] = useState<SupportedNetwork | null>(null);
  const [allCircles, setAllCircles] = useState<Circle[]>([]);
  const [createdCircles, setCreatedCircles] = useState<Circle[]>([]);
  const [participantCircles, setParticipantCircles] = useState<Circle[]>([]);
  const [totalCircles, setTotalCircles] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 🌐 Detect current network based on chainId from wagmi.
   */
  useEffect(() => {
    if (!chainId) {
      setNetwork(null);
      return;
    }

    const chainMap: Record<number, SupportedNetwork> = {
      421614: "arbitrumSepolia",
      534351: "scrollSepolia",
    };

    setNetwork(chainMap[chainId] ?? null);
  }, [chainId]);

  /**
   * 🔄 Loads all circle addresses and user-related circles.
   */
  const fetchCircles = useCallback(async () => {
    if (!network) return;
    setLoading(true);
    setError(null);

    try {
      const [all, total] = await Promise.all([
        savingsCircleFactoryService.getAllCircles(network),
        savingsCircleFactoryService.getTotalCircles(network),
      ]);

      setTotalCircles(total);
      const allCircleInfos = await Promise.all(
        (all as Hash[]).map((addr) => savingsCircleFactoryService.getCircleInfo(addr))
      );
      setAllCircles(allCircleInfos);

      if (address) {
        const [created, participated] = await Promise.all([
          savingsCircleFactoryService.getCirclesByUser(
            network,
            address as Hash
          ),
          savingsCircleFactoryService.getCirclesByParticipant(
            network,
            address as Hash
          ),
        ]);

        const createdInfos = await Promise.all(
          (created as Hash[]).map((addr) => savingsCircleFactoryService.getCircleInfo(addr))
        );
        const participantInfos = await Promise.all(
          (participated as Hash[]).map((addr) => savingsCircleFactoryService.getCircleInfo(addr))
        );

        setCreatedCircles(createdInfos);
        setParticipantCircles(participantInfos);
      }
    } catch (err: unknown) {
      console.error("❌ Error fetching enriched circles:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Fallo al obtener las tandas.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [network, address]);

  useEffect(() => {
    if (network) void fetchCircles();
  }, [network, fetchCircles]);

  /**
   * ➕ Creates a new SavingsCircle (tanda) and refreshes the state.
   */
  const addCircle = useCallback(
    async (params: CreateCircleParams): Promise<Hash | null> => {
      if (!network) {
        setError("⚠️ Red no soportada o no seleccionada.");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const txHash = await savingsCircleFactoryService.createCircle(
          network,
          params
        );
        
        await fetchCircles();
        return txHash;
      } catch (err: unknown) {
        console.error("❌ Error creating circle:", err);
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "Fallo al crear la tanda.";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [network, fetchCircles]
  );

  return {
    network,
    allCircles,
    createdCircles,
    participantCircles,
    totalCircles,
    loading,
    error,
    addCircle,
    refetch: fetchCircles,
  };
}
