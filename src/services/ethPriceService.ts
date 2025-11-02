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


export async function getEthToUsdtRate(): Promise<number> {
  try {
    const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=ETH");
    const data = await res.json();
    const rate = parseFloat(data.data.rates.USDT);
    return rate; 
  } catch (err) {
    console.error("Error obteniendo precio ETH→USDT:", err);
    return 0;
  }
}

