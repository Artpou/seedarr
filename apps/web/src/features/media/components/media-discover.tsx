import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";
import type { InfiniteData, UseInfiniteQueryOptions } from "@tanstack/react-query";
import { useInfiniteQuery, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import { ClapperboardIcon, LanguagesIcon, LibraryIcon, SparklesIcon, TrophyIcon } from "lucide-react";

import { PlaceholderEmpty } from "@/shared/components/seedarr-placeholder";
import { InfiniteSentinel } from "@/shared/components/sentinel/infinite-sentinel";
import { tmdbOriginalLanguageLabel } from "@/shared/helpers/tmdb-original-language.helper";
import { flattenInfiniteResults } from "@/shared/hooks/use-infinite-list";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";
import { carouselMediaFocusKey, carouselSectionKey } from "@/shared/ui/tv/tv-carousel-context";

import { useRole } from "@/features/auth/hooks/use-role";
import { MediaCarousel } from "@/features/media/components/carousel/media-carousel";
import { MediaCarouselWatching } from "@/features/media/components/carousel/media-carousel-watching";
import { MediaGrid } from "@/features/media/components/media-grid";
import { MediaTable } from "@/features/media/components/media-table";
import { MediaTabsViewMode } from "@/features/media/components/tabs/media-tabs-view-mode";
import { discoverScopedTitleIcon } from "@/features/media/helpers/discover-scoped-display.helper";
import {
  isScopedDiscoverSearch,
  languageDiscoverQueryOptions,
  type MovieDiscoverSearch,
  newDiscoverQueryOptions,
  popularDiscoverQueryOptions,
  type TvDiscoverSearch,
} from "@/features/media/helpers/discover-search.helper";
import { sortDownloadedLibraryCarousel } from "@/features/media/helpers/media.helper";
import { genreQueries } from "@/features/media/hooks/genre.queries";
import { mediaQueries } from "@/features/media/hooks/media.queries";
import { movieQueries } from "@/features/movies/hooks/movie.queries";
import { RequestCarousel } from "@/features/request/components/request-carousel";
import { requestQueries } from "@/features/request/hooks/request.queries";
import { useEffectiveViewMode } from "@/features/settings/hooks/use-effective-view-mode";
import { useUserPreferences } from "@/features/settings/stores/user-preference-store";
import { tvQueries } from "@/features/tv/hooks/tv.queries";
import { TvBrowseLayout } from "@/features/tv-mode/tv-browse-layout";
import { tvCarouselRowFirstFocusKey } from "@/features/tv-mode/tv-discover-carousel-up.helper";
import { tvMediaFocusKey, tvNavPrimaryFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { useTvInitialFocus } from "@/features/tv-mode/use-tv-initial-focus";
import { pickFirstMedia, useTvPreviewMedia } from "@/features/tv-mode/use-tv-preview-media";

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

function DiscoverAdminPendingRequests({ type, tvBarUpFocusKey }: { type: "movie" | "tv"; tvBarUpFocusKey?: string }) {
  const { data: pendingRequests } = useSuspenseQuery(requestQueries.byType(type));
  if (!pendingRequests.length) return null;
  return (
    <RequestCarousel
      requests={pendingRequests}
      seeMoreTo="/requests"
      seeMoreSearch={{ type, status: "pending" }}
      tvBarUpFocusKey={tvBarUpFocusKey}
    />
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
  onTvItemFocused,
  tvSelectedMedia,
  tvBarUpFocusKey,
}: {
  type: "movie" | "tv";
  genre: { id: number; name: string };
  locale: string;
  onTvItemFocused?: (media: Media) => void;
  tvSelectedMedia?: Media | null;
  tvBarUpFocusKey?: string;
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
      onTvItemFocused={onTvItemFocused}
      tvSelectedMedia={tvSelectedMedia}
      tvBarUpFocusKey={tvBarUpFocusKey}
    />
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
  const { i18n, t } = useLingui();
  const isMobile = useIsMobile();
  const discoverCarouselLanguage = useUserPreferences((s) => s.discoverCarouselLanguage);
  const tvMode = useTvMode();
  const { isAdmin } = useRole();
  const viewMode = useEffectiveViewMode(type);
  const isScoped = isScopedDiscoverSearch(search);

  const { data: genres = [] } = useQuery(genreQueries.list(type, locale));
  const discoverQuery = useInfiniteQuery(queryOptions as DiscoverQueryOptions);
  const popularQuery = useInfiniteQuery(
    type === "movie"
      ? movieQueries.discover(popularDiscoverQueryOptions("movie"), locale)
      : tvQueries.discover(popularDiscoverQueryOptions("tv"), locale),
  );
  const newMovieOptions = type === "movie" ? newDiscoverQueryOptions("movie") : null;
  const languageQuery = useInfiniteQuery({
    ...(type === "movie"
      ? movieQueries.discover(languageDiscoverQueryOptions(discoverCarouselLanguage ?? "en"), locale)
      : tvQueries.discover(languageDiscoverQueryOptions(discoverCarouselLanguage ?? "en"), locale)),
    enabled: popularQuery.isFetched && Boolean(discoverCarouselLanguage),
  });
  const newQuery = useInfiniteQuery({
    ...movieQueries.discover(newMovieOptions ?? { sort_by: "popularity.desc" }, locale),
    enabled:
      popularQuery.isFetched && (!discoverCarouselLanguage || languageQuery.isFetched) && newMovieOptions !== null,
  });
  const topRatedQuery = useInfiniteQuery({
    ...(type === "movie"
      ? movieQueries.discover({ sort_by: "vote_average.desc" }, locale)
      : tvQueries.discover({ sort_by: "vote_average.desc" }, locale)),
    enabled:
      type === "movie"
        ? newQuery.isFetched
        : popularQuery.isFetched && (!discoverCarouselLanguage || languageQuery.isFetched),
  });

  const [genreRevealCount, setGenreRevealCount] = useState(0);

  const genreNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const genre of genres) map.set(genre.id.toString(), genre.name);
    return map;
  }, [genres]);

  const sectionTitle = useMemo(() => {
    if (search.type === "popular") {
      return type === "movie" ? <Trans>Popular Movies</Trans> : <Trans>Popular TV Shows</Trans>;
    }
    if (search.type === "new") {
      return <Trans>New Movies</Trans>;
    }
    if (search.lang) {
      const name = tmdbOriginalLanguageLabel(search.lang, i18n.locale);
      return type === "movie" ? t`Films ${name}` : t`TV Shows ${name}`;
    }
    if (search.type === "top_rated" || search.type === "top-rated") {
      return type === "movie" ? <Trans>Top Rated Movies</Trans> : <Trans>Top Rated TV Shows</Trans>;
    }
    if (search.genre) {
      const name = genreNameById.get(search.genre);
      if (name) return name;
    }
    return type === "movie" ? <Trans>Movies</Trans> : <Trans>TV Shows</Trans>;
  }, [genreNameById, i18n.locale, search, t, type]);

  const results = flattenInfiniteResults(discoverQuery);

  const revealNextGenre = useCallback(() => {
    setGenreRevealCount((count) => Math.min(count + 1, genres.length));
  }, [genres.length]);

  const popularItems = popularQuery.data?.pages[0]?.results ?? [];
  const newItems = newQuery.data?.pages[0]?.results ?? [];
  const topRatedItems = topRatedQuery.data?.pages[0]?.results ?? [];
  const languageItems = languageQuery.data?.pages[0]?.results ?? [];
  const languageLabel = discoverCarouselLanguage
    ? tmdbOriginalLanguageLabel(discoverCarouselLanguage, i18n.locale)
    : "";
  const routePath = type === "movie" ? "/movies" : "/tv";
  const canLoadGenres = topRatedQuery.isFetched;

  const downloadedQuery = useQuery({
    ...mediaQueries.library(type),
    enabled: tvMode && !isScoped,
  });
  const downloadedItems = useMemo(
    () => (downloadedQuery.data ? sortDownloadedLibraryCarousel(downloadedQuery.data) : []),
    [downloadedQuery.data],
  );
  const initialTvFocusKey = useMemo(() => {
    if (!tvMode) return undefined;
    if (isScoped && results[0]) return tvMediaFocusKey(results[0]);
    const downloaded = downloadedItems[0];
    if (downloaded) return carouselMediaFocusKey(carouselSectionKey("/downloads"), downloaded);
    if (popularItems[0]) return carouselMediaFocusKey(carouselSectionKey(routePath, "popular"), popularItems[0]);
    if (languageItems[0]) return carouselMediaFocusKey(carouselSectionKey(routePath, "lang"), languageItems[0]);
    if (newItems[0]) return carouselMediaFocusKey(carouselSectionKey(routePath, "new"), newItems[0]);
    if (topRatedItems[0]) return carouselMediaFocusKey(carouselSectionKey(routePath, "top_rated"), topRatedItems[0]);
    return routePath === "/movies" ? "NAV-/movies" : "NAV-/tv";
  }, [tvMode, isScoped, results, downloadedItems, popularItems, languageItems, topRatedItems, newItems, routePath]);
  useTvInitialFocus(initialTvFocusKey);

  const previewPool = useMemo(() => {
    if (isScoped) return results;
    return [...downloadedItems, ...popularItems, ...languageItems, ...newItems, ...topRatedItems];
  }, [isScoped, results, downloadedItems, popularItems, languageItems, newItems, topRatedItems]);

  const defaultPreviewMedia = useMemo(
    () =>
      isScoped
        ? pickFirstMedia([results[0]])
        : pickFirstMedia([downloadedItems[0], popularItems[0], languageItems[0], newItems[0], topRatedItems[0]]),
    [isScoped, results, downloadedItems, popularItems, languageItems, newItems, topRatedItems],
  );

  const { previewMedia, setPreviewMedia } = useTvPreviewMedia(defaultPreviewMedia, previewPool);

  const tvCarouselProps = tvMode ? { onTvItemFocused: setPreviewMedia, tvSelectedMedia: previewMedia } : {};

  const tvRowUpFocus = useMemo(() => {
    const navUp = tvNavPrimaryFocusKey(type);
    const downloaded = tvCarouselRowFirstFocusKey("/downloads", undefined, downloadedItems[0]);
    const popular = tvCarouselRowFirstFocusKey(routePath, { type: "popular" }, popularItems[0]);
    const language = discoverCarouselLanguage
      ? tvCarouselRowFirstFocusKey(routePath, { lang: discoverCarouselLanguage }, languageItems[0])
      : undefined;
    const newly = tvCarouselRowFirstFocusKey(routePath, { type: "new" }, newItems[0]);
    const topRated = tvCarouselRowFirstFocusKey(routePath, { type: "top_rated" }, topRatedItems[0]);

    return {
      watching: navUp,
      popular: downloaded ?? navUp,
      language: popular ?? downloaded ?? navUp,
      new: language ?? popular ?? downloaded ?? navUp,
      topRated: newly ?? language ?? popular ?? downloaded ?? navUp,
      genre: topRated ?? newly ?? language ?? popular ?? downloaded ?? navUp,
      pendingRequests: downloaded ?? navUp,
    };
  }, [
    type,
    routePath,
    downloadedItems,
    popularItems,
    languageItems,
    newItems,
    topRatedItems,
    discoverCarouselLanguage,
  ]);

  if (tvMode && !isScoped) {
    return (
      <TvBrowseLayout media={previewMedia}>
        <Container className="space-y-8 px-4 py-4 md:px-6">
          <MediaCarouselWatching type={type} tvBarUpFocusKey={tvRowUpFocus.watching} {...tvCarouselProps} />
          {isAdmin && <DiscoverAdminPendingRequests type={type} tvBarUpFocusKey={tvRowUpFocus.pendingRequests} />}
          <div className="space-y-8">
            {popularQuery.isFetched && popularItems.length > 0 && (
              <MediaCarousel
                title={<Trans>Popular</Trans>}
                titleIcon={SparklesIcon}
                data={popularItems}
                seeMoreTo={routePath}
                seeMoreSearch={{ type: "popular" }}
                tvBarUpFocusKey={tvRowUpFocus.popular}
                {...tvCarouselProps}
              />
            )}
            {languageQuery.isFetched && discoverCarouselLanguage && languageItems.length > 0 && (
              <MediaCarousel
                title={type === "movie" ? t`Films ${languageLabel}` : t`TV Shows ${languageLabel}`}
                titleIcon={LanguagesIcon}
                data={languageItems}
                seeMoreTo={routePath}
                seeMoreSearch={{ lang: discoverCarouselLanguage }}
                tvBarUpFocusKey={tvRowUpFocus.language}
                {...tvCarouselProps}
              />
            )}
            {newQuery.isFetched && newItems.length > 0 && (
              <MediaCarousel
                title={<Trans>New</Trans>}
                titleIcon={ClapperboardIcon}
                data={newItems}
                seeMoreTo={routePath}
                seeMoreSearch={{ type: "new" }}
                tvBarUpFocusKey={tvRowUpFocus.new}
                {...tvCarouselProps}
              />
            )}
            {topRatedQuery.isFetched && topRatedItems.length > 0 && (
              <MediaCarousel
                title={<Trans>Top Rated</Trans>}
                titleIcon={TrophyIcon}
                data={topRatedItems}
                seeMoreTo={routePath}
                seeMoreSearch={{ type: "top_rated" }}
                tvBarUpFocusKey={tvRowUpFocus.topRated}
                {...tvCarouselProps}
              />
            )}
            {canLoadGenres &&
              genres
                .slice(0, genreRevealCount)
                .map((genre) => (
                  <MediaCategoryCarousel
                    key={genre.id}
                    type={type}
                    genre={genre}
                    locale={locale}
                    tvBarUpFocusKey={tvRowUpFocus.genre}
                    {...tvCarouselProps}
                  />
                ))}
            {canLoadGenres && genreRevealCount < genres.length && (
              <CategorySentinel key={genreRevealCount} onReveal={revealNextGenre} />
            )}
          </div>
        </Container>
      </TvBrowseLayout>
    );
  }

  if (tvMode && isScoped) {
    return (
      <TvBrowseLayout media={previewMedia}>
        <Container className="py-4 sm:space-y-3">
          {discoverQuery.isPending ? (
            <MediaGrid query={discoverQuery} {...tvCarouselProps} />
          ) : results.length === 0 ? (
            <PlaceholderEmpty title={emptyTitle} subtitle={emptySubtitle} />
          ) : (
            <MediaGrid
              items={results}
              query={discoverQuery}
              tvBarUpFocusKey={tvNavPrimaryFocusKey(type)}
              {...tvCarouselProps}
            />
          )}
        </Container>
      </TvBrowseLayout>
    );
  }

  if (!isScoped) {
    return (
      <Container className="space-y-8">
        <MediaCarouselWatching type={type} />
        {isAdmin && (
          <DiscoverAdminPendingRequests
            type={type}
            tvBarUpFocusKey={downloadedItems.length === 0 ? tvNavPrimaryFocusKey(type) : undefined}
          />
        )}
        <div className="space-y-8">
          {popularQuery.isFetched && popularItems.length > 0 && (
            <MediaCarousel
              title={<Trans>Popular</Trans>}
              titleIcon={SparklesIcon}
              data={popularItems}
              seeMoreTo={routePath}
              seeMoreSearch={{ type: "popular" }}
              tvBarUpFocusKey={downloadedItems.length === 0 ? tvNavPrimaryFocusKey(type) : undefined}
            />
          )}
          {languageQuery.isFetched && discoverCarouselLanguage && languageItems.length > 0 && (
            <MediaCarousel
              title={type === "movie" ? t`Films ${languageLabel}` : t`TV Shows ${languageLabel}`}
              titleIcon={LanguagesIcon}
              data={languageItems}
              seeMoreTo={routePath}
              seeMoreSearch={{ lang: discoverCarouselLanguage }}
            />
          )}
          {newQuery.isFetched && newItems.length > 0 && (
            <MediaCarousel
              title={<Trans>New</Trans>}
              titleIcon={ClapperboardIcon}
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
        <MediaGrid items={results} query={discoverQuery} />
      ) : (
        <>
          <MediaTable media={results} query={discoverQuery} />
          <InfiniteSentinel query={discoverQuery} />
        </>
      )}
    </Container>
  );
}
