import { useSuspenseQuery } from "@tanstack/react-query";

import { useTmdbLocale } from "@/shared/hooks/use-tmdb-locale";
import { Container } from "@/shared/ui/container";

import { PersonFilmography } from "@/features/person/components/person-filmography";
import { PersonImage } from "@/features/person/components/person-image";
import { PersonInfo } from "@/features/person/components/person-info";
import { PersonKnownFor } from "@/features/person/components/person-known-for";
import { personQueries } from "@/features/person/hooks/person.queries";

export interface PersonViewProps {
  personId: string;
}

export function PersonView({ personId }: PersonViewProps) {
  const locale = useTmdbLocale();
  const { data } = useSuspenseQuery(personQueries.details(personId, locale));
  const { person, knownFor, filmography, departments } = data;

  return (
    <Container>
      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start relative">
        <div className="lg:w-1/4 max-w-[250px] w-full">
          <PersonImage person={person} />
        </div>
        <div className="lg:w-3/4 flex flex-col gap-6">
          <PersonInfo person={person} />
        </div>
      </div>
      <PersonKnownFor knownFor={knownFor} />
      <PersonFilmography filmography={filmography} departments={departments} />
    </Container>
  );
}
