/** biome-ignore-all lint/suspicious/noExplicitAny: copied animation primitive */
"use client";

import { AnimatePresence, LayoutGroup, motion, type Variants } from "motion/react";
import { Children, type ElementType, type JSX, type ReactNode, useMemo } from "react";

export type PresetType =
  | "fade"
  | "slide"
  | "scale"
  | "blur-sm"
  | "blur-slide"
  | "zoom"
  | "flip"
  | "bounce"
  | "rotate"
  | "swing";

export type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  preset?: PresetType;
  as?: ElementType;
  asChild?: ElementType;
};

const defaultContainerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const presetVariants: Record<PresetType, Variants> = {
  "blur-slide": {
    hidden: { filter: "blur(4px)", y: 20 },
    visible: { filter: "blur(0px)", y: 0 },
  },
  "blur-sm": {
    hidden: { filter: "blur(4px)" },
    visible: { filter: "blur(0px)" },
  },
  bounce: {
    hidden: { y: -50 },
    visible: {
      transition: { damping: 10, stiffness: 400, type: "spring" },
      y: 0,
    },
  },
  fade: {},
  flip: {
    hidden: { rotateX: -90 },
    visible: {
      rotateX: 0,
      transition: { damping: 20, stiffness: 300, type: "spring" },
    },
  },
  rotate: {
    hidden: { rotate: -180 },
    visible: {
      rotate: 0,
      transition: { damping: 15, stiffness: 200, type: "spring" },
    },
  },
  scale: {
    hidden: { scale: 0.8 },
    visible: { scale: 1 },
  },
  slide: {
    hidden: { y: 20 },
    visible: { y: 0 },
  },
  swing: {
    hidden: { rotate: -10 },
    visible: {
      rotate: 0,
      transition: { damping: 8, stiffness: 300, type: "spring" },
    },
  },
  zoom: {
    hidden: { scale: 0.5 },
    visible: {
      scale: 1,
      transition: { damping: 20, stiffness: 300, type: "spring" },
    },
  },
};

const addDefaultVariants = (variants: Variants) => ({
  hidden: { ...defaultItemVariants.hidden, ...variants.hidden },
  visible: { ...defaultItemVariants.visible, ...variants.visible },
});

function AnimatedGroup({
  children,
  className,
  variants,
  preset,
  as = "div",
  asChild = "div",
}: AnimatedGroupProps) {
  const selectedVariants = {
    container: addDefaultVariants(defaultContainerVariants),
    item: addDefaultVariants(preset ? presetVariants[preset] : {}),
  };
  const containerVariants = variants?.container || selectedVariants.container;
  const itemVariants = variants?.item || selectedVariants.item;

  const MotionComponent = useMemo(() => motion.create(as as keyof JSX.IntrinsicElements), [as]);
  const MotionChild = useMemo(
    () => motion.create(asChild as keyof JSX.IntrinsicElements),
    [asChild],
  );

  return (
    <LayoutGroup>
      <MotionComponent
        animate="visible"
        className={`relative ${className}`}
        initial="hidden"
        layout
        variants={containerVariants}
      >
        <AnimatePresence mode="popLayout">
          {Children.map(children, (child, index) => (
            <MotionChild
              key={child && (child as any)?.key ? (child as any).key : index}
              layout
              style={{ position: "relative" }}
              variants={itemVariants}
            >
              {child}
            </MotionChild>
          ))}
        </AnimatePresence>
      </MotionComponent>
    </LayoutGroup>
  );
}

export { AnimatedGroup };
