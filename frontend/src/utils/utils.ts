export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes === 0) return "0 Bytes"

  const units = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024))
  const formattedSize = (sizeInBytes / Math.pow(1024, i)).toFixed(2)

  return `${formattedSize} ${units[i]}`
}

export const generateChecksum = async (chunk: Blob) => {
  const buffer = await chunk.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}
