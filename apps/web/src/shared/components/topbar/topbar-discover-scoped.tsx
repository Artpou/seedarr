import { useMemo } from "react";

import { useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";
import { Button } from "@/shared/ui/button";

import {
  isScopedDiscoverSearch,
  pickMovieFilters,
  pickTvFilters,
  validateMovieDiscoverSearch,
  validateTvDiscoverSearch,
} from "@/features/media/helpers/discover-search.helper";
import { genreQueries } from "@/features/media/hooks/genre.queries";
import { MovieFiltersSheet } from "@/features/movies/components/movie-filters-sheet";
import { TvFiltersSheet } from "@/features/tv/components/tv-filters-sheet";

type TopbarDiscoverScopedProps = {
  mediaType: "movie" | "tv";
};

export function TopbarDiscoverScoped({ mediaType }: TopbarDiscoverScopedProps) {
  const { t } = useLingui();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = useTmdbLocale();
  const search = useMemo(() => {
    const raw = location.search as Record<string, unknown>;
    return mediaType === "movie" ? validateMovieDiscoverSearch(raw) : validateTvDiscoverSearch(raw);
  }, [location.search, mediaType]);

  const { data: genres = [] } = useQuery({
    ...genreQueries.list(mediaType, locale),
    enabled: Boolean(search.genre) && isScopedDiscoverSearch(search),
  });

  const title = useMemo(() => {
    if (search.type === "new") {
      return mediaType === "movie" ? t`New Movies` : t`New TV Shows`;
    }
    if (search.type === "top_rated" || search.type === "top-rated") {
      return mediaType === "movie" ? t`Top Rated Movies` : t`Top Rated TV Shows`;
    }
    if (search.genre) {
      const name = genres.find((g) => g.id.toString() === search.genre)?.name;
      if (name) return name;
    }
    return mediaType === "movie" ? t`Movies` : t`TV Shows`;
  }, [genres, mediaType, search.genre, search.type, t]);

  const listTo = mediaType === "movie" ? "/movies" : "/tv";

  const handleMovieFiltersChange = (value: ReturnType<typeof pickMovieFilters>) => {
    navigate({ to: "/movies", search: { ...search, ...value }, resetScroll: false });
  };

  const handleTvFiltersChange = (value: ReturnType<typeof pickTvFilters>) => {
    navigate({ to: "/tv", search: { ...search, ...value }, resetScroll: false });
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Button variant="ghost" size="icon" asChild aria-label={t`Go back`}>
        <Link to={listTo} search={{}}>
          <ArrowLeftIcon className="size-5" />
        </Link>
      </Button>
      <h2 className="min-w-0 flex-1 truncate text-lg font-medium">{title}</h2>
      {mediaType === "movie" ? (
        <MovieFiltersSheet
          value={pickMovieFilters(search)}
          onChange={handleMovieFiltersChange}
          triggerVariant="ghost"
        />
      ) : (
        <TvFiltersSheet value={pickTvFilters(search)} onChange={handleTvFiltersChange} triggerVariant="ghost" />
      )}
    </div>
  );
}
