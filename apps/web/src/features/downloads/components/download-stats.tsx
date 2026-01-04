import { Trans } from "@lingui/react/macro";
import { Download, FileText, Upload, Users } from "lucide-react";

interface DownloadStatsProps {
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  size: number;
  downloaded: number;
  uploaded: number;
  className?: string;
}

export function DownloadStats({
  downloadSpeed,
  uploadSpeed,
  numPeers,
  size,
  downloaded,
  uploaded,
  className = "",
}: DownloadStatsProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Download className="size-4" />
          <span>
            <Trans>Download</Trans>
          </span>
        </div>
        <p className="text-lg font-semibold">{(downloadSpeed / 1024 / 1024).toFixed(2)} MB/s</p>
        <p className="text-xs text-muted-foreground">{formatBytes(downloaded)}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Upload className="size-4" />
          <span>
            <Trans>Upload</Trans>
          </span>
        </div>
        <p className="text-lg font-semibold">{(uploadSpeed / 1024 / 1024).toFixed(2)} MB/s</p>
        <p className="text-xs text-muted-foreground">{formatBytes(uploaded)}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>
            <Trans>Peers</Trans>
          </span>
        </div>
        <p className="text-lg font-semibold">{numPeers}</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <FileText className="size-4" />
          <span>
            <Trans>Size</Trans>
          </span>
        </div>
        <p className="text-lg font-semibold">{formatBytes(size)}</p>
      </div>
    </div>
  );
}
