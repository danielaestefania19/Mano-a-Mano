import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertTriangle, ImagePlus } from 'lucide-react'
import { useSavingsCircles } from '../hooks/useSavingsCircleFactory'
import { type CreateCircleParams } from '../types/types'
import { parseEther } from 'viem'
import { getEthToMxnRate } from '../services/ethPriceService'
import { uploadToPinata } from '../services/pinataService'

const NewTandaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose,
}) => {
    const { addCircle, loading, error } = useSavingsCircles()
    const [txHash, setTxHash] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [ethRate, setEthRate] = useState<number>(0)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [validationErrors, setValidationErrors] = useState<string[]>([])

    const [formData, setFormData] = useState<CreateCircleParams>({
        name: '',
        image: '',
        contributionAmount: 0n,
        maxParticipants: 0,
        roundDuration: 0n,
        insuranceDeposit: 0n,
    })

    const [amounts, setAmounts] = useState({
        contributionMXN: '',
        insuranceMXN: '',
    })

    const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'custom'>('weekly')
    const [customDays, setCustomDays] = useState('')

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                image: '',
                contributionAmount: 0n,
                maxParticipants: 0,
                roundDuration: 0n,
                insuranceDeposit: 0n,
            })
            setAmounts({ contributionMXN: '', insuranceMXN: '' })
            setPreview(null)
            setValidationErrors([])
            setFrequency('weekly')
            setCustomDays('')
            setTxHash(null)

            const durationMs = 7 * 24 * 60 * 60 * 1000
            setFormData((prev) => ({ ...prev, roundDuration: BigInt(durationMs) }))
        }
    }, [isOpen])

    useEffect(() => {
        async function fetchRate() {
            const rate = await getEthToMxnRate()
            setEthRate(rate)
            setLastUpdated(new Date())
        }

        void fetchRate()

        const interval = setInterval(fetchRate, 5 * 60 * 1000) // ✅ usar const aquí

        return () => clearInterval(interval)
    }, [])

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadingImage(true)
        try {
            const pinataUrl = await uploadToPinata(file)
            setPreview(pinataUrl)
            setFormData((prev) => ({ ...prev, image: pinataUrl }))
        } catch (err) {
            console.error('Error subiendo a Pinata:', err)
            alert('Error subiendo imagen a Pinata')
        } finally {
            setUploadingImage(false)
        }
    }
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (!ethRate || !value) return

        const ethValue = Number(value) / ethRate
        const weiValue = parseEther(ethValue.toString())

        if (name === 'contributionMXN') {
            setAmounts({
                contributionMXN: value,
                insuranceMXN: value,
            })
            setFormData((prev) => ({
                ...prev,
                contributionAmount: weiValue,
                insuranceDeposit: weiValue,
            }))
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'maxParticipants' ? Number(value) : value,
        }))
    }
    const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as typeof frequency
        setFrequency(value)

        let durationMs = 0

        if (value === 'weekly') durationMs = 7 * 24 * 60 * 60 * 1000
        else if (value === 'biweekly') durationMs = 15 * 24 * 60 * 60 * 1000
        else if (value === 'monthly') durationMs = 30 * 24 * 60 * 60 * 1000
        else if (value === 'custom') {
            setCustomDays('')
            setFormData((prev) => ({ ...prev, roundDuration: 0n }))
            return
        }

        setFormData((prev) => ({
            ...prev,
            roundDuration: BigInt(durationMs),
        }))
    }

    const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const days = Number(e.target.value)
        setCustomDays(e.target.value)
        if (!isNaN(days) && days > 0) {
            const durationMs = days * 24 * 60 * 60 * 1000
            setFormData((prev) => ({ ...prev, roundDuration: BigInt(durationMs) }))
        }
    }

    const validateForm = (): boolean => {
        const errors: string[] = []
        if (!formData.name.trim()) errors.push('El nombre de la tanda es obligatorio.')
        if (!formData.image) errors.push('Debes subir una imagen para la tanda.')
        if (!amounts.contributionMXN) errors.push('El monto de contribución es obligatorio.')
        if (!formData.maxParticipants || formData.maxParticipants <= 1)
            errors.push('Debe haber al menos 2 participantes.')
        if (Number(formData.roundDuration) <= 0)
            errors.push('Debes seleccionar una duración válida para la ronda.')
        if (Number(amounts.contributionMXN) < 50)
            errors.push('La contribución mínima debe ser de al menos $50 MXN.')
        if (Number(customDays) > 90)
            errors.push('La duración personalizada no puede superar 90 días.')

        setValidationErrors(errors)
        return errors.length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        const tx = await addCircle(formData)
        if (tx) setTxHash(tx)
    }

    if (!isOpen) return null

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
                      const pago = formatAmount(item.contributionAmount);
                      const total = formatAmount(
                        BigInt(totalETH * 1e18)
                      );
                      const plazo = formatDuration(item.roundDuration);
                      const periodo = getTotalDuration(
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
                                className={`rounded-full object-cover w-10 h-10 transition-opacity duration-300 ${
                                  loadedImages[item.address]
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </td>
                          <td className="p-3 text-gray-600">{periodo}</td>
                          <td className="p-3 text-gray-600">{plazo}</td>
                          <td className="p-3 font-medium">
                            {total.mxn}
                            <br />
                            <span className="text-xs text-gray-500">
                              {total.eth}
                            </span>
                          </td>
                          <td className="p-3">
                            {pago.mxn}
                            <br />
                            <span className="text-xs text-gray-500">
                              {pago.eth}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold">
                              {item.maxParticipants}
                            </span>
                          </td>
                          <td className="p-3 flex items-center gap-2">
                            <img
                              src={`https://i.pravatar.cc/100?u=${item.owner}`}
                              alt="owner"
                              className="w-8 h-8 rounded-full object-cover"
                            />
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
                      const pago = formatAmount(item.contributionAmount);
                      const total = formatAmount(BigInt(totalETH * 1e18));
                      const plazo = formatDuration(item.roundDuration);
                      const periodo = getTotalDuration(
                        item.roundDuration,
                        item.maxParticipants
                      );

                      return (
                        <tr
                          key={item.address}
                          className="border-t hover:bg-gray-50 transition"
                        >
                          <td className="p-3 flex items-center gap-2">
                            <img
                              src={
                                item.image || "https://via.placeholder.com/40"
                              }
                              alt={item.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="font-medium">{item.name}</span>
                          </td>
                          <td className="p-3">{periodo}</td>
                          <td className="p-3">{plazo}</td>
                          <td className="p-3">
                            {total.mxn}
                            <br />
                            <span className="text-xs text-gray-500">
                              {total.eth}
                            </span>
                          </td>
                          <td className="p-3">
                            {pago.mxn}
                            <br />
                            <span className="text-xs text-gray-500">
                              {pago.eth}
                            </span>
                          </td>
                          <td className="p-3">{item.maxParticipants}</td>
                          <td className="p-3">
                            {item.owner.slice(0, 6)}...{item.owner.slice(-4)}
                          </td>
                          <td className="p-3">
                            <button className="px-3 py-1.5 bg-pink-100 text-pink-700 font-medium rounded-full text-xs hover:bg-pink-200 transition">
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
