"use client";

import { useState } from "react";
import { login, signup } from "./actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/ui/logo";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAuth(formData: FormData, action: "login" | "signup") {
    setIsLoading(true);
    setError(null);
    try {
      const response = action === "login" ? await login(formData) : await signup(formData);
      if (response?.error) {
        setError(response.error);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 font-body">
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:20px_20px] dark:bg-grid-slate-400/[0.05]" />
      <div className="absolute top-0 right-0 p-12 -z-10 opacity-30">
        <div className="w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 p-12 -z-10 opacity-30">
        <div className="w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Logo variant="full" />
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
            <TabsTrigger value="login" className="text-sm font-semibold h-full">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="text-sm font-semibold h-full">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-white/20 dark:border-slate-800/50 shadow-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">Welcome back</CardTitle>
                <CardDescription>Enter your email and password to access your workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={(f) => handleAuth(f, "login")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="name@example.com" required className="h-11 bg-white/50 dark:bg-slate-950/50" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input id="password" name="password" type="password" required className="h-11 bg-white/50 dark:bg-slate-950/50" />
                  </div>
                  {error && <div className="text-sm text-destructive font-semibold bg-destructive/10 p-3 rounded-md">{error}</div>}
                  <Button type="submit" className="w-full h-11 text-base font-bold tracking-tight shadow-lg hover:shadow-xl transition-all" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="border-white/20 dark:border-slate-800/50 shadow-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">Create an account</CardTitle>
                <CardDescription>Enter your details below to create your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={(f) => handleAuth(f, "signup")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="name@example.com" required className="h-11 bg-white/50 dark:bg-slate-950/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="password" type="password" required className="h-11 bg-white/50 dark:bg-slate-950/50" />
                  </div>
                  {error && <div className="text-sm text-destructive font-semibold bg-destructive/10 p-3 rounded-md">{error}</div>}
                  <Button type="submit" className="w-full h-11 text-base font-bold tracking-tight shadow-lg hover:shadow-xl transition-all" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
