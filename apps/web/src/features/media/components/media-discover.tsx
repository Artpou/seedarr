import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Trans } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";
import type { InfiniteData, UseInfiniteQueryOptions } from "@tanstack/react-query";
import { useInfiniteQuery, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { LibraryIcon, SparklesIcon, TrophyIcon } from "lucide-react";

import { PlaceholderEmpty } from "@/shared/components/seedarr-placeholder";
import { InfiniteSentinel } from "@/shared/components/sentinel/infinite-sentinel";
import { flattenInfiniteResults } from "@/shared/hooks/use-infinite-list";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";

import { useRole } from "@/features/auth/hooks/use-role";
import { MediaCarousel } from "@/features/media/components/carousel/media-carousel";
import { MediaCarouselWatching } from "@/features/media/components/carousel/media-carousel-watching";
import { MediaGrid } from "@/features/media/components/media-grid";
import { MediaTable } from "@/features/media/components/media-table";
import { MediaTabsViewMode } from "@/features/media/components/tabs/media-tabs-view-mode";
import { discoverScopedTitleIcon } from "@/features/media/helpers/discover-scoped-display.helper";
import {
  isScopedDiscoverSearch,
  type MovieDiscoverSearch,
  type TvDiscoverSearch,
} from "@/features/media/helpers/discover-search.helper";
import { genreQueries } from "@/features/media/hooks/genre.queries";
import { movieQueries } from "@/features/movies/hooks/movie.queries";
import { RequestCarousel } from "@/features/request/components/request-carousel";
import { requestQueries } from "@/features/request/hooks/request.queries";
import { useEffectiveViewMode } from "@/features/settings/hooks/use-effective-view-mode";
import { tvQueries } from "@/features/tv/hooks/tv.queries";

type DiscoverResult = {
  results: Media[];
  page: number;
  totalPages: number;
};

type DiscoverQueryOptions = UseInfiniteQueryOptions<
  DiscoverResult,
  Error,
  InfiniteData<DiscoverResult>,
  readonly unknown[],
  number
>;

function DiscoverAdminPendingRequests({ type }: { type: "movie" | "tv" }) {
  const { data: pendingRequests } = useSuspenseQuery(requestQueries.byType(type));
  if (!pendingRequests.length) return null;
  return (
    <RequestCarousel requests={pendingRequests} seeMoreTo="/requests" seeMoreSearch={{ type, status: "pending" }} />
  );
}

function CategorySentinel({ onReveal }: { onReveal: () => void }) {
  const hasRevealedRef = useRef(false);
  const [ref, entry] = useIntersectionObserver({
    threshold: 0,
    rootMargin: "0px 0px 320px 0px",
  });

  useEffect(() => {
    if (!entry?.isIntersecting || hasRevealedRef.current) return;
    hasRevealedRef.current = true;
    onReveal();
  }, [entry?.isIntersecting, onReveal]);

  return <div ref={ref} className="h-4" aria-hidden />;
}

function MediaCategoryCarousel({
  type,
  genre,
  locale,
}: {
  type: "movie" | "tv";
  genre: { id: number; name: string };
  locale: string;
}) {
  const query = useInfiniteQuery(
    type === "movie"
      ? movieQueries.discover({ with_genres: String(genre.id) }, locale)
      : tvQueries.discover({ with_genres: String(genre.id) }, locale),
  );
  const items = query.data?.pages[0]?.results ?? [];
  const routePath = type === "movie" ? "/movies" : "/tv";

  if (query.isPending) return <div className="h-48 animate-pulse rounded-lg bg-muted/30" aria-hidden />;
  if (items.length === 0) return null;

  return (
    <MediaCarousel
      title={genre.name}
      titleIcon={LibraryIcon}
      data={items}
      seeMoreTo={routePath}
      seeMoreSearch={{ genre: String(genre.id) }}
    />
  );
}

function MediaDiscoverCarousels({
  type,
  locale,
  genres,
}: {
  type: "movie" | "tv";
  locale: string;
  genres: Array<{ id: number; name: string }>;
}) {
  /** How many genre carousels are mounted (one discover call each). Grows by 1 when the sentinel is reached. */
  const [genreRevealCount, setGenreRevealCount] = useState(0);

  const newQuery = useInfiniteQuery(
    type === "movie" ? movieQueries.discover({}, locale) : tvQueries.discover({}, locale),
  );
  const topRatedQuery = useInfiniteQuery({
    ...(type === "movie"
      ? movieQueries.discover({ sort_by: "vote_average.desc" }, locale)
      : tvQueries.discover({ sort_by: "vote_average.desc" }, locale)),
    enabled: newQuery.isFetched,
  });

  const revealNextGenre = useCallback(() => {
    setGenreRevealCount((count) => Math.min(count + 1, genres.length));
  }, [genres.length]);

  const newItems = newQuery.data?.pages[0]?.results ?? [];
  const topRatedItems = topRatedQuery.data?.pages[0]?.results ?? [];
  const routePath = type === "movie" ? "/movies" : "/tv";
  const canLoadGenres = topRatedQuery.isFetched;

  return (
    <div className="space-y-8">
      {newQuery.isFetched && newItems.length > 0 && (
        <MediaCarousel
          title={<Trans>New</Trans>}
          titleIcon={SparklesIcon}
          data={newItems}
          seeMoreTo={routePath}
          seeMoreSearch={{ type: "new" }}
        />
      )}
      {topRatedQuery.isFetched && topRatedItems.length > 0 && (
        <MediaCarousel
          title={<Trans>Top Rated</Trans>}
          titleIcon={TrophyIcon}
          data={topRatedItems}
          seeMoreTo={routePath}
          seeMoreSearch={{ type: "top_rated" }}
        />
      )}
      {canLoadGenres &&
        genres
          .slice(0, genreRevealCount)
          .map((genre) => <MediaCategoryCarousel key={genre.id} type={type} genre={genre} locale={locale} />)}
      {canLoadGenres && genreRevealCount < genres.length && (
        <CategorySentinel key={genreRevealCount} onReveal={revealNextGenre} />
      )}
    </div>
  );
}

type MediaDiscoverProps<TSearch extends MovieDiscoverSearch | TvDiscoverSearch> = {
  type: "movie" | "tv";
  search: TSearch;
  queryOptions: object;
  filtersSheet: ReactNode;
  emptyTitle: ReactNode;
  emptySubtitle: ReactNode;
};

export function MediaDiscover<TSearch extends MovieDiscoverSearch | TvDiscoverSearch>({
  type,
  search,
  queryOptions,
  filtersSheet,
  emptyTitle,
  emptySubtitle,
}: MediaDiscoverProps<TSearch>) {
  const locale = useTmdbLocale();
  const isMobile = useIsMobile();
  const { isAdmin } = useRole();
  const viewMode = useEffectiveViewMode(type);
  const isScoped = isScopedDiscoverSearch(search);

  const { data: genres = [] } = useQuery(genreQueries.list(type, locale));

  const genreNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const genre of genres) map.set(genre.id.toString(), genre.name);
    return map;
  }, [genres]);

  const discoverQuery = useInfiniteQuery(queryOptions as DiscoverQueryOptions);
  const results = flattenInfiniteResults(discoverQuery);

  const sectionTitle = useMemo(() => {
    if (search.type === "new") {
      return type === "movie" ? <Trans>New Movies</Trans> : <Trans>New TV Shows</Trans>;
    }
    if (search.type === "top_rated" || search.type === "top-rated") {
      return type === "movie" ? <Trans>Top Rated Movies</Trans> : <Trans>Top Rated TV Shows</Trans>;
    }
    if (search.genre) {
      const name = genreNameById.get(search.genre);
      if (name) return name;
    }
    return type === "movie" ? <Trans>Movies</Trans> : <Trans>TV Shows</Trans>;
  }, [genreNameById, search.genre, search.type, type]);

  if (!isScoped) {
    return (
      <Container className="space-y-8">
        <MediaCarouselWatching type={type} />
        {isAdmin && <DiscoverAdminPendingRequests type={type} />}
        <MediaDiscoverCarousels type={type} locale={locale} genres={genres} />
      </Container>
    );
  }

  return (
    <Container className="sm:space-y-3">
      {!isMobile && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 flex-1 text-lg font-medium">
            <SectionHeading icon={discoverScopedTitleIcon(search)}>{sectionTitle}</SectionHeading>
          </h2>
          <div className="flex items-center gap-2">
            <MediaTabsViewMode scope={type} />
            {filtersSheet}
          </div>
        </div>
      )}

      {discoverQuery.isPending ? (
        viewMode === "grid" ? (
          <MediaGrid query={discoverQuery} />
        ) : (
          <MediaTable query={discoverQuery} />
        )
      ) : results.length === 0 ? (
        <PlaceholderEmpty title={emptyTitle} subtitle={emptySubtitle} />
      ) : viewMode === "grid" ? (
        <>
          <MediaGrid items={results} query={discoverQuery} />
          <InfiniteSentinel query={discoverQuery} />
        </>
      ) : (
        <>
          <MediaTable media={results} query={discoverQuery} />
          <InfiniteSentinel query={discoverQuery} />
        </>
      )}
    </Container>
  );
}
