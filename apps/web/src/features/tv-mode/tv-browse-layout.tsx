import type { ReactNode } from "react";

import type { Media } from "@seedarr/sdk";

import { TvMediaPreviewPanel } from "@/features/tv-mode/tv-media-preview-panel";

type TvBrowseLayoutProps = {
  media: Media | null;
  children: ReactNode;
  emptyLabel?: ReactNode;
};

export function TvBrowseLayout({ media, children, emptyLabel }: TvBrowseLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TvMediaPreviewPanel media={media} emptyLabel={emptyLabel} />
      <div data-slot="tv-browse-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
