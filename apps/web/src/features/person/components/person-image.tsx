import type { TMDBPersonDetails } from "@seedarr/sdk";
import { UserIcon } from "lucide-react";

import { Img } from "@/shared/ui/image";

import { getPosterUrl } from "@/features/media/helpers/media.helper";

interface PersonImageProps {
  person: TMDBPersonDetails;
}

export function PersonImage({ person }: PersonImageProps) {
  return (
    <Img
      src={getPosterUrl(person.profile_path, "w500")}
      alt={person.name}
      className="size-full min-h-[374px] object-cover rounded-xl border border-border/60 bg-muted shadow-2xl"
      fallback={<UserIcon className="size-16 text-muted-foreground" />}
    />
  );
}
