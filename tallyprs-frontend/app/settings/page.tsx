"use client";

import { useAuth } from "@/lib/auth/authContext";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();

  function logoutClicked() {
    logout();
    router.push("/login");
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <button
        onClick={logoutClicked}
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Logout
      </button>
    </main>
  );
}
