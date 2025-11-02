import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { useSavingsCircle } from "../hooks/useSavingsCircle";
import { getEthToMxnRate } from "../services/ethPriceService";
import type { Circle } from "../types/types";

export default function TandaDetail() {
  const { address } = useParams<{ address: `0x${string}` }>();
  const { address: userAddress } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();

  const tanda = (location.state?.tanda || null) as Circle | null;

  const {
    participants,
    currentRound,
    loading,
    error,
    joinCircle,
    contribute,
    fetchParticipants,
    fetchCurrentRound,
  } = useSavingsCircle(address as `0x${string}`);

  const [ethRate, setEthRate] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleBack = () => navigate(-1);

  // 🪙 Obtener tasa de ETH
  useEffect(() => {
    const fetchRate = async () => {
      const rate = await getEthToMxnRate();
      setEthRate(rate);
    };
    fetchRate();
  }, []);

  // 🔁 Cargar info de tanda
  useEffect(() => {
    if (address) {
      void fetchParticipants();
      void fetchCurrentRound();
    }
  }, [address, fetchParticipants, fetchCurrentRound]);

  const isParticipant = participants.some(
    (p) => p.wallet.toLowerCase() === userAddress?.toLowerCase()
  );
  const isBeneficiary =
    currentRound?.beneficiary?.toLowerCase() === userAddress?.toLowerCase();

  const formatEth = (wei: bigint) => Number(wei) / 1e18;

  const handleJoin = async () => {
    if (!tanda) return;
    if (participants.length >= tanda.maxParticipants) {
      setFeedback("❌ La tanda ya está llena.");
      return;
    }
    try {
      await joinCircle("Participante");
      await fetchParticipants();
      setFeedback("✅ Te has unido correctamente.");
    } catch {
      setFeedback("❌ Error al unirte a la tanda.");
    }
  };

  const handleContribute = async () => {
    if (!tanda) return;
    try {
      await contribute(tanda.contributionAmount);
      await fetchCurrentRound();
      setFeedback("✅ Pago realizado con éxito.");
    } catch {
      setFeedback("❌ Error al realizar el pago.");
    }
  };

  const roundNumber = currentRound ? Number(currentRound.index) + 1 : 1;
  const durationDays = Math.round(
    Number(tanda?.roundDuration || 0n) / 86400
  );
  const totalEth =
    formatEth(tanda?.contributionAmount || 0n) *
    (tanda?.maxParticipants || 1);
  const contributionEth = formatEth(tanda?.contributionAmount || 0n);
  const participantsCount = tanda?.maxParticipants || participants.length;

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen text-gray-800">
      <button
        onClick={handleBack}
        className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition"
      >
        ← Volver
      </button>

      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* 🩷 Mensaje superior */}
      {isParticipant && !isBeneficiary && (
        <div className="text-center bg-pink-50 border border-pink-100 text-pink-700 text-sm rounded-xl py-2 mb-6">
          ¡Tu turno de pago está cada vez más cerca! Solo faltan{" "}
          <b>
            {Math.max(participantsCount - roundNumber, 0)}{" "}
            {participantsCount - roundNumber === 1 ? "turno" : "turnos"}
          </b>
          .
        </div>
      )}

      {/* 🧾 Tarjetas superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Tanda general */}
        <div className="bg-pink-600 text-white rounded-2xl p-6 shadow-md">
          <h2 className="uppercase text-sm font-medium tracking-widest">
            TANDA {roundNumber > 0 ? roundNumber : 1}
          </h2>
          <p className="text-4xl font-bold mt-2">{totalEth.toFixed(3)} ETH</p>
          <p className="text-sm opacity-90 mt-1">
            {durationDays > 0
              ? `${durationDays} días de duración`
              : "Duración aún no definida"}
          </p>
          <p className="text-xs opacity-75 mt-2">
            Participantes: {participantsCount}
          </p>
        </div>

        {/* Ronda actual */}
        <div className="bg-lime-400 text-gray-900 rounded-2xl p-6 flex flex-col justify-between shadow-md relative">
          <div>
            <h2 className="uppercase text-sm font-medium tracking-widest">
              Ronda {roundNumber || "—"}
            </h2>
            <p className="text-4xl font-bold mt-2">
              {contributionEth.toFixed(3)} ETH
            </p>
            <p className="text-sm opacity-80 mt-1">De monto a pagar</p>
          </div>

          {/* 🧠 Estado dinámico */}
          {isParticipant ? (
            isBeneficiary ? (
              <p className="absolute top-5 right-5 text-sm bg-white/50 rounded-full px-3 py-1 text-gray-700 font-medium">
                Beneficiario 🌿
              </p>
            ) : (
              <button
                onClick={handleContribute}
                disabled={loading}
                className="absolute top-5 right-5 bg-pink-100 hover:bg-pink-200 text-pink-700 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm transition"
              >
                Pagar
              </button>
            )
          ) : (
            <button
              onClick={handleJoin}
              disabled={loading}
              className="absolute top-5 right-5 bg-pink-100 hover:bg-pink-200 text-pink-700 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm transition"
            >
              Unirme
            </button>
          )}
        </div>
      </div>

      {/* 🧍 Tabla de turnos */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 border-b">
            <tr>
              <th className="p-3 font-medium">Rol de turnos</th>
              <th className="p-3 font-medium text-right">Pagos</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="text-center text-gray-500 py-4 text-sm"
                >
                  Aún no hay participantes en esta tanda.
                </td>
              </tr>
            ) : (
              participants.map((p, index) => (
                <tr
                  key={p.wallet}
                  className={`border-b last:border-0 ${
                    p.wallet.toLowerCase() === userAddress?.toLowerCase()
                      ? "bg-gray-100"
                      : ""
                  }`}
                >
                  <td className="p-3 flex items-center gap-2">
                    <span className="font-semibold w-6">{index + 1}.</span>
                    <span className="truncate">
                      {p.name ??
                        p.wallet.slice(0, 6) + "..." + p.wallet.slice(-4)}
                    </span>
                  </td>
                  <td className="p-3 text-right text-gray-600">
                    {isBeneficiary ? "Recibe" : "2 - 10"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🪶 Feedback */}
      {feedback && (
        <p
          className={`mt-4 text-sm text-center ${
            feedback.startsWith("✅") ? "text-green-600" : "text-red-500"
          }`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
