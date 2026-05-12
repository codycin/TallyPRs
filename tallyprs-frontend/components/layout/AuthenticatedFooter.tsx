"use client";

import Footer from "./Footer";
import { useAuth } from "@/lib/auth/authContext";

export default function AuthenticatedFooter() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  return <Footer />;
}
