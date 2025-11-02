import { useEffect, useMemo, useState } from "react";
import { useSavingsCircles } from "../hooks/useSavingsCircleFactory";
import NewTandaModal from "./NewTandaModal";
import { getEthToUsdtRate } from "../services/ethPriceService";
import { useNavigate } from "react-router-dom";
import { useChainId } from "wagmi";
import arbitrum_icon from "../assets/arbitrum_icon.png";
import scroll_icon from "../assets/scroll_icon.png";
import { arbitrumSepolia } from "@reown/appkit/networks";
import EnsOrAddress from "./EnsOrAddress";

export default function Tandas() {
  const {
    createdCircles,
    allCircles,
    participantCircles,
    loading,
    error,
    refetch,
  } = useSavingsCircles();
  const navigate = useNavigate();
  const chainId = useChainId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ethToUsdt, setEthToUsdt] = useState<number>(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const networkLogo =
    chainId === arbitrumSepolia.id ? arbitrum_icon : scroll_icon;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const fetchRate = async () => {
      const rate = await getEthToUsdtRate();
      setEthToUsdt(rate);
    };
    fetchRate();
  }, []);

  const myCircles = useMemo(() => {
    const uniqueMap = new Map<string, (typeof createdCircles)[0]>();
    [...createdCircles, ...participantCircles].forEach((c) =>
      uniqueMap.set(c.address, c)
    );
    return Array.from(uniqueMap.values());
  }, [createdCircles, participantCircles]);

  const publicCircles = useMemo(() => {
    const myAddresses = new Set(myCircles.map((c) => c.address));
    return allCircles.filter((c) => !myAddresses.has(c.address));
  }, [allCircles, myCircles]);

  const formatToUSDT = (ethAmount: bigint): string => {
    const ethValue = Number(ethAmount) / 1e18;
    const usdtValue = Math.round(ethValue * ethToUsdt);
    return `${usdtValue} USDT`;
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
      return `${days.toFixed(0)} día${days >= 2 ? "s" : ""}`;
    }

    const weeks = days / 7;
    if (weeks < 8) {
      return `${weeks.toFixed(0)} semana${weeks >= 2 ? "s" : ""}`;
    }

    const months = weeks / 4.345;
    if (months < 12) {
      return `${months.toFixed(0)} mes${months >= 2 ? "es" : ""}`;
    }

    const years = months / 12;
    return `${years.toFixed(1)} año${years >= 2 ? "s" : ""}`;
  };

  const handleImageLoad = (key: string) =>
    setLoadedImages((prev) => ({ ...prev, [key]: true }));

  const getTotalDuration = (roundDuration: bigint, participants: number) => {
    const totalSeconds =
      (Number(roundDuration) > 1e12
        ? Number(roundDuration) / 1000
        : Number(roundDuration)) * participants;
    return formatDuration(BigInt(totalSeconds));
  };

  const renderAmount = (ethAmount: bigint) => (
    <div className="flex flex-col">
      <span className="flex items-center gap-1 font-medium">
        {formatToUSDT(ethAmount)}{" "}
        <img src={networkLogo} alt="logo" className="w-6 h-6 inline-block" />
      </span>
      <span className="text-xs text-gray-500">{formatToETH(ethAmount)}</span>
    </div>
  );

  return (
    <div className="flex-1 p-10 bg-gray-50 min-h-screen text-gray-800">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Tandas activas
          <img
            src={networkLogo}
            alt="network"
            className="w-6 h-6 rounded-full"
          />
        </h1>
        <div className="flex gap-3">
          <button
            onClick={refetch}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition"
          >
            Recargar
          </button>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium transition"
          >
            Crear nueva tanda
          </button>
          <div className="mt-auto">
            <appkit-button />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          Cargando tandas...
        </div>
      ) : (
        <>
          {/* 🟣 MIS TANDAS */}
          <section className="mb-10 bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Mis tandas activas</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3 font-semibold">Nombre</th>
                    <th className="p-3 font-semibold">Periodo total</th>
                    <th className="p-3 font-semibold">Plazo (por ronda)</th>
                    <th className="p-3 font-semibold">Monto total</th>
                    <th className="p-3 font-semibold">Pago por ronda</th>
                    <th className="p-3 font-semibold">Personas</th>
                    <th className="p-3 font-semibold">Anfitrión</th>
                  </tr>
                </thead>
                <tbody>
                  {myCircles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-4 text-gray-500"
                      >
                        No tienes tandas activas.
                      </td>
                    </tr>
                  ) : (
                    myCircles.map((item) => {
                      const totalETH =
                        (Number(item.contributionAmount) / 1e18) *
                        item.maxParticipants;
                      const totalEthBig = BigInt(totalETH * 1e18);
                      const plazo = formatDuration(item.roundDuration);
                      const totalPeriodo = getTotalDuration(
                        item.roundDuration,
                        item.maxParticipants
                      );

                      return (
                        <tr
                          key={item.address}
                          className="border-t hover:bg-gray-50 transition"
                        >
                          <td className="p-3 flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                              {!loadedImages[item.address] && (
                                <div className="absolute inset-0 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                              )}
                              <img
                                src={
                                  item.image || "https://via.placeholder.com/40"
                                }
                                alt={item.name}
                                onLoad={() => handleImageLoad(item.address)}
                                onError={() => handleImageLoad(item.address)}
                                className={`rounded-full object-cover w-10 h-10 transition-opacity duration-300 ${
                                  loadedImages[item.address]
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </td>
                          <td className="p-3 text-gray-600">{totalPeriodo}</td>
                          <td className="p-3 text-gray-600">{plazo}</td>
                          <td className="p-3">{renderAmount(totalEthBig)}</td>
                          <td className="p-3">
                            {renderAmount(item.contributionAmount)}
                          </td>
                          <td className="p-3">
                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold">
                              {item.maxParticipants}
                            </span>
                          </td>
                          <td className="p-3">
                            <EnsOrAddress
                              address={item.owner as `0x${string}`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 🟢 TANDAS PÚBLICAS */}
          <section className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Tandas públicas activas
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3 font-semibold">Nombre</th>
                    <th className="p-3 font-semibold">Periodo total</th>
                    <th className="p-3 font-semibold">Plazo (por ronda)</th>
                    <th className="p-3 font-semibold">Monto total</th>
                    <th className="p-3 font-semibold">Pago por ronda</th>
                    <th className="p-3 font-semibold">Lugares</th>
                    <th className="p-3 font-semibold">Creada por</th>
                    <th className="p-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {publicCircles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-4 text-gray-500"
                      >
                        No hay tandas públicas disponibles.
                      </td>
                    </tr>
                  ) : (
                    publicCircles.map((item) => {
                      const totalETH =
                        (Number(item.contributionAmount) / 1e18) *
                        item.maxParticipants;
                      const totalEthBig = BigInt(totalETH * 1e18);
                      const plazo = formatDuration(item.roundDuration);
                      const totalPeriodo = getTotalDuration(
                        item.roundDuration,
                        item.maxParticipants
                      );

                      return (
                        <tr
                          key={item.address}
                          className="border-t hover:bg-gray-50 transition"
                        >
                          <td className="p-3 flex items-center gap-2">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                              {!loadedImages[item.address] && (
                                <div className="absolute inset-0 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                              )}
                              <img
                                src={
                                  item.image || "https://via.placeholder.com/40"
                                }
                                alt={item.name}
                                onLoad={() => handleImageLoad(item.address)}
                                onError={() => handleImageLoad(item.address)}
                                className={`rounded-full object-cover w-10 h-10 transition-opacity duration-300 ${
                                  loadedImages[item.address]
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </td>
                          <td className="p-3">{totalPeriodo}</td>
                          <td className="p-3">{plazo}</td>
                          <td className="p-3">{renderAmount(totalEthBig)}</td>
                          <td className="p-3">
                            {renderAmount(item.contributionAmount)}
                          </td>
                          <td className="p-3">
                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold">
                              {item.maxParticipants}
                            </span>
                          </td>
                          <td className="p-3">
                            <EnsOrAddress
                              address={item.owner as `0x${string}`}
                            />
                          </td>

                          <td className="p-3">
                            <button
                              onClick={() => navigate(`/tanda/${item.address}`)}
                              className="px-3 py-1.5 bg-pink-100 text-pink-700 font-medium rounded-full text-xs hover:bg-pink-200 transition"
                            >
                              Unirme
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <NewTandaModal
            isOpen={isModalOpen}
            onClose={closeModal}
            refetchParent={refetch}
          />
        </>
      )}
    </div>
  );
}
