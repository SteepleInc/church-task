import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type OnboardingProgressProps = HTMLAttributes<HTMLDivElement> & {
  readonly currentStep: number;
  readonly totalSteps: number;
};

export function OnboardingProgress({
  totalSteps,
  currentStep,
  className,
  ...domProps
}: OnboardingProgressProps) {
  return (
    <div className={cn("flex flex-row items-center justify-center gap-2", className)} {...domProps}>
      {Array.from({ length: totalSteps }, (_, index) => index + 1).map((step) => (
        <ProgressItem isActive={step === currentStep} isCompleted={step < currentStep} key={step} />
      ))}
    </div>
  );
}

type ProgressItemProps = {
  readonly isActive: boolean;
  readonly isCompleted: boolean;
};

function ProgressItem({ isCompleted, isActive }: ProgressItemProps) {
  return (
    <div
      className={cn(
        "h-2.5 rounded-full border",
        isCompleted || isActive
          ? "border-emerald-600 bg-linear-to-b from-emerald-400 to-emerald-500"
          : "border-neutral-300 bg-neutral-200",
        isActive ? "w-10 ring-2 ring-emerald-300" : "w-2.5",
      )}
    />
  );
}
