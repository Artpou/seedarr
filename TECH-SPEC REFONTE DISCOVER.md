TECH-SPEC REFONTE DISCOVER

Avant tout lis @AGENTS.md et @README.md pour comprendre le contexte. Je vais faire une refont des pages.

@media-discover.tsx
page : /tv /movie
- Supprime "search movies..." ainsi que toute la logique de @media-tabs-sort et @media-sheet-filter. On va avoir une toute nouvelle discover page. 
- utilise des @media-carousel.tsx, avec "New", "Top Rated" par défaut charger. Ensuite tu charge dynamiquement les catégories une par une en fonction de l'endroit ou l'utilisateur se trouve sur la page, chacune dans des carousels. Je crois que tu peux utiliser les sentinels, à voir.
- chaque carousel possède un voir plus. il faut que tu prévois un param ?genre (pour les catégories) et ?type ("new", "top rated") sur /movies et /tv. si les deux sont présents ?type prend le dessus. Dans ce cas on va afficher une liste (un peu comme l'existant) au lieu de tout les carousel, avec une media-tab-view et les filtres à droite. dans les filtres (@media-sheet-filter) on peut retirer la partie catégorie.
- dans @app-topbar, quand on clique sur la recherche (ou qu'on recherche directement en mode mobile), tu vas renvoyer vers la page search. 
EN MODE DESKTOP : cahnge le bouton tu mets plutot un vrai button secondary avec label "search movie" ou "search tv" en fonction de la page.tu peux enlever le bouton module


@search-view
page : /search
- Tu dégage tout le dessous avec popular movies/popular tv (géré maintennt dans les autres routes).
- tu enlèves le mode "all". par défaut en movies si ?type pas défini. 
- tu affiche à la place une media-grid avec tout les films (pas de filtre on peut prendre new par exemple). la media-grid est filtré en fonction de la recherche
- MOBILE UNIQUEMENT : il faut une nouvelle topbar-search, avec <- pour revenir à la place du logo seedarr (comme on a) et l'affichage de la query dans la recherche.

Avec ces changements on va surement pouvoir simplifier le back et le front. vérifie. 

utilise uniquement "pnpm lint:fix" et "pnpm check" à la fin. pnpm check va te permettre de voir les problèmes et les composants plus utilisé.a