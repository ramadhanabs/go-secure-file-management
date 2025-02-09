import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { Button } from "./button"
import { Image, Download, Trash, Origami } from "lucide-react"
import { formatFileSize } from "@/lib/utils"
import { FileList } from "@/pages/App"

interface FileItemsProps {
  data: FileList[]
  isFetching: boolean
  handleClickDownload: (id: number) => void
  handleClickDelete: (id: number) => void
}

const FileItems = ({
  data,
  isFetching,
  handleClickDelete,
  handleClickDownload,
}: FileItemsProps) => {
  if (isFetching) {
    return (
      <div className="p-4 rounded-lg bg-[#fafafa] border border-gray-200 flex flex-col gap-4">
        <p className="font-semibold text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-[#fafafa] border border-gray-200 flex flex-col gap-4 items-center">
        <Origami className="text-gray-600" />
        <p className="font-semibold text-sm text-gray-600">Data Not Found</p>
      </div>
    )
  }

  return (
    <div
      className="p-4 rounded-lg bg-[#fafafa] border border-gray-200 flex flex-col gap-4"
      role="region"
      aria-labelledby="uploaded-files-title"
    >
      <h2 id="uploaded-files-title" className="sr-only">
        Uploaded Files
      </h2>

      {data.map(item => (
        <div
          key={item.id}
          className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg border border-gray-100 justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 border border-gray-300 rounded-lg w-max h-max">
              <Image className="text-gray-600" />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-semibold text-xs text-gray-600">{item.filename}</p>
              <p className="text-xs text-gray-600">{formatFileSize(item.size)}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center w-full md:w-max gap-2">
            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-max">
              <div className="flex flex-col gap-1 ">
                <p className="font-semibold text-xs text-gray-600">Date Uploaded</p>
                <p className="text-xs text-gray-600">
                  {format(new Date(item.created_at), "MMMM do, yyyy")}
                </p>
              </div>

              <Button
                variant="outline"
                aria-label="Download Test Image Name.png"
                onClick={() => handleClickDownload(item.id)}
                className="w-full md:w-max"
              >
                <Download aria-hidden="true" />
                Download
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" aria-label="Download Test Image Name.png">
                    <Trash aria-hidden="true" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your file and
                      remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleClickDelete(item.id)}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FileItems
