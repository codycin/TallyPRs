"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/authService";
import { useAuth } from "@/lib/auth/authContext";
import Link from "next/link";
import { BiUser, BiLockAlt, BiLogIn, BiErrorCircle } from "react-icons/bi";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser({
        emailOrUsername,
        password,
      });

      login(result.accessToken, result.refreshToken);
      localStorage.setItem("currentUserId", result.user.id);
      localStorage.setItem("username", result.user.userName);
      localStorage.setItem("email", result.user.email);
      localStorage.setItem("role", result.user.role);

      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-6 py-12 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-8 shadow-2xl shadow-black/40"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <BiLogIn className="text-3xl" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Login to continue tracking your PRs.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <BiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-zinc-500" />
            <input
              className="w-full rounded-xl border border-white/10 bg-black px-11 py-3 text-base sm:text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10"
              type="text"
              placeholder="Email or Username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <BiLockAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-zinc-500" />
            <input
              className="w-full rounded-xl border border-white/10 bg-black px-11 py-3 text-base sm:text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            <BiErrorCircle className="mt-0.5 shrink-0 text-lg" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <BiLogIn className="text-xl" />
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-red-400 hover:text-red-300"
          >
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}
