import { Trans, useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CalendarIcon, LogOutIcon } from "lucide-react";

import { BadgeRole } from "@/shared/components/badge/badge-role";
import { Badge } from "@/shared/ui/badge";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerGroup,
  DropDrawerItem,
  DropDrawerTrigger,
} from "@/shared/ui/dropdrawer";

import { useAuth } from "@/features/auth/auth-store";
import { useLogout } from "@/features/auth/hooks/auth.queries";
import { UserAvatar } from "@/features/user/components/user-avatar";
import { userQueries } from "@/features/user/hooks/user.queries";

interface TopbarProfileProps {
  userId: string;
}

export function TopbarProfile({ userId }: TopbarProfileProps) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const authUser = useAuth((s) => s.user);
  const { data: profileUser } = useQuery(userQueries.details(userId));
  const user = profileUser ?? authUser;
  const logoutMutation = useLogout(() => {
    navigate({ to: "/login" });
  });

  if (!user) return null;

  const displayName = user.pseudo || user.username;

  return (
    <DropDrawer>
      <DropDrawerTrigger asChild>
        <button
          type="button"
          className="p-0! shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t`Open profile`}
        >
          <UserAvatar user={user} size="xs" />
        </button>
      </DropDrawerTrigger>
      <DropDrawerContent>
        <div className="flex flex-col items-center gap-3 px-4 pb-2 pt-2">
          <UserAvatar user={user} size="md" editable />
          <div className="flex w-full flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2">
              <span className="truncate text-lg font-semibold">{displayName}</span>
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              {profileUser ? <BadgeRole role={profileUser.role} /> : null}
              {profileUser?.createdAt ? (
                <Badge variant="outline">
                  <CalendarIcon className="size-3.5" />
                  {new Date(profileUser.createdAt).toLocaleDateString()}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <DropDrawerGroup>
          <DropDrawerItem
            onSelect={() => logoutMutation.mutate()}
            icon={<LogOutIcon className="size-4" />}
            className="text-destructive focus:text-destructive"
          >
            <Trans>Sign out</Trans>
          </DropDrawerItem>
        </DropDrawerGroup>
      </DropDrawerContent>
    </DropDrawer>
  );
}
