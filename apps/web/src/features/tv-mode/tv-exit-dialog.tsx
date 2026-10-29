import { Trans } from "@lingui/react/macro";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { exitSeedarrApplication } from "@/features/tv-mode/tv-back.helper";
import { tvExitCancelFocusKey, tvExitConfirmFocusKey } from "@/features/tv-mode/tv-focus-keys";
import { useTvInitialFocus } from "@/features/tv-mode/use-tv-initial-focus";

type TvExitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TvExitDialog({ open, onOpenChange }: TvExitDialogProps) {
  useTvInitialFocus(open ? tvExitCancelFocusKey : undefined);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans>Leave Seedarr?</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans>Do you want to exit the application?</Trans>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              type="button"
              variant="secondary"
              tv={{
                focusKey: tvExitCancelFocusKey,
                onPress: () => onOpenChange(false),
                accessibilityLabel: "Stay in Seedarr",
              }}
            >
              <Trans>Stay</Trans>
            </Button>
          </AlertDialogCancel>
          <Button
            type="button"
            tv={{
              focusKey: tvExitConfirmFocusKey,
              onPress: () => {
                onOpenChange(false);
                exitSeedarrApplication();
              },
              accessibilityLabel: "Exit Seedarr",
            }}
          >
            <Trans>Exit</Trans>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
