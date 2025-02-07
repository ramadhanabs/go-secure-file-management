import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { CheckCircle, CloudUpload, FileText, UploadCloud } from "lucide-react"
import { formatFileSize } from "@/lib/utils"
import { Button } from "./button"

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

interface FileUploaderProps {
  file: File | null
  isUploading: boolean
  isSuccess: boolean
  setFile: (file: File | null) => void
  handleClickUpload: () => void
  handleCancelUpload: () => void
}

const FileUploader = ({
  file,
  setFile,
  isUploading,
  isSuccess,
  handleClickUpload,
  handleCancelUpload,
}: FileUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    onDrop: acceptedFiles => {
      const uploadedFile = acceptedFiles[0]
      if (uploadedFile) {
        setFile(uploadedFile)

        // Generate image preview if it's an image
        if (uploadedFile.type.startsWith("image/")) {
          const previewUrl = URL.createObjectURL(uploadedFile)
          setPreview(previewUrl)
        } else {
          setPreview(null) // No preview for PDFs
        }
      }
    },
  })

  const handleClickCancel = () => {
    handleCancelUpload()
    setPreview(null)
  }

  if (isSuccess) {
    return (
      <div className="border-dashed border-2 p-10 rounded-lg w-full flex flex-col items-center justify-center gap-2">
        <CheckCircle className="text-green-500" />
        <p className="text-sm text-gray-700 font-semibold">Success Upload!</p>
        <Button onClick={handleCancelUpload} variant="secondary">
          <UploadCloud />
          Upload another file?
        </Button>
      </div>
    )
  }

  if (file) {
    return (
      <div className="border-dashed border-2 p-10 rounded-lg w-full flex flex-col items-center justify-center">
        <div className="mt-4 text-center flex flex-col gap-2">
          {preview ? (
            <div className="flex flex-col gap-1 p-2 max-w-[400px] border border-gray-200 items-center rounded-lg">
              <img src={preview} alt="Preview" className="mt-2 max-w-xs rounded-md" />
              <p className="text-sm text-gray-700 font-semibold">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2 max-w-[400px] border border-gray-200 items-center rounded-lg">
              <div className="bg-[#fafafa] p-2 rounded-lg border border-gray-100 w-max">
                <FileText />
              </div>
              <p className="text-sm text-gray-700 font-semibold">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleClickCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleClickUpload} disabled={isUploading}>
              <UploadCloud />
              Upload
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-dashed border-2 p-10 rounded-lg w-full flex flex-col items-center justify-center cursor-pointer transition ease-in-out ${
        isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300"
      }`}
      role="button"
      aria-label="Upload file by clicking or dragging"
    >
      <input {...getInputProps()} />
      <CloudUpload className="w-10 h-10 text-gray-600" aria-hidden="true" />
      <p className="text-gray-600 text-sm">
        <span className="underline font-semibold">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-600">Maximum file size 100MB</p>
    </div>
  )
}

export default FileUploader
