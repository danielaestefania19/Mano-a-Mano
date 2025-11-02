import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEthToUsdtRate } from "../services/ethPriceService";
import { savingsCircleFactoryService } from "../services/SavingsCircleFactoryService";
import { useSavingsCircle } from "../hooks/useSavingsCircle";
import { useChainId, useAccount } from "wagmi";
import arbitrum_icon from "../assets/arbitrum_icon.png";
import scroll_icon from "../assets/scroll_icon.png";
import etherum_icon from "../assets/etherum_icon.png";
import {
  arbitrumSepolia,
  scrollSepolia,
  mainnet,
} from "@reown/appkit/networks";
import type { Circle } from "../types/types";
import EnsOrAddress from "../components/EnsOrAddress";

export default function TandaDetail() {
  const { address } = useParams<{ address: `0x${string}` }>();
  const navigate = useNavigate();
  const { address: userAddress } = useAccount();
  const chainId = useChainId();

  const {
    participants,
    currentRound,
    loading: circleLoading,
    error: circleError,
    joinCircle,
    contribute,
    fetchParticipants,
    fetchCurrentRound,
  } = useSavingsCircle(address as `0x${string}`);

  const [circleInfo, setCircleInfo] = useState<Circle | null>(null);
  const [ethToUsdt, setEthToUsdt] = useState<number>(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | null>(null);
  const [modalMessage, setModalMessage] = useState("");
  const [txLoading, setTxLoading] = useState(false);


  const networkLogo =
    chainId === arbitrumSepolia.id
      ? arbitrum_icon
      : chainId === scrollSepolia.id
      ? scroll_icon
      : chainId === mainnet.id
      ? etherum_icon
      : "";

  const handleBack = () => navigate(-1);
  const handleImageLoad = (key: string) =>
    setLoadedImages((prev) => ({ ...prev, [key]: true }));

  const refetch = useCallback(async () => {
    if (!address) return;
    try {
      setLoading(true);
      setError(null);
      const info = await savingsCircleFactoryService.getCircleInfo(address);
      setCircleInfo(info);
      await fetchParticipants();
      await fetchCurrentRound();
    } catch (err) {
      console.error("❌ Error al recargar:", err);
      setError("Error al recargar los datos de la tanda.");
    } finally {
      setLoading(false);
    }
  }, [address, fetchParticipants, fetchCurrentRound]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const rate = await getEthToUsdtRate();
        setEthToUsdt(rate);
      } catch {
        setEthToUsdt(0);
      }
    };
    fetchRate();
  }, [chainId]);

  useEffect(() => {
    if (!address) return;

    (async () => {
      try {
        setLoading(true);
        await refetch();
      } catch (err) {
        console.error("❌ Error loading circle info:", err);
        setError("No se pudo cargar la información de esta tanda.");
      } finally {
        setLoading(false);
      }
    })();
  }, [address, chainId, refetch]);

  const formatToUSDT = (ethAmount: bigint): string => {
    const ethValue = Number(ethAmount) / 1e18;
    const usdtValue = Math.round(ethValue * ethToUsdt);
    return `${usdtValue} USDT$`;
  };

  const formatToETH = (ethAmount: bigint): string => {
    const ethValue = Number(ethAmount) / 1e18;
    return `${ethValue.toFixed(6)} ETH`;
  };

  const formatDuration = (duration: bigint): string => {
    const seconds =
      Number(duration) > 1e12 ? Number(duration) / 1000 : Number(duration);
    const days = seconds / 86400;
    if (days < 14) {
      const d = Math.round(days);
      return `${d} día${d !== 1 ? "s" : ""}`;
    }
    const weeks = days / 7;
    if (weeks < 8) {
      const w = Math.round(weeks);
      return `${w} semana${w !== 1 ? "s" : ""}`;
    }
    const months = weeks / 4.345;
    if (months < 12) {
      const m = Math.round(months);
      return `${m} mes${m !== 1 ? "es" : ""}`;
    }
    const years = months / 12;
    const y = parseFloat(years.toFixed(1));
    return `${y} año${y !== 1 ? "s" : ""}`;
  };

  const getTotalDuration = (roundDuration: bigint, participants: number) => {
    const totalSeconds =
      (Number(roundDuration) > 1e12
        ? Number(roundDuration) / 1000
        : Number(roundDuration)) * participants;
    return formatDuration(BigInt(totalSeconds));
  };

  const renderAmount = (ethAmount: bigint) => (
    <div className="flex flex-col">
      <span className="flex items-center gap-2 font-medium">
        {formatToUSDT(ethAmount)}
      </span>
      <span className="text-xs text-white">{formatToETH(ethAmount)}</span>
    </div>
  );

  const handleJoin = async () => {
    if (!circleInfo) return;
    if (participants.length >= circleInfo.maxParticipants) {
      setModalType("error");
      setModalMessage("❌ La tanda ya está llena.");
      setShowModal(true);
      return;
    }

    try {
      setTxLoading(true);
      const txHash = await joinCircle(circleInfo.insuranceDeposit);
      if (txHash) {
        await refetch();
        setModalType("success");
        setModalMessage(`✅ Te has unido correctamente a la tanda.`);
      } else {
        setModalType("error");
        setModalMessage("⚠️ No se pudo confirmar la transacción.");
      }
      setShowModal(true);
    } catch (err) {
      console.error("❌ Error al unirse:", err);
      setModalType("error");
      setModalMessage("❌ Error al intentar unirte a la tanda.");
      setShowModal(true);
    } finally {
      setTxLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!circleInfo) return;
    try {
      setTxLoading(true);
      const txHash = await contribute(circleInfo.contributionAmount);
      if (txHash) {
        await refetch();
        setModalType("success");
        setModalMessage(`✅ Pago realizado correctamente.`);
      } else {
        setModalType("error");
        setModalMessage("⚠️ No se pudo confirmar la transacción.");
      }
      setShowModal(true);
    } catch (err) {
      console.error("❌ Error al contribuir:", err);
      setModalType("error");
      setModalMessage("❌ Error al intentar realizar el pago.");
      setShowModal(true);
    } finally {
      setTxLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType(null);
    setModalMessage("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        <p className="animate-pulse text-lg font-medium">Cargando tanda...</p>
      </div>
    );
  }

  if (error || !circleInfo) {
    return (
      <div className="p-10 text-center text-gray-700">
        <p className="text-red-600 mb-4">
          {error ?? circleError ?? "No hay información disponible."}
        </p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition"
        >
          ← Volver
        </button>
      </div>
    );
  }

  const totalETH =
    (Number(circleInfo.contributionAmount) / 1e18) *
    (circleInfo.maxParticipants - 1);
  const totalEthBig = BigInt(Math.floor(totalETH * 1e18));
  const totalPeriodo = getTotalDuration(
    circleInfo.roundDuration,
    circleInfo.maxParticipants
  );

  const isParticipant = participants.some(
    (p) => p.wallet.toLowerCase() === userAddress?.toLowerCase()
  );

  const isBeneficiary =
    currentRound?.beneficiary?.toLowerCase() === userAddress?.toLowerCase();

  const tandaCompletada =
    currentRound &&
    (Number(currentRound.index) + 1 >= participants.length ||
      currentRound.status === 2); // 2 = Completed

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen text-gray-800 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Detalle de la tanda
          <img
            src={networkLogo}
            alt="network"
            className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
          />
        </h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={refetch}
            disabled={txLoading || circleLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              txLoading || circleLoading
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            {txLoading ? "Procesando..." : "Recargar"}
          </button>
          <button
            onClick={handleBack}
            disabled={txLoading || circleLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              txLoading || circleLoading
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            {txLoading ? "Procesando..." : "← Volver"}
          </button>
          <div className="mt-auto">
            <appkit-button />
          </div>
        </div>
      </div>

      {/* Bloque principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Izquierda */}
        <div className="bg-pink-600 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between h-full">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-200 shadow-inner">
                <img
                  src={circleInfo.image || "https://via.placeholder.com/60"}
                  alt={circleInfo.name}
                  onLoad={() => handleImageLoad(circleInfo.address)}
                  className={`rounded-full object-cover w-14 h-14 transition-opacity duration-300 ${
                    loadedImages[circleInfo.address]
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />
              </div>
              <h2 className="text-2xl font-semibold leading-tight">
                {circleInfo.name}
              </h2>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-5xl font-bold">{renderAmount(totalEthBig)}</p>
              <p className="text-base opacity-90">
                Periodo total:{" "}
                <span className="font-medium">{totalPeriodo}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Derecha: Todos los casos */}
        <div className="bg-lime-400 text-gray-900 rounded-2xl p-6 shadow-md flex flex-col justify-between h-full relative">
          {tandaCompletada ? (
            // ✅ Caso: Tanda finalizada
            <div className="flex flex-col items-center justify-center text-center py-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                🎉 ¡Tanda completada!
              </h2>
              <p className="text-base text-gray-800 leading-relaxed max-w-md">
                Muchas gracias por participar en la tanda.
                <br />
                Tu depósito de seguro ha sido reembolsado correctamente 💰.
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Esperamos verte en la próxima tanda 🙌
              </p>
            </div>
          ) : !currentRound || currentRound?.status === 0 ? (
            // Caso: Aún no inicia
            !isParticipant ? (
              <>
                <div className="flex flex-col gap-4">
                  <h2 className="uppercase text-2xl font-bold tracking-widest">
                    Próxima tanda
                  </h2>
                  <p className="text-base text-gray-800 leading-snug">
                    No hay ronda activa aún — la tanda comenzará cuando se
                    llenen los cupos.
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                      <p className="text-lg font-semibold text-gray-900">
                        Depósito requerido
                      </p>
                      <div className="flex flex-col">
                        <span className="text-5xl font-bold mb-1">
                          {formatToUSDT(circleInfo.insuranceDeposit)}
                        </span>
                        <span className="text-xs text-gray-700">
                          {formatToETH(circleInfo.insuranceDeposit)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleJoin}
                      disabled={txLoading || circleLoading}
                      className={`mt-12 ml-4 shrink-0 px-5 py-2 rounded-full text-sm font-medium shadow-md transition text-white ${
                        txLoading || circleLoading
                          ? "bg-pink-400 cursor-not-allowed"
                          : "bg-pink-600 hover:bg-pink-700"
                      }`}
                    >
                      {txLoading ? "Procesando..." : "Unirme"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <h2 className="uppercase text-sm font-medium tracking-widest mb-2">
                  Esperando inicio
                </h2>
                <p className="text-gray-800 text-base leading-snug">
                  Te has unido correctamente. La tanda comenzará cuando todos
                  los cupos estén llenos.
                </p>
              </div>
            )
          ) : (
            // Caso: Ronda activa
            <>
              <div>
                <h2 className="uppercase text-sm font-medium tracking-widest">
                  Ronda {Number(currentRound.index) + 1}
                </h2>
                <p className="text-5xl font-bold mt-3 mb-1">
                  {formatToUSDT(circleInfo.contributionAmount)}
                </p>
                <p className="text-base opacity-80">
                  {formatToETH(circleInfo.contributionAmount)}
                </p>
                <p className="text-base opacity-80">De monto a pagar</p>
              </div>
              {isParticipant ? (
                isBeneficiary ? (
                  <p className="absolute top-5 right-5 text-sm bg-white/70 rounded-full px-3 py-1 text-black font-medium shadow-sm">
                    Beneficiario 🌿
                  </p>
                ) : (
                  <button
                    onClick={handleContribute}
                    disabled={txLoading || circleLoading}
                    className={`self-end px-5 py-2 rounded-full text-sm font-medium shadow-md transition text-white ${
                      txLoading || circleLoading
                        ? "bg-pink-400 cursor-not-allowed"
                        : "bg-pink-600 hover:bg-pink-700"
                    }`}
                  >
                    {txLoading ? "Procesando..." : "Pagar"}
                  </button>
                )
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={txLoading || circleLoading}
                  className={`self-end mt-12 px-5 py-2 rounded-full text-sm font-medium shadow-md transition text-white ${
                    txLoading || circleLoading
                      ? "bg-pink-400 cursor-not-allowed"
                      : "bg-pink-600 hover:bg-pink-700"
                  }`}
                >
                  {txLoading ? "Procesando..." : "Unirme"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de transacción */}
      {txLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[90%] max-w-sm text-center">
            <svg
              className="animate-spin h-10 w-10 text-pink-600 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Procesando transacción...
            </h3>
            <p className="text-sm text-gray-500">
              Confirma en tu billetera y espera unos segundos.
            </p>
          </div>
        </div>
      )}

      {/* Modal resultado */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`rounded-2xl shadow-lg p-6 w-[90%] max-w-sm text-center ${
              modalType === "success"
                ? "bg-white border-l-4 border-green-500"
                : "bg-white border-l-4 border-red-500"
            }`}
          >
            <h3
              className={`text-xl font-bold mb-2 ${
                modalType === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {modalType === "success" ? "Éxito" : "Error"}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{modalMessage}</p>
            <button
              onClick={handleCloseModal}
              disabled={txLoading}
              className={`mt-4 px-4 py-2 rounded-full text-sm font-medium transition text-white ${
                txLoading
                  ? "bg-pink-400 cursor-not-allowed"
                  : "bg-pink-600 hover:bg-pink-700"
              }`}
            >
              {txLoading ? "Procesando..." : "Cerrar"}
            </button>
          </div>
        </div>
      )}
      {/* Tabla participantes */}
      <section className="bg-white rounded-xl shadow p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Rol de turnos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-3 font-semibold">Participante</th>
                {currentRound && <th className="p-3 font-semibold">Estado</th>}
              </tr>
            </thead>
            <tbody>
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-6 text-gray-500">
                    No hay participantes aún.
                  </td>
                </tr>
              ) : (
                participants.map((p) => {
                  const isCurrentUser =
                    p.wallet.toLowerCase() === userAddress?.toLowerCase();
                  const isBeneficiaryNow =
                    currentRound &&
                    currentRound.beneficiary?.toLowerCase() ===
                      p.wallet.toLowerCase();
                  const hasPaid =
                    currentRound &&
                    p.hasContributed?.[Number(currentRound.index)] === true;

                  let label = "En espera";
                  let color = "bg-gray-100 text-gray-600";

                  if (tandaCompletada) {
                    label = "Completado ✅";
                    color = "bg-green-100 text-green-700";
                  } else if (isBeneficiaryNow) {
                    label = "Beneficiario 🌿";
                    color = "bg-yellow-100 text-yellow-700";
                  } else if (hasPaid) {
                    label = "Pagado 💸";
                    color = "bg-blue-100 text-blue-700";
                  }

                  return (
                    <tr
                      key={p.wallet}
                      className={`border-t ${
                        isCurrentUser ? "bg-gray-100" : ""
                      }`}
                    >
                      <td className="p-3">
                        <EnsOrAddress
                          address={p.wallet as `0x${string}`}
                          size={28}
                        />
                      </td>
                      {currentRound && (
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}
                          >
                            {label}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
