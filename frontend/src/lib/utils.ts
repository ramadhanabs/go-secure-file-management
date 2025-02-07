import { clsx, type ClassValue } from "clsx"
import { jwtDecode } from "jwt-decode"
import { twMerge } from "tailwind-merge"

export type JwtPayload = {
  email: string
  exp: number
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

export function isTokenValid(): boolean {
  const token = localStorage.getItem("ACCESS_TOKEN")
  if (!token) return false

  try {
    const decoded: JwtPayload = jwtDecode(token)
    return decoded.exp * 1000 > Date.now() // Check expiration
  } catch (error) {
    return false
  }
}

export async function customFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("ACCESS_TOKEN")
  const baseUrl = import.meta.env.VITE_BASE_URL
  console.log("🚀 ~ customFetch ~ baseUrl:", baseUrl)

  // Merge headers with Authorization token
  const headers: HeadersInit = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "", 
  }

  // Only set Content-Type explicitly for JSON requests
  if (options.body && !(options.body instanceof FormData)) {
    //@ts-ignore
    headers["Content-Type"] = "application/json"
  }

  const response = await fetch(baseUrl + url, { ...options, headers })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("ACCESS_TOKEN")
      throw new Error("Unauthorized: Please log in again")
    }
    throw new Error(`HTTP Error: ${response.status}`)
  }

  return response
}
