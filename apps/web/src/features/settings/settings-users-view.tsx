import { useState } from "react";

import { Trans } from "@lingui/react/macro";
import type { User } from "@seedarr/sdk";
import { useQuery } from "@tanstack/react-query";
import { UserPlusIcon } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { usePagedState } from "@/shared/hooks/use-paged-state";
import { Button } from "@/shared/ui/button";
import { DataTablePagination } from "@/shared/ui/data-table-pagination";

import { useRole } from "@/features/auth/hooks/use-role";
import { UserFormModal } from "@/features/user/components/user-form-modal";
import { UsersTable } from "@/features/user/components/users-table";
import { userQueries } from "@/features/user/hooks/user.queries";

const PAGE_SIZE = 20;

export function SettingsUsersView({ searchQ }: { searchQ?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { isAdmin } = useRole();
  const filters = { q: searchQ?.trim() || undefined };
  const { page, setPage } = usePagedState(filters);

  const { data, isLoading, isError, refetch } = useQuery(userQueries.list({ q: filters.q, page, limit: PAGE_SIZE }));

  const users = data?.results ?? [];
  const total = data?.total ?? users.length;

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {isAdmin && (
          <Button onClick={handleCreateUser} icon={UserPlusIcon} className="shrink-0 w-full sm:w-auto">
            <Trans>Create User</Trans>
          </Button>
        )}
      </div>

      <DataTablePagination page={page} limit={PAGE_SIZE} total={total} onPageChange={setPage} />

      <UsersTable
        users={users}
        isLoading={isLoading}
        onEditUser={handleEditUser}
        onRefetch={refetch}
        empty={
          isError ? (
            <EmptyState
              title={<Trans>Could not load users</Trans>}
              subtitle={<Trans>Check your connection and try again.</Trans>}
              action={
                <Button variant="secondary" onClick={() => refetch()}>
                  <Trans>Retry</Trans>
                </Button>
              }
            />
          ) : (
            <EmptyState
              title={<Trans>No users found</Trans>}
              subtitle={<Trans>Try a different search or create a new user.</Trans>}
            />
          )
        }
      />

      <UserFormModal open={isModalOpen} onClose={handleModalClose} user={editingUser} />
    </div>
  );
}
