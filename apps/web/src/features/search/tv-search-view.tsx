import { useEffect, useMemo, useState } from "react";

import { Trans } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useDebounce } from "@uidotdev/usehooks";
import { FilmIcon, LayoutGridIcon, SearchIcon, TvIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ResponsiveTabs } from "@/shared/components/responsive-tabs";
import { InfiniteSentinel } from "@/shared/components/sentinel/infinite-sentinel";
import { SEARCH_INPUT_DEBOUNCE_MS } from "@/shared/constants/search";
import { flattenInfiniteResults, type InfiniteResultsQuery } from "@/shared/hooks/use-infinite-list";
import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";

import { MediaGrid } from "@/features/media/components/media-grid";
import { MediaGridSkeleton } from "@/features/media/components/media-grid-skeletons";
import { movieQueries } from "@/features/movies/hooks/movie.queries";
import { getTvSearchKeyboardInitialFocusKey } from "@/features/search/tv-search-keyboard-layout";
import { tvQueries } from "@/features/tv/hooks/tv.queries";
import { tvSearchFilterFocusPrefix } from "@/features/tv-mode/tv-focus-keys";
import { useTvInitialFocus } from "@/features/tv-mode/use-tv-initial-focus";
import {
  type SearchRouteSearch,
  shouldLoadSearchResults,
  validateSearchRouteSearch,
} from "@/routes/helpers/search-route.helper";
import { TvSearchFocusPanel } from "./tv-search-focus-panel";
import { TvSearchVirtualKeyboard } from "./tv-search-virtual-keyboard";

type TvSearchResultFilter = "all" | "movie" | "tv";

type TvSearchViewProps = {
  search: SearchRouteSearch;
};

