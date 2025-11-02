// src/services/pinataService.ts
export async function uploadToPinata(file: File): Promise<string> {
  const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4ODA5NDhjOC01Y2M5LTRkYjEtYWNlNS1jY2ExYzZhMjJhOGIiLCJlbWFpbCI6ImRhbmllbGFjYXN0ZWxsYW5vMTAwMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZWU5OWViZjU3N2Y0NzdmYWYzMGYiLCJzY29wZWRLZXlTZWNyZXQiOiIwOTA0MzFlNGNkMWI1YTEyMDY3ZWNmZDEwN2QwODNiNzY5YmJkNjcyZmE4YWYzYWZlYzJiNDBkZmIxNWQ5ZjIyIiwiZXhwIjoxNzkzNTU4NTkwfQ.DtpQQ5thbsOhgb-ych8g9VRAVKTU6VAJ9E7tXYHOhgs"
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
