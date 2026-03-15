"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Street Monitor" },
  { href: "/wards", label: "Wards & Candidates" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="h-10 flex items-center gap-6 px-4 bg-gray-900 text-sm shrink-0">
      <span className="font-semibold text-white mr-2">Lambeth Cyclists</span>
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`transition-colors ${
            pathname === href
              ? "text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
