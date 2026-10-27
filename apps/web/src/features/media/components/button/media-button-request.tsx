import { Trans, useLingui } from "@lingui/react/macro";
import type { MediaInput } from "@seedarr/contracts";
import { BellPlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/shared/ui/button";
import { TvFocusable } from "@/shared/ui/tv/tv-focusable";

import { useCreateRequest } from "@/features/request/hooks/request.queries";
import { tvRequestFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";

interface MediaButtonRequestProps extends Omit<ButtonProps, "onClick"> {
  media: MediaInput;
}

export function MediaButtonRequest({ media, size, className, ...props }: MediaButtonRequestProps) {
  const { t } = useLingui();
  const tvMode = useTvMode();
  const { mutate, isPending } = useCreateRequest();

  const request = () => mutate(media);

  const button = (
    <Button size={size} className={cn(className)} onClick={request} disabled={isPending} icon={BellPlusIcon} {...props}>
      <Trans>Request</Trans>
    </Button>
  );

  if (!tvMode) return button;

  return (
    <TvFocusable
      focusRoot
      tv={{
        focusKey: tvRequestFocusKey(media.id, media.type),
        onPress: request,
        accessibilityLabel: t`Request`,
        enabled: !isPending,
      }}
    >
      {button}
    </TvFocusable>
  );
}
