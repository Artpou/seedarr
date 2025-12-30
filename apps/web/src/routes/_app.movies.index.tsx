import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SortOption } from "tmdb-ts";

import { Container } from "@/shared/ui/container";

import { MediaCategoryCarousel } from "@/features/media/components/media-category-carousel";
import { MediaGrid } from "@/features/media/components/media-grid";
import { MediaListDropdown } from "@/features/media/components/media-list-dropdown";
import { useMovieDiscover } from "@/features/movies/hooks/use-movie";

export interface MovieSearchParams {
  sort_by?: SortOption;
  with_genres?: string;
}

export const Route = createFileRoute("/_app/movies/")({
  component: MoviesPage,
  validateSearch: (search: MovieSearchParams) => {
    return {
      sort_by: search.sort_by ?? "popularity.desc",
      with_genres: search.with_genres,
    };
  },
});

function MoviesPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: movies = [], isLoading } = useMovieDiscover({
    sort_by: search.sort_by,
    with_genres: search.with_genres,
  });

  const handleSearchChange = (updates: Partial<MovieSearchParams>) => {
    navigate({
      to: "/movies",
      search: {
        ...search,
        ...updates,
      },
    });
  };

  return (
    <Container>
      <MediaCategoryCarousel type="movie" onValueChange={handleSearchChange} />

      <div className="space-y-4">
        <MediaListDropdown value={search.sort_by} onValueChange={handleSearchChange} />
        <MediaGrid items={movies} isLoading={isLoading} />
      </div>
    </Container>
  );
}
