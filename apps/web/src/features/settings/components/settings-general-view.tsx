import { useEffect, useState } from "react";

import { Trans, useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { FileIcon, LogOutIcon, UserIcon } from "lucide-react";

import { SelectI18nLang } from "@/shared/components/select/select-i18n-lang";
import { SelectQuality } from "@/shared/components/select/select-quality";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { useAuth } from "@/features/auth/auth-store";
import { useLogout } from "@/features/auth/hooks/auth.queries";
import { useUserPreferences } from "@/features/settings/stores/user-preference-store";
import { PasswordChangeModal } from "@/features/user/components/password-change-modal";
import { useUpdateProfile } from "@/features/user/hooks/user.queries";

export function SettingsGeneralView() {
  const { t } = useLingui();
  const navigate = useNavigate();
  const currentUser = useAuth((s) => s.user);
  const updateProfile = useUpdateProfile();
  const logoutMutation = useLogout(() => {
    navigate({ to: "/login" });
  });
  const quality = useUserPreferences((s) => s.quality);
  const maxSize = useUserPreferences((s) => s.maxSize);
  const setQuality = useUserPreferences((s) => s.setQuality);
  const setMaxSize = useUserPreferences((s) => s.setMaxSize);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pseudo, setPseudo] = useState(currentUser?.pseudo ?? currentUser?.username ?? "");

  useEffect(() => {
    setPseudo(currentUser?.pseudo ?? currentUser?.username ?? "");
  }, [currentUser?.pseudo, currentUser?.username]);

  const handleSignOut = () => logoutMutation.mutate();

  const handleSavePseudo = () => {
    const trimmed = pseudo.trim();
    updateProfile.mutate({ pseudo: trimmed.length > 0 ? trimmed : null });
  };

  const savedPseudo = currentUser?.pseudo ?? currentUser?.username ?? "";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-md border p-4">
        <h3 className="flex items-center gap-3">
          <UserIcon className="size-4" />
          <Trans>Profile</Trans>
        </h3>

        <div className="flex flex-col gap-1 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Label>
              <Trans>Language</Trans>
            </Label>
            <p className="hidden text-sm text-muted-foreground md:block">
              <Trans>Interface language for Seedarr.</Trans>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SelectI18nLang />
          </div>
        </div>

        {currentUser && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="space-y-1">
                <Label htmlFor="profile-pseudo">
                  <Trans>Display name</Trans>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="profile-pseudo"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder={t`Display name`}
                    maxLength={64}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={updateProfile.isPending}
                    onClick={handleSavePseudo}
                    disabled={pseudo.trim() === savedPseudo}
                  >
                    <Trans>Save</Trans>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Label>
              <Trans>Password</Trans>
            </Label>
          </div>
          <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
            <Trans>Change Password</Trans>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-md border p-4">
        <h3 className="flex items-center gap-3">
          <FileIcon className="size-4" />
          <Trans>Torrents</Trans>
        </h3>
        <div className="flex flex-col gap-1 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Label>
              <Trans>Default quality</Trans>
            </Label>
            <p className="hidden text-sm text-muted-foreground md:block">
              <Trans>Minimum quality filter applied when searching torrents.</Trans>
            </p>
          </div>
          <SelectQuality value={quality} onValueChange={setQuality} triggerClassName="w-full md:w-36" />
        </div>

        <div className="flex flex-col gap-1 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Label htmlFor="max-size">
              <Trans>Max torrent size</Trans>
            </Label>
            <p className="hidden text-sm text-muted-foreground md:block">
              <Trans>Hide torrents larger than this size. Leave empty for no limit.</Trans>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="max-size"
              type="number"
              min={0}
              step={0.1}
              className="w-full md:w-24"
              placeholder="—"
              value={maxSize ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setMaxSize(value === "" ? null : Number(value));
              }}
            />
            <span className="shrink-0 text-sm text-muted-foreground">GB</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end rounded-md border p-4">
        <Button className="w-full sm:w-fit" variant="destructive" onClick={handleSignOut} icon={LogOutIcon}>
          <Trans>Sign out</Trans>
        </Button>
      </div>

      <PasswordChangeModal open={passwordOpen} onOpenChange={setPasswordOpen} />
    </section>
  );
}
