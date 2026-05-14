import { BiHomeAlt2 } from "react-icons/bi";
import { BiUser } from "react-icons/bi";
import { BiPlusCircle } from "react-icons/bi";

import Link from "next/link";

export default function Footer() {
  return (
    <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-lg -translate-x-1/2 border-t border-gray-800 bg-black p-4 shadow-sm">
      <div className="flex items-center justify-center space-x-20">
        <Link href="/create">
          <BiPlusCircle className=" w-6 h-6" />
        </Link>
        <Link href="/">
          <BiHomeAlt2 className=" w-6 h-6" />
        </Link>
        <Link href="/profile">
          <BiUser className=" w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
