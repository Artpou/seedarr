import type { MovieWithMediaType } from "@basement/api/types";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MovieListProps {
  movies: MovieWithMediaType[];
  onItemClick?: () => void;
}

export function MovieList({ movies, onItemClick }: MovieListProps) {
  if (movies.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="flex flex-col p-1 mr-2">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            to="/movies/$movieId"
            params={{
              movieId: movie.id.toString(),
            }}
            onClick={onItemClick}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent transition-all group"
          >
            <div className="size-16 rounded-md overflow-hidden shrink-0 border border-white/5 shadow-md">
              <img
                src={
                  movie.poster_path?.includes("https")
                    ? movie.poster_path
                    : `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                }
                alt={movie.title}
                className="size-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 py-1">
              <h4 className="text-lg font-bold truncate group-hover:text-primary transition-colors tracking-tight">
                {movie.title}
              </h4>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge
                  variant="secondary"
                  className="text-[10px] font-black h-5 px-1.5 leading-none uppercase bg-neutral-800 text-white border-none"
                >
                  {movie.media_type}
                </Badge>
                <span className="text-sm font-medium text-muted-foreground">
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
                </span>
              </div>
            </div>
            {movie.vote_average !== null && (
              <CircularProgress
                value={movie.vote_average * 10}
                size={42}
                strokeWidth={4}
                className="shrink-0 ml-auto"
              />
            )}
          </Link>
        ))}
      </div>
    </ScrollArea>
  );
}
