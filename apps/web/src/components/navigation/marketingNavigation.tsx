import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import UserMenu from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export const MarketingNavigation = () => {
  const { data: session } = authClient.useSession();

  return (
    <>
      <Link to="/">
        <span className="block h-10 w-auto font-medium font-serif text-3xl text-white leading-10">
          Church Task
        </span>
      </Link>

      <div className="flax ml-auto flex items-center gap-4">
        {!session ? (
          <motion.div
            animate={{ filter: "blur(0px)", opacity: 1 }}
            initial={{ filter: "blur(8px)", opacity: 0 }}
            transition={{ delay: 0.01, duration: 1 }}
          >
            <Button asChild className={cn("-mr-4 text-white/80 hover:text-white")} variant="ghost">
              <Link to="/sign-in">Sign In</Link>
            </Button>
          </motion.div>
        ) : (
          <>
            <motion.div
              animate={{ filter: "blur(0px)", opacity: 1 }}
              initial={{ filter: "blur(8px)", opacity: 0 }}
              transition={{ delay: 0.01, duration: 1 }}
            >
              <Link
                className="font-medium text-sm text-white/80 transition-colors hover:text-white"
                to="/my-work"
              >
                Dashboard
              </Link>
            </motion.div>
            <motion.div
              animate={{ filter: "blur(0px)", opacity: 1 }}
              initial={{ filter: "blur(8px)", opacity: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <UserMenu />
            </motion.div>
          </>
        )}
      </div>
    </>
  );
};
