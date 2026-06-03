import refs from "@church-task/backend/confect/_generated/refs";
import { LogOutIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { QueryResult, useQuery } from "@confect/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type UserMenuProps = ComponentProps<typeof Button> & {
  readonly avatarSize?: number;
};

type UserMenuUser = {
  readonly name?: string | null;
  readonly email?: string | null;
  readonly image?: string | null;
};

export function getUserMenuAvatarFallback(user: UserMenuUser | null) {
  const label = user?.name?.trim() || user?.email?.trim() || "User";
  const words = label.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

export default function UserMenu({ avatarSize = 24, className, ...buttonProps }: UserMenuProps) {
  const navigate = useNavigate();
  const user = useQuery(refs.public.auth.getCurrentUser);
  const currentUser = QueryResult.isSuccess(user) ? user.value : null;
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({
            to: "/",
          });
        },
      },
    });

    setIsSigningOut(false);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            className={cn("rounded-full [&_svg]:size-[auto]", className)}
            size="icon"
            variant="ghost"
            {...buttonProps}
          />
        }
      >
        <Avatar
          className="after:border-border/70"
          style={{ height: avatarSize, width: avatarSize }}
        >
          {currentUser?.image ? (
            <AvatarImage alt={currentUser.name ?? "User"} src={currentUser.image} />
          ) : null}
          <AvatarFallback>{getUserMenuAvatarFallback(currentUser)}</AvatarFallback>
        </Avatar>
        <span className="sr-only">User menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={isSigningOut} onClick={signOut}>
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
