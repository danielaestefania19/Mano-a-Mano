import { useEffect, useMemo, useState } from "react";
import { useSavingsCircles } from "../hooks/useSavingsCircleFactory";
import NewTandaModal from "./NewTandaModal";
import { getEthToMxnRate } from "../services/ethPriceService";
import { useNavigate } from "react-router-dom";

export default function Tandas() {
  const {
    createdCircles,
    allCircles,
    participantCircles,
    loading,
    error,
    refetch,
  } = useSavingsCircles();

const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ethToMxn, setEthToMxn] = useState<number>(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    refetch();
  }


  console.log(allCircles)


  console.log(allCircles)

  // 🔹 Obtener el precio actual de ETH en MXN
  useEffect(() => {
    const fetchRate = async () => {
      const rate = await getEthToMxnRate();
      setEthToMxn(rate);
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

  // 🔹 Conversión ETH → MXN
  const formatToMXN = (ethAmount: bigint): string => {
    const ethValue = Number(ethAmount) / 1e18;
    const mxnValue = ethValue * ethToMxn;
    return `$${mxnValue.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} MXN`;
  };

  // 🔹 Convertir duración (en segundos o milisegundos) a texto legible
  const formatDuration = (duration: bigint): string => {
    const seconds =
      Number(duration) > 1e12 ? Number(duration) / 1000 : Number(duration);
    const days = seconds / 86400;

    if (days < 7) return `${Math.round(days)} día${days > 1 ? "s" : ""}`;
    if (days < 14) return "1 semana";
    if (days < 28) return `${Math.round(days / 7)} semanas`;
    if (days < 60) return "1 mes";
    if (days < 120) return "2 meses";
    if (days < 180) return "3 meses";
    if (days < 365) return `${Math.round(days / 30)} meses`;
    return "1 año o más";
  };

  // 🔹 Imagen loader
  const handleImageLoad = (key: string) =>
    setLoadedImages((prev) => ({ ...prev, [key]: true }));

  // 🔹 Calcular duración total
  const getTotalDuration = (roundDuration: bigint, participants: number) => {
    const totalSeconds =
      (Number(roundDuration) > 1e12
        ? Number(roundDuration) / 1000
        : Number(roundDuration)) * participants;
    return formatDuration(BigInt(totalSeconds * 1000)); // reconvertimos para el formato
  };

  return (
    <div className="flex-1 p-10 bg-gray-50 min-h-screen text-gray-800">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Tandas activas</h1>
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
                      <td colSpan={7} className="text-center py-4 text-gray-500">
                        No tienes tandas activas.
                      </td>
                    </tr>
                  ) : (
                    myCircles.map((item) => {
                      const totalETH =
                        (Number(item.contributionAmount) / 1e18) *
                        item.maxParticipants;
                      const pagoRondaMXN = formatToMXN(item.contributionAmount);
                      const totalMXN = formatToMXN(BigInt(totalETH * 1e18));
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
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                              )}
                              <img
                                src={
                                  item.image || "https://via.placeholder.com/40"
                                }
                                alt={item.name}
                                onLoad={() => handleImageLoad(item.address)}
                                onError={() => handleImageLoad(item.address)}
                                className={`rounded-full object-cover w-10 h-10 transition-opacity duration-300 ${loadedImages[item.address]
                                    ? "opacity-100"
                                    : "opacity-0"
                                  }`}
                              />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </td>
                          <td className="p-3 text-gray-600">{totalPeriodo}</td>
                          <td className="p-3 text-gray-600">{plazo}</td>
                          <td className="p-3 font-medium">{totalMXN}</td>
                          <td className="p-3 text-gray-600">{pagoRondaMXN}</td>
                          <td className="p-3">
                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold">
                              {item.maxParticipants}
                            </span>
                          </td>
                          <td className="p-3 flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                              {!loadedImages[item.owner] && (
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                              )}
                              <img
                                src={`https://i.pravatar.cc/100?u=${item.owner}`}
                                alt="owner"
                                onLoad={() => handleImageLoad(item.owner)}
                                onError={() => handleImageLoad(item.owner)}
                                className={`rounded-full object-cover w-8 h-8 transition-opacity duration-300 ${loadedImages[item.owner]
                                    ? "opacity-100"
                                    : "opacity-0"
                                  }`}
                              />
                            </div>
                            <span className="text-sm text-gray-700">
                              {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
                            </span>
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
                      <td colSpan={8} className="text-center py-4 text-gray-500">
                        No hay tandas públicas disponibles.
                      </td>
                    </tr>
                  ) : (
                    publicCircles.map((item) => {
                      const totalETH =
                        (Number(item.contributionAmount) / 1e18) *
                        item.maxParticipants;
                      const pagoRondaMXN = formatToMXN(item.contributionAmount);
                      const totalMXN = formatToMXN(BigInt(totalETH * 1e18));
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
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                              )}
                              <img
                                src={
                                  item.image || "https://via.placeholder.com/40"
                                }
                                alt={item.name}
                                onLoad={() => handleImageLoad(item.address)}
                                onError={() => handleImageLoad(item.address)}
                                className={`rounded-full object-cover w-10 h-10 transition-opacity duration-300 ${loadedImages[item.address]
                                    ? "opacity-100"
                                    : "opacity-0"
                                  }`}
                              />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </td>
                          <td className="p-3">{totalPeriodo}</td>
                          <td className="p-3">{plazo}</td>
                          <td className="p-3">{totalMXN}</td>
                          <td className="p-3">{pagoRondaMXN}</td>
                          <td className="p-3">{item.maxParticipants}</td>
                          <td className="p-3 flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                              {!loadedImages[item.owner] && (
                                <div className="absolute inset-0 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                              )}
                              <img
                                src={`https://i.pravatar.cc/100?u=${item.owner}`}
                                alt="creator"
                                onLoad={() => handleImageLoad(item.owner)}
                                onError={() => handleImageLoad(item.owner)}
                                className={`rounded-full object-cover w-8 h-8 transition-opacity duration-300 ${loadedImages[item.owner]
                                    ? "opacity-100"
                                    : "opacity-0"
                                  }`}
                              />
                            </div>
                            <span className="text-sm text-gray-700">
                              {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
                            </span>
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

          <NewTandaModal isOpen={isModalOpen} onClose={closeModal} />
        </>
      )}
    </div>
  );
}
