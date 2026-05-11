"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/authService";
import { useAuth } from "@/lib/auth/authContext";

export default function LoginPage() {
  const router = useRouter();

  // 1. ALL HOOKS GO HERE AT THE TOP!
  const { login } = useAuth(); // <--- Moved this out of handleSubmit!
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. Your functions go below the hooks
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser({
        emailOrUsername,
        password,
      });

      // 3. Use the login function down here
      login(result.accessToken, result.refreshToken);
      localStorage.setItem("currentUserId", result.user.id);
      localStorage.setItem("username", result.user.userName);
      localStorage.setItem("email", result.user.email);
      localStorage.setItem("role", result.user.role);

      router.push("/home");
    } catch (err) {
      console.error(err);
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  }

  // 4. Render your UI
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 border rounded p-6"
      >
        <h1 className="text-2xl font-bold">Login</h1>

        <input
          className="w-full border rounded p-2"
          type="text" // <--- Changed from "emailorusername" to "text"
          placeholder="Email or Username"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
          required
        />

        <input
          className="w-full border rounded p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full border rounded p-2 font-medium"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
