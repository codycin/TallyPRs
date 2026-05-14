"use client";
import HomeFeedClient from "@/components/feed/HomeFeedClient";
import { redirect } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { isLoggedIn, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isAuthLoading, isLoggedIn, router]);

  if (isAuthLoading) {
    return null;
  }

  if (!isLoggedIn) {
    return null;
  }

  return <HomeFeedClient />;
}
