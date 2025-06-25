"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { id: "supervisor", label: "Supervisor", href: "/" },
    { id: "math", label: "Calculator", href: "/calculator" },
    { id: "file", label: "File Manager", href: "/file" },
    { id: "web", label: "Web Research", href: "/web" },
    { id: "dev", label: "Developer", href: "/dev" },
    { id: "data", label: "Data Manager", href: "/data" },
    { id: "comms", label: "Communicator", href: "/comms" },
    { id: "memory", label: "Knowledge Keeper", href: "/memory" },
  ];

  return (
    <nav className="bg-[#333333] border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-[#00d992]">
                VoltAgent
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? "border-[#00d992] text-white"
                      : "border-transparent text-gray-300 hover:border-gray-500 hover:text-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
