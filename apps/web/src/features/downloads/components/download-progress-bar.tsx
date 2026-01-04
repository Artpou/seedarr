import { Download, Upload, Users } from "lucide-react";

import { Progress } from "@/shared/ui/progress";

interface DownloadProgressBarProps {
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  className?: string;
}

export function DownloadProgressBar({
  progress,
  downloadSpeed,
  uploadSpeed,
  numPeers,
  className = "",
}: DownloadProgressBarProps) {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{(progress * 100).toFixed(1)}%</span>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="size-3" />
            <span>{(downloadSpeed / 1024 / 1024).toFixed(1)} MB/s</span>
          </div>
          <div className="flex items-center gap-1">
            <Upload className="size-3" />
            <span>{(uploadSpeed / 1024 / 1024).toFixed(1)} MB/s</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="size-3" />
            <span>{numPeers}</span>
          </div>
        </div>
      </div>
      <Progress value={progress * 100} className="h-2" />
    </div>
  );
}
