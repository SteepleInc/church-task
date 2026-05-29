import { api } from "@church-task/backend/convex/_generated/api";
import refs from "@church-task/backend/confect/_generated/refs";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryResult, useQuery as useConfectQuery } from "@confect/react";
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import UserMenu from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function PrivateDashboardContent() {
  const privateData = useConfectQuery(refs.public.privateData.get);
  const products = useQuery(api.polar.listAllProducts);
  const subscription = useQuery(api.polar.getCurrentSubscription);
  const activeChurch = useQuery(api.dashboard.getActiveOrganization);
  const pendingInvitations =
    activeChurch?.invitations.filter((invitation) => invitation.status === "pending") ?? [];

  const product = products?.find((product: { isRecurring?: boolean }) => product.isRecurring);
  const hasActiveSubscription = Boolean(subscription);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-muted/30 lg:flex-row">
      <aside className="border-b bg-background p-4 lg:w-80 lg:border-b-0 lg:border-r">
        <ChurchSwitcher
          activeChurchId={activeChurch?.id ?? null}
          activeChurchName={activeChurch?.name}
        />
      </aside>
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-xs sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Church Task</p>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            {activeChurch ? (
              <p className="text-sm text-muted-foreground">Active Church: {activeChurch.name}</p>
            ) : null}
          </div>
          <UserMenu />
        </div>
        <section className="grid gap-4 rounded-xl border bg-background p-4 shadow-xs">
          <div>
            <h2 className="text-base font-semibold">Church Home</h2>
            <p className="text-sm text-muted-foreground">
              privateData:{" "}
              {QueryResult.isSuccess(privateData) ? privateData.value.message : "Loading..."}
            </p>
            <p className="text-sm text-muted-foreground">
              Plan: {hasActiveSubscription ? "Active" : "Free"}
            </p>
          </div>
          {subscription === undefined ? (
            <p className="text-sm text-muted-foreground">Loading subscription options...</p>
          ) : hasActiveSubscription ? (
            <CustomerPortalLink
              polarApi={api.polar}
              className={buttonVariants({ variant: "outline" })}
            >
              Manage Subscription
            </CustomerPortalLink>
          ) : products === undefined ? (
            <p className="text-sm text-muted-foreground">Loading subscription options...</p>
          ) : product ? (
            <CheckoutLink
              polarApi={api.polar}
              productIds={[product.id]}
              embed={false}
              className={buttonVariants({ variant: "default" })}
            >
              Upgrade
            </CheckoutLink>
          ) : (
            <p className="text-sm text-muted-foreground">No recurring plans available.</p>
          )}
        </section>
        <ActiveChurchInvitationPrompt />
        {activeChurch ? (
          <>
            <ChurchMembersPanel activeChurchId={activeChurch.id} />
            <ChurchInvitationPanel
              activeChurchId={activeChurch.id}
              pendingInvitations={pendingInvitations}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}

function ActiveChurchInvitationPrompt() {
  const invitations = useQuery(api.dashboard.listUserInvitations);
  const [error, setError] = useState<string | null>(null);
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<string | null>(null);
  const pendingInvitations = invitations ?? [];

  if (invitations === undefined || (!error && pendingInvitations.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Church Invitations</CardTitle>
        <CardDescription>
          You have invitations to other Churches. Accepting one switches your Active Church.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {pendingInvitations.map((invitation) => {
          const isAccepting = acceptingInvitationId === invitation.id;

          return (
            <div
              key={invitation.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{invitation.organizationName}</p>
                <p className="text-sm text-muted-foreground">
                  Role: {invitationRoleLabel(invitation.role)}
                </p>
              </div>
              <Button
                type="button"
                disabled={isAccepting}
                onClick={async () => {
                  setError(null);
                  setAcceptingInvitationId(invitation.id);
                  const result = await authClient.organization.acceptInvitation({
                    invitationId: invitation.id,
                  });
                  setAcceptingInvitationId(null);

                  if (result.error) {
                    setError(result.error.message ?? "Could not accept Church Invitation.");
                    return;
                  }
                }}
              >
                {isAccepting ? "Accepting..." : "Accept Invitation"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

type InvitationRole = "member" | "admin";

type PendingInvitation = {
  id: string;
  email: string;
  role: string | string[];
  status: string;
};

function invitationRoleLabel(role: string | string[]) {
  return Array.isArray(role) ? role.join(", ") : role;
}

function memberHasRole(role: string | string[], expectedRole: string) {
  return Array.isArray(role) ? role.includes(expectedRole) : role === expectedRole;
}

function ChurchMembersPanel({ activeChurchId }: { activeChurchId: string }) {
  const members = useQuery(api.dashboard.listMembers, { organizationId: activeChurchId });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Church Members</CardTitle>
        <CardDescription>Your membership context for the Active Church.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {members === undefined ? (
          <p className="text-sm text-muted-foreground">Loading Church Members...</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-muted-foreground">{success}</p> : null}
        {members !== undefined && !error && members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Church Members found.</p>
        ) : null}
        {(members ?? []).map((member) => {
          const isOwner = memberHasRole(member.role, "owner");
          const roleLabel = invitationRoleLabel(member.role);
          const isUpdating = updatingMemberId === member.id;
          const isRemoving = removingMemberId === member.id;

          return (
            <div
              key={member.id}
              className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="font-medium">{member.user.name ?? "Unnamed member"}</p>
                <p className="text-sm text-muted-foreground">{member.user.email ?? "No email"}</p>
              </div>
              {isOwner ? (
                <span className="text-sm capitalize text-muted-foreground">{roleLabel}</span>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="sr-only" htmlFor={`member-role-${member.id}`}>
                    Role for {member.user.email ?? member.user.name ?? "Church member"}
                  </Label>
                  <select
                    id={`member-role-${member.id}`}
                    value={memberHasRole(member.role, "admin") ? "admin" : "member"}
                    disabled={isUpdating || isRemoving}
                    onChange={async (event) => {
                      const nextRole = event.target.value as InvitationRole;
                      setError(null);
                      setSuccess(null);
                      setUpdatingMemberId(member.id);
                      const result = await authClient.organization.updateMemberRole({
                        organizationId: activeChurchId,
                        memberId: member.id,
                        role: nextRole,
                      });
                      setUpdatingMemberId(null);

                      if (result.error) {
                        setError(result.error.message ?? "Could not update Church Member role.");
                        return;
                      }

                      setSuccess(`Updated ${member.user.email ?? "Church Member"} to ${nextRole}.`);
                    }}
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Remove ${member.user.email ?? member.user.name ?? "Church Member"}`}
                    disabled={isUpdating || isRemoving}
                    onClick={async () => {
                      setError(null);
                      setSuccess(null);
                      setRemovingMemberId(member.id);
                      const result = await authClient.organization.removeMember({
                        organizationId: activeChurchId,
                        memberIdOrEmail: member.id,
                      });
                      setRemovingMemberId(null);

                      if (result.error) {
                        setError(result.error.message ?? "Could not remove Church Member.");
                        return;
                      }

                      setSuccess(`Removed ${member.user.email ?? "Church Member"}.`);
                    }}
                  >
                    {isRemoving ? "Removing..." : "Remove"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ChurchInvitationPanel({
  activeChurchId,
  pendingInvitations,
}: {
  activeChurchId: string;
  pendingInvitations: PendingInvitation[];
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationRole>("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Church Invitations</CardTitle>
        <CardDescription>
          Invite people to this Church and track pending invitations.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form
          className="grid max-w-xl gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setInviteError(null);
            setInviteSuccess(null);

            const trimmedEmail = inviteEmail.trim().toLowerCase();

            if (!trimmedEmail.includes("@")) {
              setInviteError("Enter a valid email address.");
              return;
            }

            setIsInviting(true);
            const result = await authClient.organization.inviteMember({
              organizationId: activeChurchId,
              email: trimmedEmail,
              role: inviteRole,
            });
            setIsInviting(false);

            if (result.error) {
              setInviteError(result.error.message ?? "Could not invite Church member.");
              return;
            }

            setInviteEmail("");
            setInviteRole("member");
            setInviteSuccess(`Invitation sent to ${trimmedEmail}.`);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Invite Member Email</Label>
            <Input
              id="invite-email"
              name="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="member@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              name="inviteRole"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as InvitationRole)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {inviteError ? <p className="text-sm text-destructive">{inviteError}</p> : null}
          {inviteSuccess ? <p className="text-sm text-muted-foreground">{inviteSuccess}</p> : null}
          <Button type="submit" disabled={isInviting}>
            {isInviting ? "Inviting..." : "Invite Member"}
          </Button>
        </form>
        <div className="grid gap-3">
          <h2 className="text-base font-semibold">Pending Invitations</h2>
          {pendingInvitations.length > 0 ? (
            <div className="grid gap-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <span>{invitation.email}</span>
                  <span className="text-sm capitalize text-muted-foreground">
                    {invitationRoleLabel(invitation.role)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pending invitations.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function churchSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function ChurchSwitcher({
  activeChurchId,
  activeChurchName,
}: {
  activeChurchId: string | null;
  activeChurchName?: string;
}) {
  const churches = useQuery(api.dashboard.listOrganizations);
  const [newChurchName, setNewChurchName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingChurchId, setPendingChurchId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const churchList = churches ?? [];

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Active Church
        </p>
        <p className="mt-1 text-lg font-semibold leading-tight">
          {activeChurchName ?? "Loading..."}
        </p>
      </div>
      <div className="grid gap-2">
        <p className="text-sm font-medium">Switch Church</p>
        {churches === undefined ? (
          <p className="text-sm text-muted-foreground">Loading Churches...</p>
        ) : null}
        {churchList.map((church) => {
          const isActive = church.id === activeChurchId;
          const isPending = pendingChurchId === church.id;

          return (
            <Button
              key={church.id}
              type="button"
              variant={isActive ? "secondary" : "ghost"}
              className="justify-start"
              disabled={isActive || isPending}
              onClick={async () => {
                setError(null);
                setPendingChurchId(church.id);
                const result = await authClient.organization.setActive({
                  organizationId: church.id,
                });
                setPendingChurchId(null);

                if (result.error) {
                  setError(result.error.message ?? "Could not switch Church.");
                }
              }}
            >
              {isPending ? "Switching..." : church.name}
            </Button>
          );
        })}
      </div>
      <form
        className="grid gap-3 border-t pt-4 lg:mt-auto"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          const trimmedName = newChurchName.trim();
          const slug = churchSlug(trimmedName);

          if (trimmedName.length < 2 || !slug) {
            setError("Church name must be at least 2 characters.");
            return;
          }

          setIsCreating(true);
          const result = await authClient.organization.create({
            name: trimmedName,
            slug,
          });
          setIsCreating(false);

          if (result.error) {
            setError(result.error.message ?? "Could not create Church.");
            return;
          }

          setNewChurchName("");
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="new-church-name">Create Another Church</Label>
          <Input
            id="new-church-name"
            name="newChurchName"
            value={newChurchName}
            onChange={(event) => setNewChurchName(event.target.value)}
            placeholder="Second Church"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={isCreating}>
          {isCreating ? "Creating Church..." : "Create Church"}
        </Button>
      </form>
    </div>
  );
}

function ChurchOnboardingGate() {
  const activeChurch = useQuery(api.dashboard.getActiveOrganization);
  const hasActiveChurch = Boolean(activeChurch);
  const [churchName, setChurchName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const pendingInvitations = useQuery(api.dashboard.listUserInvitations);
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeChurch === undefined) {
    return <div>Loading Church...</div>;
  }

  if (hasActiveChurch) {
    return <PrivateDashboardContent />;
  }

  if (pendingInvitations === undefined) {
    return <div>Loading Church Invitations...</div>;
  }

  if (pendingInvitations.length > 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col justify-center p-6">
        <Card>
          <CardHeader>
            <CardTitle>Accept Church Invitation</CardTitle>
            <CardDescription>
              You have pending Church Invitations. Join one before creating a new Church.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {invitationError ? <p className="text-sm text-destructive">{invitationError}</p> : null}
            {pendingInvitations.map((invitation) => {
              const isAccepting = acceptingInvitationId === invitation.id;

              return (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{invitation.organizationName}</p>
                    <p className="text-sm text-muted-foreground">
                      Role: {invitationRoleLabel(invitation.role)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled={isAccepting}
                    onClick={async () => {
                      setInvitationError(null);
                      setAcceptingInvitationId(invitation.id);
                      const result = await authClient.organization.acceptInvitation({
                        invitationId: invitation.id,
                      });
                      setAcceptingInvitationId(null);

                      if (result.error) {
                        setInvitationError(
                          result.error.message ?? "Could not accept Church Invitation.",
                        );
                        return;
                      }
                    }}
                  >
                    {isAccepting ? "Accepting..." : "Accept Invitation"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Your First Church</CardTitle>
          <CardDescription>
            Church Task needs an active Church before you can enter the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationError ? (
            <p className="mb-4 text-sm text-destructive">{invitationError}</p>
          ) : null}
          <form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);

              const trimmedName = churchName.trim();
              const slug = churchSlug(trimmedName);

              if (trimmedName.length < 2 || !slug) {
                setError("Church name must be at least 2 characters.");
                return;
              }

              setIsSubmitting(true);
              const result = await authClient.organization.create({
                name: trimmedName,
                slug,
              });
              setIsSubmitting(false);

              if (result.error) {
                setError(result.error.message ?? "Could not create Church.");
              }
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="church-name">Church Name</Label>
              <Input
                id="church-name"
                name="churchName"
                value={churchName}
                onChange={(event) => setChurchName(event.target.value)}
                placeholder="Grace Community Church"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Church..." : "Create Church"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <ChurchOnboardingGate />
      </Authenticated>
      <Unauthenticated>
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </Unauthenticated>
      <AuthLoading>
        <div>Loading...</div>
      </AuthLoading>
    </>
  );
}
