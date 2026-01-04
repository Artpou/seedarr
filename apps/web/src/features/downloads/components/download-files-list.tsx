import { Trans } from "@lingui/react/macro";
import { CaptionsIcon, File, Video } from "lucide-react";

import { formatBytes } from "@/shared/helpers/format.helper";

interface FileItem {
  path: string;
  name: string;
  length: number;
}

interface DownloadFilesListProps {
  files: FileItem[];
}

type FileType = "video" | "subtitle" | "other";

function getFileType(fileName: string): FileType {
  const ext = fileName.toLowerCase().split(".").pop() || "";

  // Video extensions
  const videoExts = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v", "mpg", "mpeg"];
  if (videoExts.includes(ext)) {
    return "video";
  }

  // Subtitle extensions
  const subtitleExts = ["srt", "vtt", "ass", "ssa", "sub", "idx"];
  if (subtitleExts.includes(ext)) {
    return "subtitle";
  }

  return "other";
}

function getFileIcon(type: FileType) {
  switch (type) {
    case "video":
      return <Video className="size-4" />;
    case "subtitle":
      return <CaptionsIcon className="size-4" />;
    default:
      return <File className="size-4" />;
  }
}

function sortFiles(files: FileItem[]): FileItem[] {
  const typeOrder: Record<FileType, number> = {
    video: 1,
    subtitle: 2,
    other: 3,
  };

  return [...files].sort((a, b) => {
    const typeA = getFileType(a.name);
    const typeB = getFileType(b.name);
    return typeOrder[typeA] - typeOrder[typeB];
  });
}

export function DownloadFilesList({ files }: DownloadFilesListProps) {
  if (!files || files.length === 0) {
    return null;
  }

  const sortedFiles = sortFiles(files);

  return (
    <div>
      <h3 className="text-base font-semibold mb-3">
        <Trans>Files</Trans> ({files.length})
      </h3>
      <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
        {sortedFiles.map((file) => {
          const fileType = getFileType(file.name);
          return (
            <div
              key={file.path}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              {getFileIcon(fileType)}
              <span className="truncate flex-1 text-sm">{file.name}</span>
              <span className="text-muted-foreground text-xs ml-4 shrink-0">
                {formatBytes(file.length)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
