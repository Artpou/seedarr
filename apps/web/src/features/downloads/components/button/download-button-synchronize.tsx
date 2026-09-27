import { useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import type { Media } from "@seedarr/sdk";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { useIsMobile } from "@/shared/hooks/use-mobile";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

import { useRole } from "@/features/auth/hooks/use-role";
import { MediaSearchPicker } from "@/features/media/components/modal/media-search-modal";
import { useModule } from "@/features/module/hooks/use-module";
import { useManualSync, useRemoteSync } from "@/features/settings/hooks/remote-sync.queries";

interface SyncError {
  name: string;
  path: string;
  type: "movie" | "tv";
}

interface DownloadButtonSynchronizeProps {
  topbar?: boolean;
}

export function DownloadButtonSynchronize({ topbar = false }: DownloadButtonSynchronizeProps) {
  const isMobile = useIsMobile();
  const { t } = useLingui();
  const { isAdmin } = useRole();
  const [unmatchedFiles, setUnmatchedFiles] = useState<SyncError[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  const { isAvailable: tmdbAvailable } = useModule("tmdb");
  const manualSync = useManualSync();
  const syncMutation = useRemoteSync((files) => {
    setUnmatchedFiles(files);
    setCurrentIndex(0);
    setSelectedMedia(null);
    setWizardOpen(true);
  });

  const currentFile = unmatchedFiles[currentIndex];
  const isLast = currentIndex >= unmatchedFiles.length - 1;
  const progress = unmatchedFiles.length > 0 ? `${currentIndex + 1} / ${unmatchedFiles.length}` : undefined;

  if (!isAdmin) return null;

  const handleSync = () => {
    if (!tmdbAvailable) {
      toast.error(t`TMDB API key is required for synchronization. Configure it in Settings > Modules.`);
      return;
    }
    setConfirmOpen(true);
  };

  const closeWizard = () => {
    setCurrentIndex(0);
    setSelectedMedia(null);
    setWizardOpen(false);
  };

  const goToNext = () => {
    setSelectedMedia(null);
    if (isLast) {
      closeWizard();
      toast.success(t`Manual sync complete`);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleManualSave = () => {
    if (!selectedMedia || !currentFile) return;
    manualSync.mutate(
      { remotePath: currentFile.path, mediaId: selectedMedia.id, type: currentFile.type },
      { onSuccess: goToNext },
    );
  };

  return (
    <>
      <Button
        variant={topbar ? "ghost" : "secondary"}
        size={topbar || isMobile ? "icon-lg" : "lg"}
        onClick={handleSync}
        loading={syncMutation.isPending}
        icon={RefreshCwIcon}
      >
        {!isMobile && <Trans>Synchronize</Trans>}
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans>Synchronize library?</Trans>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans>
                Seedarr will scan your library folders (remote storage, HARDLINK paths, or downloads), match titles with
                TMDB, and organize files into Title (year) folders. Existing entries are skipped.
              </Trans>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Trans>Cancel</Trans>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                syncMutation.mutate();
              }}
              disabled={syncMutation.isPending}
            >
              <Trans>Synchronize</Trans>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {currentFile && (
        <Dialog open={wizardOpen} onOpenChange={(next) => !next && closeWizard()}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                <Trans>Manual sync</Trans>
                {progress && <span className="text-sm text-muted-foreground font-normal ml-2">({progress})</span>}
              </DialogTitle>
            </DialogHeader>

            <MediaSearchPicker
              key={currentIndex}
              mediaType={currentFile.type}
              selectedMedia={selectedMedia}
              onSelect={setSelectedMedia}
              fileName={currentFile.name}
            />

            <DialogFooter>
              <Button variant="secondary" onClick={closeWizard}>
                <Trans>Cancel</Trans>
              </Button>
              <Button variant="secondary" onClick={goToNext}>
                <Trans>Skip</Trans>
              </Button>
              <Button onClick={handleManualSave} disabled={!selectedMedia || manualSync.isPending}>
                <Trans>Save</Trans>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
