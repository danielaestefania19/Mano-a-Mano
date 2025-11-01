import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, ImagePlus } from "lucide-react";
import { useSavingsCircles } from "../hooks/useSavingsCircleFactory";
import { type CreateCircleParams } from "../types/types";
import { parseEther } from "viem";
import { getEthToMxnRate } from "../services/ethPriceService";
import { uploadToPinata } from "../services/pinataService";

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

  // Reset modal state when reopened
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
    }
  }, [isOpen])

  // Update ETH ↔ MXN price every 5 min
  useEffect(() => {
    let interval: NodeJS.Timeout
    async function fetchRate() {
      const rate = await getEthToMxnRate()
      setEthRate(rate)
      setLastUpdated(new Date())
    }
    void fetchRate()
    // eslint-disable-next-line prefer-const
    interval = setInterval(fetchRate, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Upload image to Pinata
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

  // MXN → ETH → wei conversion
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
    let durationMs: number
    switch (value) {
      case 'weekly':
        durationMs = 7 * 24 * 60 * 60 * 1000
        break
      case 'biweekly':
        durationMs = 15 * 24 * 60 * 60 * 1000
        break
      case 'monthly':
        durationMs = 30 * 24 * 60 * 60 * 1000
        break
      case 'custom':
        durationMs = 0
        setCustomDays('')
        setFormData((prev) => ({ ...prev, roundDuration: 0n }))
        return
    }
    setFormData((prev) => ({ ...prev, roundDuration: BigInt(durationMs) }))
  }

  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = Number(e.target.value)
    setCustomDays(e.target.value)
    if (!isNaN(days) && days > 0) {
      const durationMs = days * 24 * 60 * 60 * 1000
      setFormData((prev) => ({ ...prev, roundDuration: BigInt(durationMs) }))
    }
  }

  // Validation
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

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    const tx = await addCircle(formData)
    if (tx) setTxHash(tx)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 relative overflow-y-auto max-h-[90vh] transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 border-b pb-3">
          <h2 className="text-2xl font-semibold text-gray-800">Crear nueva tanda</h2>
          <button onClick={onClose}>
            <X className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition" size={22} />
          </button>
        </div>

        {/* ETH ↔ MXN rate */}
        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
          <p>
            1 ETH ≈{' '}
            {ethRate ? (
              <span className="font-semibold text-gray-800">${ethRate.toLocaleString()} MXN</span>
            ) : (
              'Cargando...'
            )}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400">
              Actualizado: {lastUpdated.toLocaleTimeString('es-MX')}
            </p>
          )}
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {txHash ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <CheckCircle size={60} className="text-lime-600" />
            <p className="text-lg font-semibold text-gray-700">¡Tanda creada con éxito!</p>
            <p className="text-sm text-gray-500 break-all">{txHash}</p>
            <button
              onClick={() => {
                setTxHash(null)
                onClose()
              }}
              className="bg-lime-600 text-white px-5 py-2 rounded-lg hover:bg-lime-700 transition"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la tanda</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Tanda semanal de ahorro"
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-lime-500 transition"
              />
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
              <div className="flex items-center gap-3">
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="imageUpload"
                  className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition shadow-sm
                    ${
                      preview
                        ? 'bg-lime-600 text-white hover:bg-lime-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <ImagePlus size={18} />
                  {preview ? 'Cambiar imagen' : 'Agregar imagen'}
                </label>
                {preview && (
                  <span className="text-sm text-gray-600 truncate max-w-[180px]" title={preview}>
                    {preview.split('/').pop()}
                  </span>
                )}
              </div>
              {uploadingImage && (
                <p className="text-sm text-gray-500 mt-2">Subiendo imagen a IPFS...</p>
              )}
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-3 w-full h-44 object-cover rounded-xl border border-gray-200 shadow-sm"
                />
              )}
            </div>

            {/* Montos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contribución (MXN)</label>
                <input
                  type="number"
                  name="contributionMXN"
                  value={amounts.contributionMXN}
                  onChange={handleAmountChange}
                  placeholder="1000"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-lime-500 transition"
                />
                {amounts.contributionMXN && ethRate > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ {(Number(amounts.contributionMXN) / ethRate).toFixed(6)} ETH
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depósito de seguro (MXN)
                </label>
                <input
                  type="number"
                  name="insuranceMXN"
                  value={amounts.insuranceMXN}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-xl p-3 cursor-not-allowed"
                />
                {amounts.insuranceMXN && ethRate > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ {(Number(amounts.insuranceMXN) / ethRate).toFixed(6)} ETH
                  </p>
                )}
              </div>
            </div>

            {/* Participantes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de participantes
              </label>
              <input
                type="number"
                name="maxParticipants"
                onChange={handleChange}
                placeholder="Ej: 10"
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-lime-500 transition"
              />
            </div>

            {/* Duración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración de cada ronda
              </label>
              <select
                value={frequency}
                onChange={handleFrequencyChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-lime-500 transition"
              >
                <option value="weekly">Cada semana</option>
                <option value="biweekly">Cada 15 días</option>
                <option value="monthly">Cada mes</option>
                <option value="custom">Personalizada (en días)</option>
              </select>
              {frequency === 'custom' && (
                <div className="mt-3">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customDays}
                    onChange={handleCustomDaysChange}
                    placeholder="Ej: 10"
                    className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-lime-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La duración personalizada no puede superar 90 días.
                  </p>
                </div>
              )}
            </div>

                        {error && (
                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                <AlertTriangle size={14} /> {error}
                            </p>
                        )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold py-3 rounded-xl shadow-md transition"
            >
              {loading ? 'Creando tanda...' : 'Crear tanda'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default NewTandaModal;
