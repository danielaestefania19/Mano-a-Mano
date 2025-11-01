export async function getEthToMxnRate(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=mxn'
    )
    const data = await res.json()
    return data.ethereum.mxn as number
  } catch (err) {
    console.error('Error obteniendo precio ETH/MXN:', err)
    return 0
  }
}
