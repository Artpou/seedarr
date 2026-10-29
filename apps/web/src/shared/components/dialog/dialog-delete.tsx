import { Trans } from "@lingui/react/macro";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { useTvBackIntercept } from "@/features/tv-mode/tv-back-intercept";
import { useTvMode } from "@/features/tv-mode/tv-mode-store";
import { useTvInitialFocus } from "@/features/tv-mode/use-tv-initial-focus";

interface DialogDeleteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  validate: () => void;
  title: React.ReactNode;
  description: React.ReactNode;
  disabled?: boolean;
  extra?: React.ReactNode;
  tvCancelFocusKey?: string;
  tvConfirmFocusKey?: string;
}

export function DialogDelete({
  open,
  setOpen,
  validate,
  title,
  description,
  disabled,
  extra,
  tvCancelFocusKey,
  tvConfirmFocusKey,
}: DialogDeleteProps) {
  const tvMode = useTvMode();
  const tvDialog = tvMode && tvCancelFocusKey && tvConfirmFocusKey;

  useTvBackIntercept(Boolean(tvDialog && open), () => setOpen(false));
  useTvInitialFocus(tvDialog && open ? tvCancelFocusKey : undefined);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {extra}
        <AlertDialogFooter>
          {tvDialog ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={disabled}
                tv={{
                  focusKey: tvCancelFocusKey,
                  onPress: () => setOpen(false),
                  accessibilityLabel: "Cancel",
                }}
              >
                <Trans>Cancel</Trans>
              </Button>
              <Button
                type="button"
                disabled={disabled}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                tv={{
                  focusKey: tvConfirmFocusKey,
                  onPress: validate,
                  accessibilityLabel: "Delete",
                }}
              >
                <Trans>Delete</Trans>
              </Button>
            </>
          ) : (
            <>
              <AlertDialogCancel disabled={disabled}>
                <Trans>Cancel</Trans>
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={validate}
                disabled={disabled}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Trans>Delete</Trans>
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
