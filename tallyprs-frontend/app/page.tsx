"use client";
import HomeFeedClient from "@/components/feed/HomeFeedClient";
import { redirect } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";

export default function HomePage() {
  const isLoggedIn = useAuth().isLoggedIn;

  if (!isLoggedIn) {
    redirect("/login");
  }

  return <HomeFeedClient />;
}
