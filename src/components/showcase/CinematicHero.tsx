"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Activity } from "lucide-react";
import { useState } from "react";

export function CinematicHero({ onRunSimulation }: { onRunSimulation: () => void }) {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRun = () => {
    setIsSimulating(true);
    onRunSimulation();
    setTimeout(() => setIsSimulating(false), 10000); // Reset after 10s simulation
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-muted dark:bg-primary">
      {/* Background Cinematic Grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-accent/20 dark:bg-accent/10 opacity-50 blur-[100px]"></div>
        <div className="absolute left-1/4 bottom-1/4 -z-10 h-[250px] w-[250px] rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 opacity-40 blur-[100px]"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted dark:bg-primary border border-border dark:border-primary mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-muted-foreground/80 dark:text-muted-foreground tracking-wide uppercase">
              Global Infrastructure Online
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground dark:text-zinc-50 mb-6 leading-tight">
            The Autonomous Operating System <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400">
              For AI-Native Creative Infrastructure
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground/80 dark:text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            DP Media OS orchestrates enterprise-scale AI production, operational intelligence, realtime collaboration, financial governance, and autonomous infrastructure resilience — inside a single continuously synchronized platform.
          </p>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block"
          >
            <Button
              onClick={handleRun}
              disabled={isSimulating}
              size="lg"
              className="h-14 px-8 text-lg rounded-full shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] bg-primary hover:bg-primary text-white dark:bg-muted dark:text-foreground dark:hover:bg-white dark:bg-slate-900 transition-all duration-300 gap-3 group"
            >
              {isSimulating ? (
                <>
                  <Activity className="w-5 h-5 animate-pulse text-emerald-400" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Run Global Simulation
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
