import refs from "@church-task/backend/confect/_generated/refs";
import { LogOutIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/avatars/userAvatar";
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
            className={cn("size-10 rounded-full [&_svg]:size-[auto]", className)}
            size="icon"
            variant="ghost"
            {...buttonProps}
          />
        }
      >
        <UserAvatar
          avatar={currentUser?.image ?? null}
          name={currentUser?.name ?? null}
          size={avatarSize}
          userId={currentUser?._id ?? "user"}
        />
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
