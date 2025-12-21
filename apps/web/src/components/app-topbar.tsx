import { MovieWithMediaType, MultiSearchResult } from "@basement/api/types";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { useDebounce } from "@uidotdev/usehooks";
import { Home, Search, Server, Settings, X } from "lucide-react";
import ms from "ms";
import { useEffect, useState } from "react";
import { MovieList } from "@/components/movies/movie-list";
import { MovieListSkeleton } from "@/components/movies/movie-list-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useTmdb } from "@/hooks/use-tmdb";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AppTopbar() {
  const { apiKey, isLogged } = useTmdb();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["movies", debouncedSearch, apiKey],
    queryFn: async () =>
      await api.movies.get({
        $query: { search: debouncedSearch },
        $headers: apiKey ? { Authorization: apiKey } : undefined,
      }),
    enabled: debouncedSearch.length > 0,
    staleTime: ms("5 minutes"),
  });

  const movies =
    response?.data?.results.filter(
      (item: MultiSearchResult): item is MovieWithMediaType => item.media_type === "movie",
    ) || [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4 md:px-6">
        {/* Left: Navigation Menu */}
        <div className="flex items-center">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Home className="mr-2 size-4" />
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/server"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === "/server" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Server className="mr-2 size-4" />
                    Server
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Center: Search Trigger */}
        <div className="flex flex-1 items-center justify-center px-4">
          <Button
            variant="outline"
            className="w-full max-w-sm justify-start text-sm text-muted-foreground font-normal relative h-9 px-3"
            onClick={() => setIsOpen(true)}
          >
            <Search className="mr-2 size-4 shrink-0" />
            <span>Search movies...</span>
            <Kbd className="absolute right-1.5 top-1.5">
              <span className="text-xs">⌘</span>K
            </Kbd>
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="p-0 max-w-2xl!" showCloseButton={false}>
              <DialogHeader className="sr-only">
                <DialogTitle>Search Movies</DialogTitle>
              </DialogHeader>
              <div className="flex items-center border-b px-4 mx-1 sticky top-0 bg-background">
                <Search className="mr-3 size-5 opacity-40" />
                <Input
                  className="h-14 border-0 text-lg focus-visible:ring-0 bg-transparent!"
                  placeholder="Type to search movies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-full"
                    onClick={() => setSearch("")}
                  >
                    <X className="size-5" />
                  </Button>
                )}
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {search.length === 0 ? (
                  <div className="p-12 text-center">
                    <Search className="mx-auto size-12 text-muted-foreground/20" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Search for movies to see results here
                    </p>
                  </div>
                ) : isLoading ? (
                  <MovieListSkeleton />
                ) : movies.length > 0 ? (
                  <MovieList
                    movies={movies}
                    onItemClick={() => {
                      setIsOpen(false);
                      setSearch("");
                    }}
                  />
                ) : (
                  <div className="p-12 text-center text-sm text-muted-foreground">
                    No results found for "{search}"
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right: Settings */}
        <div className="flex items-center gap-2">
          <Badge
            variant={isLogged ? "default" : "secondary"}
            className={cn(
              "text-xs font-medium uppercase tracking-wider",
              isLogged
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isLogged ? "Connected" : "Not Connected"}
          </Badge>
          <Button variant="ghost" size="icon" className="size-9" asChild>
            <Link to="/settings">
              <Settings className="size-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
