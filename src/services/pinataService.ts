// src/services/pinataService.ts
export async function uploadToPinata(file: File): Promise<string> {
   const JWT = import.meta.env.VITE_PINATA_JWT 
  if (!JWT) throw new Error("Falta el token JWT de Pinata")

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JWT}`,
    },
    body: formData,
  })

  if (!res.ok) throw new Error("Error subiendo archivo a Pinata")

  const data = await res.json()
  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
}
