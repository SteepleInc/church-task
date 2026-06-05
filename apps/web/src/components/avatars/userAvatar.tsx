import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import BoringAvatar from "boring-avatars";
import { Array, Option, pipe, String } from "effect";
import type { ComponentPropsWithoutRef, FC, Ref } from "react";

import { BaseAvatar } from "@/components/avatars/baseAvatar";
import { Avatar } from "@/components/ui/avatar";

type UserAvatarBaseProps = {
  size?: number;
  ref?: Ref<HTMLElement>;
  onImageLoad?: (img: HTMLImageElement) => void;
} & ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>;

type UserAvatarProps = UserAvatarBaseProps & {
  name: string | null;
  userId: string;
  avatar?: string | null;
  fallbackVariant?: "marble" | "beam";
};

export const UserAvatar: FC<UserAvatarProps> = (props) => {
  const {
    userId,
    size = 40,
    avatar,
    name,
    onImageLoad,
    className,
    fallbackVariant = "marble",
    ...domProps
  } = props;

  return (
    <Avatar {...domProps} className={className} style={{ height: size, width: size }}>
      {pipe(
        avatar,
        Option.fromNullable,
        Option.filter(String.isNonEmpty),
        Option.match({
          onNone: () => (
            <BoringAvatar
              className="size-full"
              colors={["#0A0310", "#49007E", "#FF005B", "#FF7D10", "#FFB238"]}
              name={pipe(userId, String.split("_"), Array.lastNonEmpty)}
              size={size}
              variant={fallbackVariant}
            />
          ),
          onSome: (x) => (
            <BaseAvatar
              _tag="user"
              avatar={x}
              name={name}
              onImageLoad={onImageLoad}
              size={size}
              {...domProps}
            />
          ),
        }),
      )}
    </Avatar>
  );
};
