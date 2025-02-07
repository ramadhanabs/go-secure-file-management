import { useMemo, useState } from "react"
import { Button } from "./components/ui/button"
import { Image, Github, X, Download, Play, Pause, FileText, Trash } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import FileUploader from "./components/ui/file-uploader"
import { formatFileSize, generateChecksum } from "./utils/utils"
import { v4 as uuidv4 } from "uuid"

const BASE_URL = "http://localhost:8080/api/file"

function App() {
  let controller, signal
  const CHUNK_SIZE = 512 * 1000 //500kb

  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)

  // file state
  const fullChunks = useMemo(() => {
    if (!file) return 0

    return Math.floor(file.size / CHUNK_SIZE)
  }, [file])
  console.log("🚀 ~ fullChunks ~ fullChunks:", fullChunks)
  
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
          console.log("🚀 ~ handleResumeUpload ~ uploadCount:", uploadCount)
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

          const response = await fetch(`${BASE_URL}/upload-chunk`, {
            method: "POST",
            body: data,
            signal,
          })

          if (response.status === 201) {
            const json = await response.json()

            setUploadCount(prev => prev + 1)
            localUpdateCount++

            const percentage = (localUpdateCount / fullChunks) * 100

            console.log(json)
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

          data.append("file", chunkedFile)
          data.append("metadata", JSON.stringify(metadata))

          const response = await fetch(`${BASE_URL}/upload-chunk`, {
            method: "POST",
            body: data,
          })

          if (response.status === 200) {
            const json = await response.json()
            console.log("🚀 ~ handleResumeUpload ~ json:", json)
            alert("Success upload!")
          } else if (response.status === 422) {
            while (retryCount > 0) {
              const retryResponse = await fetch(`${BASE_URL}/upload-chunk`, {
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
      console.log("🚀 ~ handleClickUpload ~ error:", error)
    }
  }

  const handlePauseUpload = () => {
    setIsUploading(false)
  }

  const handleCancelUpload = () => {
    setFile(null)
    setIsUploading(false)
  }

  return (
    <div>
      <div className="w-full bg-[#dcff4e] flex items-center justify-center py-1">
        <p className="text-xs text-gray-600">Made with Love by Ramadhana Bagus Solichuddin</p>
      </div>
      <div className="max-w-[1440px] px-16 py-8 mx-auto flex flex-col gap-8">
        {/* Top Section */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl text-gray-700 font-bold">Secure File Management</h1>
            <p className="text-sm text-gray-700">
              Documents and attachments that have been uploaded as part of this project.
            </p>
          </div>

          <Button aria-label="View project on GitHub">
            <Github aria-hidden="true" />
            Github
          </Button>
        </div>

        {/* File Uploader */}
        <FileUploader
          file={file}
          setFile={file => setFile(file)}
          isUploading={isUploading}
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
                  <p className="text-sm text-gray-600">{Math.floor((uploadCount / fullChunks) * 100)}%</p>

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

        <div
          className="p-4 rounded-lg bg-[#fafafa] border border-gray-200 flex flex-col gap-4"
          role="region"
          aria-labelledby="uploaded-files-title"
        >
          <h2 id="uploaded-files-title" className="sr-only">
            Uploaded Files
          </h2>

          <div className="flex gap-4 bg-white p-4 rounded-lg border border-gray-100">
            <div className="p-2 border border-gray-300 rounded-lg w-max h-max">
              <Image className="text-gray-600" />
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-xs text-gray-600">Test Image Name.png</p>
                <p className="text-xs text-gray-600">10MB</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-xs text-gray-600">Date Uploaded</p>
                  <p className="text-xs text-gray-600">Jan 6, 2025</p>
                </div>

                <Button variant="outline" aria-label="Download Test Image Name.png">
                  <Download aria-hidden="true" />
                  Download
                </Button>

                <Button variant="destructive" aria-label="Download Test Image Name.png">
                  <Trash aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
