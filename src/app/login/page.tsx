"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ultimategraphics.com");
  const [password, setPassword] = useState("Admin@UG2026");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@ultimategraphics.com");
    setPassword("Admin@UG2026");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Signature Brand Accent Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-gradient-to-r from-cyan-500/10 via-rose-500/10 to-orange-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl mb-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center">
              <Image
                src="/logos/symbol-logo.jpeg"
                alt="UG Emblem"
                width={40}
                height={40}
                unoptimized
                className="w-full h-full object-cover"
              />
            </div>
            <Image
              src="/logos/main-logo.png"
              alt="Ultimate Graphics"
              width={160}
              height={40}
              priority
              className="h-8 w-auto object-contain brightness-105"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Billing Management System
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quotations • Proformas • GST Invoices • Payment Ledger
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/90 border-slate-800 backdrop-blur-md shadow-2xl">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-5 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ultimategraphics.com"
                    className="pl-9 bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500 text-xs focus-visible:ring-cyan-500 h-10"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 pr-9 bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500 text-xs focus-visible:ring-cyan-500 h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="brand"
                className="w-full mt-2 h-10 text-xs font-semibold gap-2 shadow-lg shadow-cyan-950/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Billing Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Authorized Signatory Portal</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Reset Credentials</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-slate-500">
          Ultimate Graphics • 16 Years of Signage & Fabrication Excellence
        </div>
      </div>
    </div>
  );
}
