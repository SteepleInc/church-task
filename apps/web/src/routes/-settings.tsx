import { Link } from "@tanstack/react-router";
import { revalidateLogic } from "@tanstack/react-form";
import { Schema } from "effect";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/ts-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authClient } from "@/lib/auth-client";
import {
  ChurchSettingsPanel,
  TeamInvitationsSettingsPanel,
  TeamMembersSettingsPanel,
} from "@/routes/-dashboard";

type SettingsSection = "profile" | "church" | "members" | "invites";

export const settingsSections: readonly {
  readonly id: SettingsSection;
  readonly label: string;
  readonly description: string;
  readonly to: "/settings/profile" | "/settings/org" | "/settings/team/$teamTab";
  readonly params?: { readonly teamTab: "members" | "invites" };
}[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Your user account and support details.",
    to: "/settings/profile",
  },
  {
    id: "church",
    label: "Church",
    description: "Church profile and cycle configuration.",
    to: "/settings/org",
  },
  {
    id: "members",
    label: "Members",
    description: "Church members, Teams, and Team membership.",
    params: { teamTab: "members" },
    to: "/settings/team/$teamTab",
  },
  {
    id: "invites",
    label: "Invitations",
    description: "Invite members and review pending invitations.",
    params: { teamTab: "invites" },
    to: "/settings/team/$teamTab",
  },
];

export function getSettingsSectionIds() {
  return settingsSections.map((section) => section.id);
}

export function normalizeProfileName(value: string) {
  return value.trim().replaceAll(/\s+/g, " ");
}

const ProfileSettingsSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.transform(Schema.String, {
      decode: normalizeProfileName,
      encode: (value) => value,
    }),
    Schema.minLength(1, { message: () => "Name is required." }),
  ),
});

export function SettingsFrame({
  activeSection,
  children,
}: {
  readonly activeSection: SettingsSection;
  readonly children: ReactNode;
}) {
  return (
    <ScrollArea className="min-h-0 flex-1" viewportClassName="p-6">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="grid gap-2">
          <p className="font-medium text-muted-foreground text-sm">Settings</p>
          <h1 className="font-semibold text-3xl tracking-tight">Settings</h1>
          <p className="max-w-2xl text-muted-foreground">
            Manage your profile, Church setup, members, and invitations.
          </p>
        </header>

        <nav aria-label="Settings sections" className="grid gap-3 md:grid-cols-4">
          {settingsSections.map((section) => (
            <Link
              activeOptions={{ exact: true }}
              className={
                section.id === activeSection
                  ? "rounded-lg border bg-card p-4 text-card-foreground shadow-sm ring-2 ring-primary"
                  : "rounded-lg border bg-card/60 p-4 text-card-foreground transition-colors hover:bg-card"
              }
              key={section.id}
              params={section.params}
              to={section.to}
            >
              <span className="font-medium">{section.label}</span>
              <span className="mt-1 block text-muted-foreground text-sm">
                {section.description}
              </span>
            </Link>
          ))}
        </nav>

        {children}
      </main>
    </ScrollArea>
  );
}

export function SettingsProfilePanel() {
  const { data, refetch: refetchSession } = authClient.useSession();
  const user = data?.user;

  if (!user) {
    return <p className="text-sm text-muted-foreground">Loading profile settings...</p>;
  }

  return <SettingsProfileForm refetchSession={refetchSession} user={user} />;
}

function SettingsProfileForm({
  refetchSession,
  user,
}: {
  readonly refetchSession: () => Promise<unknown>;
  readonly user: { readonly id: string; readonly name: string; readonly email: string };
}) {
  const [profileError, setProfileError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      name: user.name,
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "blur",
    }),
    validators: {
      onSubmit: Schema.standardSchemaV1(ProfileSettingsSchema),
    },
    onSubmit: async ({ value, formApi }) => {
      const name = normalizeProfileName(value.name);
      setProfileError(null);

      const result = await authClient.updateUser({ name });
      if (result.error) {
        setProfileError(result.error.message ?? "Could not update profile.");
        return;
      }

      formApi.reset({ name });
      await refetchSession();
      toast.success("Profile updated.");
    },
  });

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your Church Task account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppField name="name">
              {(field) => (
                <field.InputField
                  autoCapitalize="words"
                  autoComplete="name"
                  label="Name"
                  placeholder="Jane Doe"
                  required
                />
              )}
            </form.AppField>
            <SettingDetail label="Email" value={user.email} />
            {profileError ? (
              <Alert variant="destructive">
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            ) : null}
            <form.Subscribe
              selector={(state) => ({
                isDefaultValue: state.isDefaultValue,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ isDefaultValue, isSubmitting }) => (
                <Button
                  className="mr-auto"
                  disabled={isDefaultValue}
                  loading={isSubmitting}
                  type="submit"
                >
                  Update Profile
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical</CardTitle>
          <CardDescription>Details you may need when contacting support.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingDetail label="User Id" value={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsChurchPanel() {
  return <ChurchSettingsPanel />;
}

export function SettingsTeamTabPanel({ teamTab }: { readonly teamTab: string }) {
  if (teamTab === "invites") {
    return <TeamInvitationsSettingsPanel />;
  }

  return <TeamMembersSettingsPanel />;
}

function SettingDetail({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="grid gap-1">
      <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </div>
      <div className="break-all">{value}</div>
    </div>
  );
}
