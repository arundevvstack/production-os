'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function TelemetryCard({ title, value, description, trend }: { title: string, value: string | number, description: string, trend?: 'up' | 'down' | 'neutral' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <Card className="bg-card border-border shadow-sm overflow-hidden relative">
                {/* Subtle top border glow for 'alive' feel */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-50" />
                
                <CardHeader className="pb-2">
                    <CardDescription className="text-muted-foreground uppercase tracking-wider text-xs font-semibold">{title}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline justify-between">
                        <CardTitle className="text-3xl font-bold text-foreground">
                            {value}
                        </CardTitle>
                        {trend && (
                            <Badge variant="outline" className={
                                trend === 'up' ? "text-neon-emerald border-neon-emerald/30 bg-neon-emerald/5" :
                                trend === 'down' ? "text-destructive border-destructive/30 bg-destructive/5" :
                                "text-muted-foreground"
                            }>
                                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{description}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
