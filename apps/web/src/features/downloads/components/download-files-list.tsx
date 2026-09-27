import { useState } from "react";

import { Trans } from "@lingui/react/macro";
import type { TorrentInspectFile } from "@seedarr/sdk";
import { SUBTITLE_EXTENSIONS, VIDEO_EXTENSIONS } from "@seedarr/shared";
import { CheckCircle2Icon, ChevronDownIcon, ChevronUpIcon, DownloadIcon, FileIcon, VideoIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Flag } from "@/shared/components/flag";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

type TorrentFileRow = TorrentInspectFile & {
  progress?: number;
  downloaded?: number;
};

interface DownloadFilesListProps {
  className?: string;
  files: TorrentFileRow[];
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

type FileType = "video" | "subtitle" | "other";

function getFileType(fileName: string): FileType {
  const ext = fileName.toLowerCase().split(".").pop() || "";

  if (VIDEO_EXTENSIONS.test(ext)) return "video";
  if (SUBTITLE_EXTENSIONS.test(ext)) return "subtitle";
  return "other";
}

function getVideoType(files: TorrentFileRow[]): string {
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext && VIDEO_EXTENSIONS.test(ext)) {
      return ext.toUpperCase();
    }
  }
  return "";
}

function sortFiles(files: TorrentFileRow[]): TorrentFileRow[] {
  const typeOrder: Record<FileType, number> = { video: 1, subtitle: 2, other: 3 };

  return [...files].sort((a, b) => {
    const typeA = getFileType(a.name);
    const typeB = getFileType(b.name);
    return typeOrder[typeA] - typeOrder[typeB];
  });
}

function fileProgress(file: TorrentFileRow): number {
  if (typeof file.progress === "number" && Number.isFinite(file.progress)) return file.progress;
  if (file.length > 0 && typeof file.downloaded === "number") return file.downloaded / file.length;
  return 0;
}

export function DownloadFilesList({ className, files, title, defaultExpanded = true }: DownloadFilesListProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!files || files.length === 0) return null;

  const sortedFiles = sortFiles(files);
  const subtitleCount = files.filter((file) => getFileType(file.name) === "subtitle").length;
  const videoType = getVideoType(files);

  function getFileIcon(type: FileType, fileName: string, progress: number) {
    if (progress >= 1) {
      return <CheckCircle2Icon className="size-4 text-primary" />;
    }
    if (progress > 0) {
      return <DownloadIcon className="size-4 text-primary animate-pulse" />;
    }
    switch (type) {
      case "video":
        return <VideoIcon className="size-4" />;
      case "subtitle":
        return <Flag lang={fileName.split(".")?.[0]?.toLowerCase()} />;
      default:
        return <FileIcon className="size-4" />;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileIcon className="size-6" />
          <h2 className="text-lg font-semibold">
            {title || <Trans>Files</Trans>} ({files.length})
          </h2>
          <div className="flex items-center gap-1">
            {videoType.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {videoType}
              </Badge>
            )}
            {subtitleCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Trans>{subtitleCount} subtitles</Trans>
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className={cn("overflow-y-auto space-y-1 pr-2 max-h-80", className)}>
          {sortedFiles.map((file) => {
            const fileType = getFileType(file.name);
            const progress = fileProgress(file);
            const isDone = progress >= 1;
            const isActive = progress > 0 && progress < 1;

            return (
              <div
                key={file.path}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-colors",
                  isDone && "bg-primary/50",
                  isActive && "bg-primary/20",
                  !isDone && !isActive && "bg-muted/50 hover:bg-muted",
                )}
              >
                {getFileIcon(fileType, file.name, progress)}
                <span className="truncate flex-1 text-sm">{file.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
