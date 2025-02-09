import { z } from "zod"

export const authResponseSchema = z.object({
  email: z.string().email(),
  token: z.string(),
})

export const authRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const fileMetadataSchema = z.object({
  order: z.number(),
  fileId: z.string(),
  offset: z.number(),
  limit: z.number(),
  fileSize: z.number(),
  fileName: z.string(),
  checkSum: z.string(),
})

export const fileSchema = z.object({
  id: z.number(),
  filename: z.string(),
  size: z.number(),
  mime_type: z.string(),
  created_at: z.string(),
})

export const fileResponseSchema = z.array(fileSchema)
