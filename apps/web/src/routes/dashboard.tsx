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
  const { data: activeChurch } = authClient.useActiveOrganization();

  const product = products?.find((product: { isRecurring?: boolean }) => product.isRecurring);
  const hasActiveSubscription = Boolean(subscription);

  return (
    <div>
      <h1>Dashboard</h1>
      {activeChurch ? <p>Active Church: {activeChurch.name}</p> : null}
      <p>
        privateData: {QueryResult.isSuccess(privateData) ? privateData.value.message : "Loading..."}
      </p>
      <p>Plan: {hasActiveSubscription ? "Active" : "Free"}</p>
      {subscription === undefined ? (
        <p>Loading subscription options...</p>
      ) : hasActiveSubscription ? (
        <CustomerPortalLink polarApi={api.polar} className={buttonVariants({ variant: "outline" })}>
          Manage Subscription
        </CustomerPortalLink>
      ) : products === undefined ? (
        <p>Loading subscription options...</p>
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
        <p>No recurring plans available.</p>
      )}
      <UserMenu />
    </div>
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

function ChurchOnboardingGate() {
  const activeChurch = authClient.useActiveOrganization();
  const [churchName, setChurchName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeChurch.isPending) {
    return <div>Loading Church...</div>;
  }

  if (activeChurch.data) {
    return <PrivateDashboardContent />;
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
