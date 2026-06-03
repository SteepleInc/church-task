import SignInForm from "@/components/sign-in-form";
import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";

const signInSearchSchema = Schema.Struct({
  email: Schema.optional(Schema.String),
  "invitation-id": Schema.optional(Schema.String),
});

export const Route = createFileRoute("/_auth/sign-in")({
  component: SignInRoute,
  validateSearch: Schema.standardSchemaV1(signInSearchSchema),
});

function SignInRoute() {
  const search = Route.useSearch();

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <SignInForm defaultEmail={search.email} invitationId={search["invitation-id"]} />
    </main>
  );
}
