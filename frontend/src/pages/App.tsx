import { useEffect, useMemo, useState } from "react"
import { Button } from "../components/ui/button"
import { Image, Github, X, Play, Pause, FileText, LogOut } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import FileUploader from "../components/ui/file-uploader"
import { v4 as uuidv4 } from "uuid"
import { useNavigate, Link } from "react-router"
import { isTokenValid, formatFileSize, generateChecksum, customFetch } from "@/lib/utils"
import { fileMetadataSchema, fileResponseSchema, fileSchema } from "@/schema/schema"
import { z } from "zod"
import FileItems from "@/components/ui/file-items"
import { useToast } from "@/hooks/use-toast"

export type FileList = z.infer<typeof fileSchema>
const CHUNK_SIZE = 500 * 1000 //500kb

function App() {
  const navigate = useNavigate()
  const { toast } = useToast()

  let controller, signal

  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  const [isSuccess, setIsSuccess] = useState(false)

  const [fileList, setFileList] = useState<FileList[]>([])
  const [isFetching, setIsFetching] = useState(true)

  // file state
  const fullChunks = useMemo(() => {
    if (!file) return 0

    if (file.size / CHUNK_SIZE < 1) return 1

    return Math.floor(file.size / CHUNK_SIZE)
  }, [file])

  const remainedChunk = useMemo(() => {
    if (!file) return 0

    return file.size % CHUNK_SIZE
  }, [file])

  const handleClickUpload = () => {
    setIsUploading(true)
    handleResumeUpload()
  }

  const handleResumeUpload = async () => {
    try {
      let localUpdateCount = uploadCount

      setIsUploading(true)

      controller = new AbortController()
      signal = controller.signal

      const fileId = uuidv4()
      let retryCount = 3

      if (fullChunks > 0 && file) {
        while (localUpdateCount < fullChunks && retryCount > 0) {
          const data = new FormData()
          const offset = CHUNK_SIZE * localUpdateCount
          const limit = CHUNK_SIZE * (localUpdateCount + 1)

          const chunkedFile = file.slice(offset, limit)
          const checkSum = await generateChecksum(chunkedFile)
          const metadata = {
            order: localUpdateCount,
            fileId,
            offset,
            limit,
            fileSize: file.size,
            fileName: file.name,
            checkSum,
          }

          data.append("file", chunkedFile)
          data.append("metadata", JSON.stringify(metadata))

          const response = await customFetch("/api/file/upload-chunk", {
            method: "POST",
            body: data,
            signal,
          })

          if (response.status === 201) {
            setUploadCount(prev => prev + 1)
            localUpdateCount++
          } else if (response.status === 422) {
            retryCount--
          }
        }

        retryCount = 3

        if (remainedChunk > 0) {
          const data = new FormData()

          const offset = file.size - remainedChunk
          const limit = file.size

          const chunkedFile = file.slice(offset, limit)
          const checkSum = await generateChecksum(chunkedFile)
          const metadata = {
            order: fullChunks,
            fileId,
            offset,
            limit,
            fileSize: file.size,
            fileName: file.name,
            checkSum,
          }

          const metadataValidation = fileMetadataSchema.safeParse(metadata)
          if (!metadataValidation.success) {
            return
          }

          data.append("file", chunkedFile)
          data.append("metadata", JSON.stringify(metadata))

          const response = await customFetch("/api/file/upload-chunk", {
            method: "POST",
            body: data,
          })

          if (response.status === 201) {
            setIsSuccess(true)
            fetchData()
          } else if (response.status === 422) {
            // retry for error recovery
            while (retryCount > 0) {
              const retryResponse = await customFetch("/api/file/upload-chunk", {
                method: "POST",
                body: data,
              })

              if (retryResponse.status === 200) {
                const json = await retryResponse.json()
                console.log(json)
                break
              } else if (retryResponse.status === 422) {
                retryCount--
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log("🚀 ~ handleResumeUpload ~ error:", error)
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message,
        })
      } else {
        console.error("An unknown error occurred")
      }
    }
  }

  const handlePauseUpload = () => {
    setIsUploading(false)
  }

  const handleCancelUpload = () => {
    setFile(null)
    setIsUploading(false)
    setUploadCount(0)
    setIsSuccess(false)
  }

  const handleClickDownload = async (id: number) => {
    try {
      const response = await customFetch(`/api/file/download/${id}`, {
        method: "GET",
      })

      if (response.status === 200) {
        // Convert response into a blob
        const blob = await response.blob()

        // Create a download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url

        const contentDisposition = response.headers.get("Content-Disposition")
        let filename = "downloaded_file"
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/)
          console.log("🚀 ~ handleClickDownload ~ match:", match)
          if (match) {
            filename = match[1]
          }
        }

        a.download = filename // Set the filename
        document.body.appendChild(a)
        a.click() // Trigger download
        document.body.removeChild(a)

        window.URL.revokeObjectURL(url)
        toast({
          title: "File downloaded!",
        })
      }
    } catch (error) {
      console.log("🚀 ~ handleClickDelete ~ error:", error)
    }
  }

  const handleClickDelete = async (id: number) => {
    try {
      const response = await customFetch(`/api/file/${id}`, {
        method: "DELETE",
      })

      if (response.status === 200) {
        fetchData()
        toast({
          title: "File deleted",
        })
      }
    } catch (error) {
      console.log("🚀 ~ handleClickDelete ~ error:", error)
    }
  }

  const fetchData = async () => {
    try {
      setIsFetching(true)
      const response = await customFetch("/api/file")
      if (response.status === 200) {
        const parsedData = await response.json()

        const responseValidation = fileResponseSchema.safeParse(parsedData.data)
        if (!responseValidation.success) {
          toast({
            variant: "destructive",
            title: "Uh oh! Validation failed.",
          })
          return
        }

        setFileList(parsedData.data)
      }
    } catch (error) {
      console.log("🚀 ~ fetchData ~ error:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleClickLogout = () => {
    localStorage.removeItem("ACCESS_TOKEN")
    navigate("/auth")
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!isTokenValid()) {
      navigate("/auth") // Redirect if token is invalid
    }
  }, [navigate])

  return (
    <div>
      <div className="w-full bg-[#dcff4e] flex items-center justify-center py-1">
        <p className="text-xs text-gray-600">Made with Love by Ramadhana Bagus Solichuddin</p>
      </div>
      <div className="max-w-[1440px] p-4 md:px-16 md:py-8 mx-auto flex flex-col gap-8">
        {/* Top Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl text-gray-700 font-bold">Secure File Management</h1>
            <p className="text-sm text-gray-700">
              Documents and attachments that have been uploaded as part of this project.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="https://github.com/ramadhanabs/go-secure-file-management"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button aria-label="View project on GitHub" className="w-max">
                <Github aria-hidden="true" />
                Github
              </Button>
            </Link>
            <Button
              aria-label="View project on GitHub"
              variant="outline"
              className="w-max"
              onClick={handleClickLogout}
            >
              <LogOut />
              Logout
            </Button>
          </div>
        </div>

        {/* File Uploader */}
        <FileUploader
          file={file}
          setFile={file => setFile(file)}
          isUploading={isUploading}
          isSuccess={isSuccess}
          handleClickUpload={handleClickUpload}
          handleCancelUpload={handleCancelUpload}
        />

        {/* Progress Upload */}
        {file && (
          <div className="border border-gray-200 p-4 rounded-lg w-full relative" aria-live="polite">
            <div className="flex gap-4">
              <div className="p-2 border border-gray-300 rounded-lg w-max h-max">
                {file.type.includes("pdf") ? (
                  <FileText className="text-gray-600" />
                ) : (
                  <Image className="text-gray-600" />
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-sm text-gray-600">{file.name}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                </div>

                <div className="flex items-center gap-4">
                  <Progress
                    value={(uploadCount / fullChunks) * 100}
                    aria-label="File upload progress"
                  />
                  <p className="text-sm text-gray-600">
                    {Math.floor((uploadCount / fullChunks) * 100)}%
                  </p>

                  {!isSuccess && (
                    <>
                      {isUploading ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Pause Upload"
                          onClick={handlePauseUpload}
                        >
                          <Pause />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Resume Upload"
                          onClick={handleResumeUpload}
                        >
                          <Play />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              aria-label="Cancel file upload"
            >
              <X />
            </Button>
          </div>
        )}

        {/* Uploaded File List */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl text-gray-700 font-bold">Uploaded Files</h2>
          <p className="text-sm text-gray-700">
            Files and assets that have been attached to this project.
          </p>
        </div>

        <FileItems
          data={fileList}
          isFetching={isFetching}
          handleClickDelete={handleClickDelete}
          handleClickDownload={handleClickDownload}
        />
      </div>
    </div>
  )
}

export default App
