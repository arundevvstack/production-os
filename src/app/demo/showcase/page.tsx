"use client";

import { useState, useCallback } from "react";
import { CinematicHero } from "@/components/showcase/CinematicHero";
import { AnimatedCounter } from "@/components/showcase/AnimatedCounter";
import { InfrastructureMap } from "@/components/system/InfrastructureMap";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ShieldCheck, Zap, Database, Globe, ServerCrash } from "lucide-react";

export default function ShowcasePage() {
  const [simulationState, setSimulationState] = useState<
    "idle" | "spike" | "degradation" | "remediation" | "stabilized"
  >("idle");

  const runSimulation = useCallback(() => {
    // 1. Spike (0s)
    setSimulationState("spike");
    
    // 2. Degradation (2.5s)
    setTimeout(() => {
      setSimulationState("degradation");
    }, 2500);

    // 3. Remediation (5s)
    setTimeout(() => {
      setSimulationState("remediation");
    }, 5000);

    // 4. Stabilized (8s)
    setTimeout(() => {
      setSimulationState("stabilized");
    }, 8000);

    // Reset (12s)
    setTimeout(() => {
      setSimulationState("idle");
    }, 12000);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 selection:bg-emerald-500/30 font-sans">
      <CinematicHero onRunSimulation={runSimulation} />

      {/* Realtime Telemetry Wall */}
      <section className="py-20 border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_100%)]"></div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MetricCard 
              title="Events Processed" 
              value={simulationState === "idle" ? 2450892 : 2465103} 
              icon={<Zap className="w-5 h-5 text-amber-500" />} 
              suffix="+"
            />
            <MetricCard 
              title="Queue Reliability" 
              value={simulationState === "degradation" ? 97.2 : 99.98} 
              icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />} 
              suffix="%"
              isFloat
            />
            <MetricCard 
              title="Avg Propagation" 
              value={simulationState === "spike" ? 145 : (simulationState === "remediation" ? 24 : 12)} 
              icon={<Activity className="w-5 h-5 text-blue-500" />} 
              suffix="ms"
            />
            <MetricCard 
              title="Isolation Breaches" 
              value={0} 
              icon={<Database className="w-5 h-5 text-zinc-400" />} 
            />
          </div>
        </div>
      </section>

      {/* Interactive Infrastructure Topology */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-950 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
              Autonomous Orchestration Topology
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Live view of the global infrastructure cluster. Watch the system autonomously route around failures, scale queues under load, and govern AI budgets in realtime.
            </p>
          </div>

          <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden shadow-2xl h-[600px] flex">
            {/* The actual React Flow Map */}
            <div className="flex-1 relative">
              {/* Overlay simulation states onto the map container */}
              <AnimatePresence>
                {simulationState === "spike" && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 bg-amber-500/10 pointer-events-none transition-colors duration-1000" 
                  />
                )}
                {simulationState === "degradation" && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 bg-red-500/10 pointer-events-none transition-colors duration-1000" 
                  />
                )}
                {simulationState === "remediation" && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 bg-blue-500/10 pointer-events-none transition-colors duration-1000" 
                  />
                )}
              </AnimatePresence>
              
              <InfrastructureMap telemetry={{ incident_active: simulationState === "degradation" || simulationState === "remediation" } as any} />
            </div>

            {/* Incident Response Panel */}
            <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-md p-6 flex flex-col relative z-20">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                Incident Engine
              </h3>
              
              <div className="space-y-4 flex-1">
                <IncidentLog 
                  active={simulationState !== "idle"} 
                  time="T-0:00" 
                  title="Global Spike Detected" 
                  desc="100x traffic anomaly received at Ingress layer." 
                  type="warning"
                />
                <IncidentLog 
                  active={simulationState === "degradation" || simulationState === "remediation" || simulationState === "stabilized"} 
                  time="T-0:02" 
                  title="Provider Degradation" 
                  desc="OpenAI API latency exceeded SLA threshold (4500ms)." 
                  type="critical"
                />
                <IncidentLog 
                  active={simulationState === "remediation" || simulationState === "stabilized"} 
                  time="T-0:05" 
                  title="Autonomous Remediation" 
                  desc="Rerouting AI traffic to Anthropic Claude 3.5 Sonnet fallback pool." 
                  type="info"
                />
                <IncidentLog 
                  active={simulationState === "stabilized"} 
                  time="T-0:08" 
                  title="Platform Stabilized" 
                  desc="Queues drained. Financial COGS recalculated. Nominal operations." 
                  type="success"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Digital Twin Executive View */}
      <section className="py-24 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50">
        <div className="container mx-auto px-4 max-w-7xl">
           <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
              Digital Twin Executive View
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Realtime economic forecasting, cost-of-goods-sold (COGS) analytics, and operational health scoring — giving executives predictive control over enterprise creative operations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-zinc-500 mb-2">Platform MRR Forecast</div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">$4.2M</div>
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[78%]"></div>
                </div>
                <div className="text-xs text-zinc-500 mt-2 text-right">78% to Target</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-zinc-500 mb-2">Infrastructure COGS</div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                  $0.014 <span className="text-lg text-zinc-400 font-normal">/ render</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[35%]"></div>
                </div>
                <div className="text-xs text-zinc-500 mt-2 text-right">-12% Optimization Mode Active</div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-zinc-500 mb-2">Global Churn Risk</div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                  1.2<span className="text-lg text-zinc-400 font-normal">%</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[5%]"></div>
                </div>
                <div className="text-xs text-emerald-500 mt-2 text-right">Nominal Health</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, icon, suffix = "", isFloat = false }: { title: string, value: number, icon: React.ReactNode, suffix?: string, isFloat?: boolean }) {
  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-2 text-zinc-600 dark:text-zinc-400 font-medium">
          {icon}
          {title}
        </div>
        <div className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 flex items-baseline tracking-tight">
          <AnimatedCounter 
            value={value} 
            format={(v) => isFloat ? v.toFixed(2) : Math.round(v).toLocaleString()} 
          />
          <span className="text-2xl text-zinc-500 ml-1">{suffix}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function IncidentLog({ active, time, title, desc, type }: { active: boolean, time: string, title: string, desc: string, type: "info" | "warning" | "critical" | "success" }) {
  const colors = {
    info: "bg-blue-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
    success: "bg-emerald-500"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: active ? 1 : 0.3, x: active ? 0 : 10 }}
      className={`relative pl-4 border-l-2 ${active ? 'border-zinc-400 dark:border-zinc-600' : 'border-zinc-200 dark:border-zinc-800'} pb-2`}
    >
      <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${active ? colors[type] : 'bg-zinc-300 dark:bg-zinc-700'}`} />
      <div className="text-xs font-mono text-zinc-500 mb-1">{time}</div>
      <div className={`text-sm font-semibold mb-0.5 ${active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>{title}</div>
      <div className="text-xs text-zinc-500 leading-relaxed">{desc}</div>
    </motion.div>
  );
}
