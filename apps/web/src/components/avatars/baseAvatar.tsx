import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { Match, Option, pipe, String } from "effect";
import type { ComponentPropsWithoutRef, FC, Ref } from "react";

import { Avatar, AvatarFallback, AvatarImage, getAvatarInitials } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type BaseAvatarProps = {
  size?: number;
  aspectRatio?: "square" | "landscape";
  ref?: Ref<HTMLElement>;
  name: string | null;
  avatar?: string | null;
  _tag?: string;
  onImageLoad?: (img: HTMLImageElement) => void;
  innerComponentClassName?: string;
} & ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>;

type BaseAvatarSkeletonProps = {
  size?: number;
  aspectRatio?: "square" | "landscape";
  _tag?: string;
  className?: string;
};

const getAvatarClassName = (_tag?: string) =>
  pipe(
    _tag,
    Option.fromNullishOr,
    Option.match({
      onNone: () => "",
      onSome: (x) =>
        pipe(
          Match.value(x),
          Match.when("org", () => "rounded-md"),
          Match.orElse(() => ""),
        ),
    }),
  );

const getWidth = (size: number, aspectRatio: "square" | "landscape") =>
  aspectRatio === "landscape" ? Math.round(size * (16 / 9)) : size;

export const BaseAvatarSkeleton: FC<BaseAvatarSkeletonProps> = (props) => {
  const { size = 40, aspectRatio = "square", _tag, className } = props;
  const width = getWidth(size, aspectRatio);

  return (
    <Skeleton className={cn(getAvatarClassName(_tag), className)} style={{ height: size, width }} />
  );
};

export const BaseAvatar: FC<BaseAvatarProps> = (props) => {
  const {
    size = 40,
    aspectRatio = "square",
    style = {},
    name,
    avatar,
    ref,
    className,
    _tag,
    onImageLoad,
    innerComponentClassName,
    ...domProps
  } = props;
  const width = getWidth(size, aspectRatio);

  return (
    <Avatar
      {...domProps}
      className={cn(getAvatarClassName(_tag), className)}
      ref={ref}
      style={{ ...style, height: size, width }}
    >
      {pipe(
        avatar,
        Option.fromNullishOr,
        Option.filter(String.isNonEmpty),
        Option.match({
          onNone: () => (
            <AvatarFallback className={innerComponentClassName}>
              {pipe(
                name,
                Option.fromNullishOr,
                Option.match({
                  onNone: () => "",
                  onSome: (x) =>
                    pipe(
                      _tag,
                      Option.fromNullishOr,
                      Option.match({
                        onNone: () => getAvatarInitials(x),
                        onSome: (y) => getAvatarInitials(x, y),
                      }),
                    ),
                }),
              )}
            </AvatarFallback>
          ),
          onSome: (x) => (
            <AvatarImage
              alt={"Avatar image."}
              className={cn("object-cover", innerComponentClassName)}
              onLoad={onImageLoad ? (e) => onImageLoad(e.currentTarget) : undefined}
              src={x}
            />
          ),
        }),
      )}
    </Avatar>
  );
};
