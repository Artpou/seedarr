import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import { CheckCircle, Download, Layers } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export type StatusFilter = "all" | "ready" | "downloading";

const statusOptions = [
  {
    value: "all" as const,
    icon: <Layers className="text-foreground" />,
    label: msg`All`,
  },
  {
    value: "ready" as const,
    icon: <CheckCircle className="text-foreground" />,
    label: msg`Ready`,
  },
  {
    value: "downloading" as const,
    icon: <Download className="text-foreground" />,
    label: msg`Downloading`,
  },
];

interface DownloadStatusTabsProps {
  value: StatusFilter;
  onValueChange: (value: StatusFilter) => void;
}

export function DownloadStatusTabs({ value, onValueChange }: DownloadStatusTabsProps) {
  const { t } = useLingui();

  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as StatusFilter)}>
      <TabsList className="h-auto p-1">
        {statusOptions.map(({ value: optionValue, icon, label }) => (
          <TabsTrigger
            key={optionValue}
            value={optionValue}
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {icon}
            <span className="font-medium">{t(label)}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
