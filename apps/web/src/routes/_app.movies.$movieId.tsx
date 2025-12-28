import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { type MovieDetails as TMDBMovieDetails } from "tmdb-ts";
import { Movie } from "@/components/movies/movie";
import { MovieDetailsSkeleton } from "@/components/movies/movie-skeleton";
import { TorrentTable } from "@/components/torrent/torrent-table";

export const Route = createFileRoute("/_app/movies/$movieId")({
  component: MoviePage,
  pendingComponent: () => <MovieDetailsSkeleton />,
});

function MoviePage() {
  const params = Route.useParams();
  const [movieInfo, setMovieInfo] = useState<TMDBMovieDetails | null>(null);

  const handleMovieLoaded = (movie: TMDBMovieDetails) => {
    setMovieInfo((prev) => {
      if (prev?.id === movie.id) {
        return prev;
      }
      return movie;
    });
  };

  const releaseYear = movieInfo?.release_date
    ? new Date(movieInfo.release_date).getFullYear().toString()
    : undefined;

  const sanitizedMovieTitle = (() => {
    const clean = (t?: string) => t?.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    const isLatin = (t: string) => !/[^\u0020-\u02AF]/.test(t);
    const original = clean(movieInfo?.original_title);
    const title = clean(movieInfo?.title);
    return isLatin(original) ? original : isLatin(title) ? title : original || title;
  })();

  return (
    <div className="flex flex-col gap-12 pb-20 items-center justify-center">
      <Movie movieId={params.movieId} onMovieLoaded={handleMovieLoaded} />

      {movieInfo && (
        <div className="w-full container">
          <TorrentTable movieTitle={sanitizedMovieTitle} releaseYear={releaseYear} />
        </div>
      )}
    </div>
  );
}
