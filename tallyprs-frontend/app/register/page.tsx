"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser, loginUser } from "@/services/authService";
import { useAuth } from "@/lib/auth/authContext";

export default function RegisterPage() {
  const router = useRouter();

  const { login } = useAuth(); // <--- Moved this out of handleSubmit!
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await registerUser({
        email,
        username,
        password,
      });

      login(result.accessToken, result.refreshToken);
      localStorage.setItem("currentUserId", result.user.id);
      localStorage.setItem("username", result.user.userName);
      localStorage.setItem("email", result.user.email);

      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 border rounded p-6"
      >
        <h1 className="text-2xl font-bold">Register</h1>

        <input
          className="w-full border rounded p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full border rounded p-2"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </main>
  );
}
