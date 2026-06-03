import { createFileRoute } from "@tanstack/react-router";

import { MainContainer } from "@/components/pageComponents";
import { UsersCollection } from "@/features/users/usersCollection";

export const Route = createFileRoute("/_org/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <MainContainer>
      <UsersCollection _tag="global" />
    </MainContainer>
  );
}
