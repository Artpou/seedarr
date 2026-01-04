import { Check, Pause, X } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Spinner } from "@/shared/ui/spinner";

export function DownloadStatusBadge({ status }: { status: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "downloading":
        return "secondary";
      case "paused":
        return "outline";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="size-4" />;
      case "downloading":
        return <Spinner className="size-4" />;
      case "paused":
        return <Pause className="size-4" />;
      case "failed":
        return <X className="size-4" />;
      default:
        return null;
    }
  };

  return (
    <Badge variant={getStatusColor(status)} className="capitalize">
      {getStatusIcon(status)}
      {status}
    </Badge>
  );
}
