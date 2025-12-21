import type { Movie } from "@basement/api/types";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface MovieCardProps {
  movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link to="/movies/$movieId" params={{ movieId: movie.ids.imdb }}>
      <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all aspect-2/3 relative pt-0">
        <img src={movie.images.poster[0]} alt={movie.title} className="size-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-background via-background/95 to-background/60">
          <div className="flex items-center justify-between mb-1">
            <Badge variant="secondary" className="text-xs">
              {movie.type.toLowerCase()}
            </Badge>
            {movie.rating !== null && (
              <Badge variant="outline" className="text-xs font-semibold">
                <Star className="size-4 mr-1" />
                {movie.rating.toFixed(1)}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold">{movie.title}</h3>
          <p className="text-sm text-muted-foreground">{movie.year}</p>
        </div>
      </Card>
    </Link>
  );
}
