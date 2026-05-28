'use client';

import React from 'react';
import { TelemetryCard } from '@/components/system/TelemetryCard';
import { InfrastructureMap } from '@/components/system/InfrastructureMap';
import { motion } from 'framer-motion';
import { useThrottledTelemetry, type TelemetryData } from '@/hooks/useThrottledTelemetry';


export default function CommandCenter() {
    const telemetry = useThrottledTelemetry(250);

    return (
        <div className="min-h-screen bg-background p-8 font-sans">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-neon-cyan animate-pulse" />
                    Executive Command Center
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">Global Infrastructure Observability & AI Governance</p>
            </motion.div>

            {/* Top Row: Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <TelemetryCard 
                    title="Active Tenants" 
                    value={telemetry.active_tenants.toLocaleString()} 
                    description="Across 3 global regions" 
                    trend="neutral" 
                />
                <TelemetryCard 
                    title="Distributed Queue Depth" 
                    value={telemetry.queue_depth} 
                    description="Pending distributed jobs" 
                    trend={telemetry.queue_depth > 30 ? 'up' : 'down'} 
                />
                <TelemetryCard 
                    title="Global Error Budget" 
                    value={`${telemetry.error_budget.toFixed(2)}%`} 
                    description="Platform-wide API success rate" 
                    trend={telemetry.error_budget < 98 ? 'down' : 'neutral'} 
                />
                <TelemetryCard 
                    title="Total AI COGS (Hourly)" 
                    value={`$${telemetry.ai_cogs.toFixed(2)}`} 
                    description="Infrastructure & Provider Costs" 
                    trend="up" 
                />
            </div>

            {/* Middle Row: Infrastructure Maps & Live Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 bg-card border border-border rounded-xl p-2 relative overflow-hidden h-[400px]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-purple/5 to-transparent pointer-events-none z-0" />
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border">
                            <div className={`w-2 h-2 rounded-full ${telemetry.incident_active ? 'bg-destructive animate-pulse' : 'bg-neon-emerald'}`} />
                            Global AI Routing Topology
                        </span>
                    </div>
                    <div className="w-full h-full relative z-10">
                        <InfrastructureMap telemetry={telemetry} />
                    </div>
                </div>
                
                <div className="col-span-1 bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Autonomous Remediation Log</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 text-sm border-l-2 border-neon-amber/50 pl-3 py-1">
                                <span className="text-muted-foreground min-w-[60px]">10:4{i}a</span>
                                <span className="text-foreground/80">AI Provider timeout. Rerouted {Math.floor(Math.random()*10)} workloads to Anthropic.</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
