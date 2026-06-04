"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { SIDEBAR_WIDTH, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const FullScreenModal = DialogPrimitive.Root;

const FullScreenModalTrigger = DialogPrimitive.Trigger;

const FullScreenModalPortal = DialogPrimitive.Portal;

const FullScreenModalClose = DialogPrimitive.Close;

function FullScreenModalOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 left-(--sidebar-width)! z-50 bg-background/80 backdrop-blur-xs",
        className,
      )}
      data-slot="full-screen-modal-overlay"
      {...props}
    />
  );
}

function FullScreenModalContent({
  className,
  children,
  style,
  closeButtonClassName,
  hideCloseButton = false,
  ...props
}: DialogPrimitive.Popup.Props & {
  closeButtonClassName?: string;
  hideCloseButton?: boolean;
}) {
  const { state, isMobile } = useSidebar();

  return (
    <FullScreenModalPortal>
      <FullScreenModalOverlay />
      <DialogPrimitive.Popup
        className={cn(
          "fixed top-3.5 right-3.5 bottom-3.5 z-50 grid gap-4 rounded-[8px] border bg-background shadow-lg outline-none max-md:w-full",
          className,
        )}
        data-slot="full-screen-modal-content"
        style={{
          ...style,
          left: `calc(${!isMobile && state === "expanded" ? SIDEBAR_WIDTH : "4rem"} + 6px)`,
        }}
        {...props}
      >
        {children}
        {!hideCloseButton ? (
          <DialogPrimitive.Close
            render={
              <Button
                className={cn(
                  "absolute top-4 right-4 opacity-70 hover:opacity-100",
                  closeButtonClassName,
                )}
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </FullScreenModalPortal>
  );
}

function FullScreenModalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-4 text-center sm:text-left", className)}
      data-slot="full-screen-modal-header"
      {...props}
    />
  );
}

function FullScreenModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      data-slot="full-screen-modal-footer"
      {...props}
    />
  );
}

function FullScreenModalTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("font-semibold text-lg leading-none tracking-tight", className)}
      data-slot="full-screen-modal-title"
      {...props}
    />
  );
}

function FullScreenModalDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="full-screen-modal-description"
      {...props}
    />
  );
}

export {
  FullScreenModal,
  FullScreenModalClose,
  FullScreenModalContent,
  FullScreenModalDescription,
  FullScreenModalFooter,
  FullScreenModalHeader,
  FullScreenModalOverlay,
  FullScreenModalPortal,
  FullScreenModalTitle,
  FullScreenModalTrigger,
};
