import { useState } from "react";

import { useLingui } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";
import { StarIcon } from "lucide-react";

import { Button, type ButtonProps } from "@/shared/ui/button";

import { MediaReview } from "@/features/media/components/media-review";

interface MediaButtonReviewProps extends Omit<ButtonProps, "onClick"> {
  media: Media;
}

/** Opens the review modal (rating + comment + date). */
export function MediaButtonReview({ media, ...props }: MediaButtonReviewProps) {
  const { t } = useLingui();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        icon={StarIcon}
        aria-label={t`Review`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        {...props}
      />
      <MediaReview media={media} open={open} onOpenChange={setOpen} />
    </>
  );
}
