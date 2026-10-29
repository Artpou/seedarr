import { Trans } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";

import type { InfiniteResultsQuery } from "@/shared/hooks/use-infinite-list";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";

import { MediaGrid } from "@/features/media/components/media-grid";
import { TvBrowseLayout } from "@/features/tv-mode/tv-browse-layout";
import { pickFirstMedia, useTvPreviewMedia } from "@/features/tv-mode/use-tv-preview-media";

type TvLibraryViewProps = {
  results: Media[];
  mediaQuery: InfiniteResultsQuery<Media>;
  effectiveQuery: string;
};

export function TvLibraryView({ results, mediaQuery, effectiveQuery }: TvLibraryViewProps) {
  const defaultMedia = pickFirstMedia([results[0]]);
  const { previewMedia, setPreviewMedia } = useTvPreviewMedia(defaultMedia, results);

  return (
    <TvBrowseLayout media={previewMedia} emptyLabel={<Trans>Select a title in your library</Trans>}>
      <Container className="px-4 py-4 md:px-6">
        {results.length > 0 ? (
          <MediaGrid
            items={results}
            query={mediaQuery}
            showType
            downloadMode
            tvSelectedMedia={previewMedia}
            onTvItemFocused={setPreviewMedia}
            tvBarUpFocusKey="NAV-/downloads"
          />
        ) : (
          <Card>
            <div className="py-10 text-center">
              <p className="text-muted-foreground">
                {effectiveQuery ? (
                  <Trans>No results found for "{effectiveQuery}"</Trans>
                ) : (
                  <Trans>No downloads yet</Trans>
                )}
              </p>
            </div>
          </Card>
        )}
      </Container>
    </TvBrowseLayout>
  );
}