function mergeMediaResults(movieItems: Media[], tvItems: Media[]): Media[] {
  const seen = new Set<string>();
  const merged: Media[] = [];
  for (const item of [...movieItems, ...tvItems]) {
    const key = `${item.type}-${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

function combinedInfiniteQuery(
  movieQuery: InfiniteResultsQuery<Media>,
  tvQuery: InfiniteResultsQuery<Media>,
): InfiniteResultsQuery<Media> {
  return {
    data: movieQuery.data ?? tvQuery.data,
    isPending: movieQuery.isPending || tvQuery.isPending,
    hasNextPage: Boolean(movieQuery.hasNextPage || tvQuery.hasNextPage),
    isFetchingNextPage: Boolean(movieQuery.isFetchingNextPage || tvQuery.isFetchingNextPage),
    fetchNextPage: async () => {
      await Promise.all([
        movieQuery.hasNextPage ? movieQuery.fetchNextPage() : Promise.resolve(),
        tvQuery.hasNextPage ? tvQuery.fetchNextPage() : Promise.resolve(),
      ]);
    },
  };
}

export function TvSearchView({ search }: TvSearchViewProps) {
  const navigate = useNavigate();
  const locale = useTmdbLocale();
  const urlQ = search.q ?? "";

  const [query, setQuery] = useState(urlQ);
  const [resultFilter, setResultFilter] = useState<TvSearchResultFilter>("all");
  const debouncedQuery = useDebounce(query, SEARCH_INPUT_DEBOUNCE_MS);

  useTvInitialFocus(getTvSearchKeyboardInitialFocusKey());

  useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (debouncedQuery === urlQ) return;
    void navigate({
      to: "/search",
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        ...validateSearchRouteSearch(prev as Record<string, unknown>),
        q: debouncedQuery,
        mode: "tv",
      }),
      replace: true,
      resetScroll: false,
    });
  }, [debouncedQuery, navigate, urlQ]);

  const isSearching = shouldLoadSearchResults(debouncedQuery);

  const movieSearchQuery = useInfiniteQuery({
    ...movieQueries.search(debouncedQuery, locale),
    enabled: isSearching && (resultFilter === "all" || resultFilter === "movie"),
    placeholderData: keepPreviousData,
  });
  const tvSearchQuery = useInfiniteQuery({
    ...tvQueries.search(debouncedQuery, locale),
    enabled: isSearching && (resultFilter === "all" || resultFilter === "tv"),
    placeholderData: keepPreviousData,
  });

  const movieResults = flattenInfiniteResults(movieSearchQuery);
  const tvResults = flattenInfiniteResults(tvSearchQuery);

  const results = useMemo(() => {
    if (resultFilter === "movie") return movieResults;
    if (resultFilter === "tv") return tvResults;
    return mergeMediaResults(movieResults, tvResults);
  }, [movieResults, resultFilter, tvResults]);

  const activeQuery = useMemo((): InfiniteResultsQuery<Media> | undefined => {
    if (resultFilter === "movie") return movieSearchQuery;
    if (resultFilter === "tv") return tvSearchQuery;
    return combinedInfiniteQuery(movieSearchQuery, tvSearchQuery);
  }, [movieSearchQuery, resultFilter, tvSearchQuery]);

  const filterTabs = useMemo(
    () => [
      { value: "all" as const, label: <Trans>All</Trans>, icon: LayoutGridIcon },
      { value: "movie" as const, label: <Trans>Movies</Trans>, icon: FilmIcon },
      { value: "tv" as const, label: <Trans>TV Shows</Trans>, icon: TvIcon },
    ],
    [],
  );

  const appendChar = (char: string) => {
    setQuery((prev) => `${prev}${char}`);
  };

  const isResultsError =
    resultFilter === "movie"
      ? movieSearchQuery.isError
      : resultFilter === "tv"
        ? tvSearchQuery.isError
        : movieSearchQuery.isError && tvSearchQuery.isError;

  const resultsPanel = useMemo(() => {
    if (!isSearching) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
          <SearchIcon className="mb-4 size-16 text-muted-foreground/25" />
          <p className="text-lg text-muted-foreground">
            <Trans>Use the keyboard to search movies and TV shows</Trans>
          </p>
        </div>
      );
    }

    if (activeQuery?.isPending && results.length === 0) {
      return <MediaGridSkeleton />;
    }

    if (isResultsError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
          <h2 className="mb-2 text-2xl font-bold">
            <Trans>Search failed</Trans>
          </h2>
          <p className="text-muted-foreground">
            <Trans>Could not reach the server. Try again in a moment.</Trans>
          </p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
          <h2 className="mb-2 text-2xl font-bold">
            <Trans>No results found for "{debouncedQuery}"</Trans>
          </h2>
          <p className="text-muted-foreground">
            <Trans>Try a different search term</Trans>
          </p>
        </div>
      );
    }

    return (
      <>
        <MediaGrid items={results} query={activeQuery} showType={resultFilter === "all"} />
        {activeQuery ? <InfiniteSentinel query={activeQuery} /> : null}
      </>
    );
  }, [activeQuery, debouncedQuery, isResultsError, isSearching, resultFilter, results, results.length]);

  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-background">
      <aside className="flex w-1/3 min-w-[17rem] max-w-md shrink-0 flex-col gap-4 border-r border-border p-4">
        <div className="rounded-lg border border-border bg-input/40 px-4 py-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Trans>Search</Trans>
          </p>
          <p className={cn("min-h-8 break-all text-lg font-medium", !query && "text-muted-foreground")}>
            {query || <Trans>Start typing…</Trans>}
          </p>
        </div>

        <TvSearchVirtualKeyboard
          className="overflow-y-auto overscroll-contain"
          onCharacter={appendChar}
          onBackspace={() => setQuery((prev) => prev.slice(0, -1))}
          onSpace={() => appendChar(" ")}
          onClear={() => setQuery("")}
        />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden p-4">
        <ResponsiveTabs
          className="mb-4 shrink-0"
          value={resultFilter}
          onValueChange={(value) => setResultFilter(value as TvSearchResultFilter)}
          options={filterTabs}
          tvFocusKeyPrefix={tvSearchFilterFocusPrefix}
        />
        <TvSearchFocusPanel className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {resultsPanel}
        </TvSearchFocusPanel>
      </section>
    </div>
  );
}
