import { Area, AreaChart, CartesianGrid, ResponsiveContainer, YAxis } from "recharts";

import { SeedarrLoader } from "@/shared/components/seedarr-loader";
import { Card } from "@/shared/ui/card";

interface NetworkDataPoint {
  time: string;
  download: number;
  upload: number;
}

interface DownloadNetworkChartProps {
  data: NetworkDataPoint[];
  status: string;
}

export function DownloadNetworkChart({ data, status }: DownloadNetworkChartProps) {
  const isDownloading = status === "downloading";

  if (data.length < 2) {
    return (
      <Card className="p-3">
        <SeedarrLoader className="my-11" size={40} />
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              {isDownloading ? (
                <linearGradient id="colorData" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              ) : (
                <linearGradient id="colorData" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <YAxis
              className="text-xs"
              tick={{ fill: "var(--muted-foreground)" }}
              label={{ value: "MB/s", angle: -90, position: "insideLeft" }}
            />
            {isDownloading ? (
              <Area
                type="monotone"
                dataKey="download"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#colorData)"
                name="Download"
                animationDuration={300}
                animationEasing="ease-in-out"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="upload"
                stroke="var(--blue)"
                strokeWidth={2}
                fill="url(#colorData)"
                name="Upload"
                animationDuration={300}
                animationEasing="ease-in-out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
