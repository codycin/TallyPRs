import Link from "next/link";
import tallyPRs_Logo from "@/public/tallyPRs_Logo.png";

export default function NavbarGuest() {
  return (
    <nav className="border-b px-6 py-2 flex items-center justify-between">
      <Link href="/register" className="text-xl font-bold">
        <img
          src={tallyPRs_Logo.src}
          alt="TallyPRs Logo"
          className="h-16 w-auto"
        />
      </Link>

      <div className="flex gap-4">
        <Link href="/login">Login</Link>
        <Link href="/register">Register</Link>
      </div>
    </nav>
  );
}
