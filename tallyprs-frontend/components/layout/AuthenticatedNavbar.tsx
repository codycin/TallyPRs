"use client";

import Navbar from "./Navbar";
import NavbarGuest from "./NavbarGuest";
import { useAuth } from "@/lib/auth/authContext";

export default function AuthenticatedNavbar() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return <NavbarGuest />;

  return <Navbar />;
}
