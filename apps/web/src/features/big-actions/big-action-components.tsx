"use client";

import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";

import { Form } from "@/components/form/form";
import { ActionRow } from "@/components/ui/action-row";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalDescription,
  FullScreenModalHeader,
  FullScreenModalTitle,
} from "@/components/ui/full-screen-modal";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function useIsMdScreen() {
  const [isMdScreen, setIsMdScreen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMdScreen(query.matches);
    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return isMdScreen;
}

type BigActionWrapperProps = {
  children?: ReactNode;
  dialogContentClassName?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

export function BigActionWrapper({
  children,
  dialogContentClassName,
  ...domProps
}: BigActionWrapperProps) {
  const isMdScreen = useIsMdScreen();

  if (!isMdScreen) {
    return (
      <Drawer {...domProps}>
        <DrawerContent className="h-[100dvh] max-h-none">{children}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <FullScreenModal {...domProps}>
      <FullScreenModalContent className={cn("overflow-hidden", dialogContentClassName)}>
        {children}
      </FullScreenModalContent>
    </FullScreenModal>
  );
}

export function BigActionHeader(props: HTMLAttributes<HTMLDivElement>) {
  const isMdScreen = useIsMdScreen();

  return isMdScreen ? <FullScreenModalHeader {...props} /> : <DrawerHeader {...props} />;
}

export function BigActionTitle(props: HTMLAttributes<HTMLElement>) {
  const isMdScreen = useIsMdScreen();

  return isMdScreen ? <FullScreenModalTitle {...props} /> : <DrawerTitle {...props} />;
}

export function BigActionDescription(props: HTMLAttributes<HTMLElement>) {
  const isMdScreen = useIsMdScreen();

  return isMdScreen ? <FullScreenModalDescription {...props} /> : <DrawerDescription {...props} />;
}

export function BigActionFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2 border-t px-6 py-4", className)}
      data-slot="big-action-footer"
      {...props}
    />
  );
}

type BigActionFormProps = Omit<ComponentProps<typeof Form>, "children"> & {
  Primary: ReactNode;
  Secondary?: ReactNode;
  Actions?: ReactNode;
};

export function BigActionForm({
  Primary,
  Secondary,
  Actions,
  form,
  className,
  ...domProps
}: BigActionFormProps) {
  return (
    <>
      <Separator />
      <Form
        className={cn(
          "flex w-full flex-1 flex-col items-stretch gap-0 overflow-hidden rounded-[inherit]",
          className,
        )}
        form={form}
        {...domProps}
      >
        <div className="grid min-h-0 flex-1 auto-rows-fr overflow-hidden md:grid-cols-[1fr_auto_1fr]">
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">{Primary}</div>
          {Secondary ? (
            <>
              <Separator orientation="vertical" />
              <div className="flex min-h-0 flex-col gap-3 overflow-hidden p-4">{Secondary}</div>
            </>
          ) : null}
        </div>
        <ActionRow>{Actions}</ActionRow>
      </Form>
    </>
  );
}
